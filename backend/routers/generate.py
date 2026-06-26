import json
import os
from typing import Iterator, Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import GenerateRequest
from prompts import prd_prompt, spec_prompt, summary_prompt, userflow_prompt, wireframe_prompt
from services import claude_service, file_parser, supabase_service

router = APIRouter()

ADMIN_OUTPUT_TYPES = {"prd", "spec", "userflow", "wireframe"}


def _wireframe_enabled() -> bool:
    return os.environ.get("ENABLE_WIREFRAME", "true").lower() != "false"


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _require_confirmed(payload: GenerateRequest) -> None:
    if payload.output_type not in ADMIN_OUTPUT_TYPES:
        return
    if not payload.request_id:
        raise HTTPException(status_code=400, detail="먼저 요약을 생성하여 요청을 확정해야 합니다.")
    status = supabase_service.get_request_status(payload.request_id)
    if status != "confirmed":
        raise HTTPException(
            status_code=400, detail="요청자가 확정하기 전에는 해당 Output을 생성할 수 없습니다."
        )


def _build_prompt(payload: GenerateRequest, user_input: str, answers_text: str) -> str:
    if payload.output_type == "summary":
        return summary_prompt.build_prompt(payload.features, user_input, answers_text)

    if payload.output_type == "prd":
        return prd_prompt.build_prompt(payload.features, user_input, answers_text)

    if payload.output_type == "spec":
        if not payload.prd_content:
            raise HTTPException(status_code=400, detail="기능명세서 생성에는 prd_content가 필요합니다.")
        return spec_prompt.build_prompt(payload.prd_content, user_input)

    if payload.output_type == "userflow":
        if not payload.spec_content:
            raise HTTPException(status_code=400, detail="유저플로우 생성에는 spec_content가 필요합니다.")
        return userflow_prompt.build_prompt(payload.spec_content)

    if payload.output_type == "wireframe":
        if not _wireframe_enabled():
            raise HTTPException(
                status_code=400, detail="현재 MVP 단계에서는 와이어프레임 생성을 지원하지 않습니다."
            )
        if not payload.userflow_content:
            raise HTTPException(
                status_code=400, detail="와이어프레임 생성에는 userflow_content가 필요합니다."
            )
        return wireframe_prompt.build_prompt(payload.userflow_content)

    raise HTTPException(status_code=400, detail=f"알 수 없는 output_type: {payload.output_type}")


def _generate_stream(payload: GenerateRequest, user_id: str, prompt_text: str) -> Iterator[str]:
    if payload.request_id:
        request_id = payload.request_id
    else:
        request_id = supabase_service.create_request(
            user_id=user_id,
            text=payload.text,
            features=payload.features,
            interview_answers=[a.model_dump() for a in (payload.interview_answers or [])],
            file_paths=payload.file_paths,
        )
        yield _sse("request_created", {"request_id": request_id})

    output_type = payload.output_type

    if output_type == "summary":
        yield _sse("summary_start", {})
        try:
            result = claude_service.generate_summary(prompt_text)
        except Exception as exc:
            yield _sse("error", {"output_type": "summary", "message": str(exc)})
            return
        supabase_service.save_output(request_id, "summary", result)
        yield _sse("summary_done", {"content": result})
        yield _sse("complete", {})
        return

    yield _sse(f"{output_type}_start", {})
    chunks = []
    try:
        for chunk in claude_service.stream_completion(prompt_text):
            chunks.append(chunk)
            yield _sse(f"{output_type}_chunk", {"content": chunk})
    except Exception as exc:
        yield _sse("error", {"output_type": output_type, "message": str(exc)})
        return

    full_content = "".join(chunks)
    supabase_service.save_output(request_id, output_type, {"content": full_content})
    yield _sse(f"{output_type}_done", {"content": full_content})
    yield _sse("complete", {})


@router.post("/api/generate")
def generate(payload: GenerateRequest, authorization: Optional[str] = Header(default=None)):
    user_id = supabase_service.get_user_id_from_token(authorization)
    _require_confirmed(payload)

    file_text, _ = file_parser.gather_file_context(payload.file_paths)
    user_input = "\n\n".join(filter(None, [payload.text, file_text]))
    answers_text = "\n".join(
        f"{a.id}: {a.answer}" for a in (payload.interview_answers or [])
    )

    # 사전에 prompt를 만들어두면 잘못된 output_type/누락된 prior content를
    # 스트리밍 시작 전에 일반 HTTP 에러로 깔끔하게 응답할 수 있다.
    prompt_text = _build_prompt(payload, user_input, answers_text)

    return StreamingResponse(
        _generate_stream(payload, user_id, prompt_text), media_type="text/event-stream"
    )
