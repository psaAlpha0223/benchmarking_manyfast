import json
from typing import Iterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import GenerateRequest
from prompts import pain_point_formatter, summary_prompt
from services import claude_service, file_parser, supabase_service

router = APIRouter()


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _build_pain_point_text(payload: GenerateRequest) -> str:
    pain_point_text = pain_point_formatter.format_pain_point(payload.pain_point.model_dump())
    file_text, _ = file_parser.gather_file_context(payload.file_paths)
    if file_text:
        pain_point_text = f"{pain_point_text}\n\n[첨부 파일 내용]\n{file_text}"
    return pain_point_text


def _generate_stream(payload: GenerateRequest, prompt_text: str) -> Iterator[str]:
    if payload.request_id:
        request_id = payload.request_id
    else:
        request_id = supabase_service.create_request(
            pain_point=payload.pain_point.model_dump(),
            file_paths=payload.file_paths,
            team=payload.team,
            submitter_name=payload.submitter_name,
        )
        yield _sse("request_created", {"request_id": request_id})

    yield _sse("summary_start", {})
    try:
        result = claude_service.generate_summary(prompt_text)
    except Exception as exc:
        print(f"[generate] summary 생성 실패 (request_id={request_id}): {exc}", flush=True)
        yield _sse("error", {"output_type": "summary", "message": str(exc)})
        return
    supabase_service.save_output(request_id, "summary", result)
    yield _sse("summary_done", {"content": result})
    yield _sse("complete", {})


@router.post("/api/generate")
def generate(payload: GenerateRequest):
    if not payload.pain_point:
        raise HTTPException(status_code=400, detail="pain_point가 필요합니다.")

    prompt_text = summary_prompt.build_prompt(_build_pain_point_text(payload))

    return StreamingResponse(
        _generate_stream(payload, prompt_text), media_type="text/event-stream"
    )
