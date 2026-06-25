from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from models.schemas import InterviewRequest, InterviewResponse, Question
from prompts import interview_prompt
from services import claude_service, file_parser, supabase_service

router = APIRouter()


@router.post("/api/interview", response_model=InterviewResponse)
def create_interview(
    payload: InterviewRequest, authorization: Optional[str] = Header(default=None)
):
    supabase_service.get_user_id_from_token(authorization)
    file_text, image_blocks = file_parser.gather_file_context(payload.file_paths)
    user_input = "\n\n".join(filter(None, [payload.text, file_text]))

    prompt_text = interview_prompt.build_prompt(payload.features, user_input)

    try:
        result = claude_service.generate_questions(prompt_text, image_blocks)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Claude 질문 생성 실패: {exc}")

    return InterviewResponse(questions=[Question(**q) for q in result["questions"]])
