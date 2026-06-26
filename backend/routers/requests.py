from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from models.schemas import (
    ConfirmPayload,
    ConfirmResponse,
    RequestDetail,
    RequestSummary,
    StatusUpdatePayload,
    StatusUpdateResponse,
    UpdateRequestPayload,
    UpdateSummaryPayload,
)
from services import supabase_service

router = APIRouter()


@router.get("/api/requests", response_model=list[RequestSummary])
def list_requests(authorization: Optional[str] = Header(default=None)):
    supabase_service.get_user_id_from_token(authorization)
    return supabase_service.list_requests()


@router.get("/api/requests/{request_id}", response_model=RequestDetail)
def get_request(request_id: str, authorization: Optional[str] = Header(default=None)):
    supabase_service.get_user_id_from_token(authorization)
    return supabase_service.get_request_detail(request_id)


@router.patch("/api/requests/{request_id}", response_model=RequestDetail)
def update_request(
    request_id: str,
    payload: UpdateRequestPayload,
    authorization: Optional[str] = Header(default=None),
):
    supabase_service.get_user_id_from_token(authorization)
    return supabase_service.update_request(
        request_id=request_id,
        text=payload.text,
        features=payload.features,
        interview_answers=[a.model_dump() for a in (payload.interview_answers or [])],
        file_paths=payload.file_paths,
    )


@router.delete("/api/requests/{request_id}", status_code=204)
def delete_request(request_id: str, authorization: Optional[str] = Header(default=None)):
    supabase_service.get_user_id_from_token(authorization)
    supabase_service.delete_request(request_id)


@router.patch("/api/requests/{request_id}/summary", response_model=UpdateSummaryPayload)
def update_summary(
    request_id: str,
    payload: UpdateSummaryPayload,
    authorization: Optional[str] = Header(default=None),
):
    supabase_service.get_user_id_from_token(authorization)
    return supabase_service.update_summary(request_id, payload.model_dump())


@router.post("/api/requests/{request_id}/confirm", response_model=ConfirmResponse)
def confirm_request(
    request_id: str,
    payload: ConfirmPayload,
    authorization: Optional[str] = Header(default=None),
):
    supabase_service.get_user_id_from_token(authorization)
    return supabase_service.confirm_request(request_id, payload.confirmed_features)


@router.patch("/api/requests/{request_id}/status", response_model=StatusUpdateResponse)
def update_status(
    request_id: str,
    payload: StatusUpdatePayload,
    authorization: Optional[str] = Header(default=None),
):
    user = supabase_service.get_user_from_token(authorization)
    if not (user.user_metadata or {}).get("is_admin"):
        raise HTTPException(status_code=403, detail="어드민만 상태를 변경할 수 있습니다.")
    return supabase_service.update_status(request_id, payload.status)
