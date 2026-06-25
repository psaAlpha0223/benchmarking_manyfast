from typing import Optional

from fastapi import APIRouter, Header

from models.schemas import RequestDetail, RequestSummary, UpdateRequestPayload
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
