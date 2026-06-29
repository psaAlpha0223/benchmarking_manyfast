from fastapi import APIRouter, BackgroundTasks, HTTPException

from models.schemas import (
    ConfirmPayload,
    ConfirmResponse,
    RequestUpdateResponse,
    UpdateRequestPayload,
    UpdateSummaryPayload,
)
from services import notion_service, supabase_service

router = APIRouter()


def _require_drafting(request_id: str) -> None:
    if supabase_service.get_request_status(request_id) != "drafting":
        raise HTTPException(status_code=403, detail="확정된 요청은 더 이상 수정할 수 없습니다.")


@router.patch("/api/requests/{request_id}", response_model=RequestUpdateResponse)
def update_request(request_id: str, payload: UpdateRequestPayload):
    _require_drafting(request_id)
    return supabase_service.update_request(
        request_id=request_id,
        pain_point=payload.pain_point.model_dump(),
        file_paths=payload.file_paths,
    )


@router.delete("/api/requests/{request_id}", status_code=204)
def delete_request(request_id: str):
    _require_drafting(request_id)
    supabase_service.delete_request(request_id)


@router.patch("/api/requests/{request_id}/summary", response_model=UpdateSummaryPayload)
def update_summary(request_id: str, payload: UpdateSummaryPayload):
    return supabase_service.update_summary(request_id, payload.model_dump())


@router.post("/api/requests/{request_id}/confirm", response_model=ConfirmResponse)
def confirm_request(
    request_id: str, payload: ConfirmPayload, background_tasks: BackgroundTasks
):
    result = supabase_service.confirm_request(request_id, payload.confirmed_features)
    background_tasks.add_task(notion_service.generate_prd_and_push, request_id)
    return result
