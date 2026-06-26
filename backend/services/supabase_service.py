import os
from typing import Optional

from fastapi import HTTPException
from supabase import Client, create_client

BUCKET = "request-files"
OUTPUT_ORDER = ["summary", "prd", "spec", "userflow", "wireframe"]
ADMIN_STATUSES = {"in_review", "completed"}

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
    return _client


def get_user_from_token(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증 토큰이 필요합니다.")
    token = authorization.removeprefix("Bearer ")
    try:
        response = get_client().auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    if not response or not response.user:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    return response.user


def get_user_id_from_token(authorization: Optional[str]) -> str:
    return get_user_from_token(authorization).id


def is_admin_user(authorization: Optional[str]) -> bool:
    user = get_user_from_token(authorization)
    return bool((user.user_metadata or {}).get("is_admin"))


def download_file(path: str) -> bytes:
    return get_client().storage.from_(BUCKET).download(path)


def create_request(
    user_id: str,
    text: str | None,
    features: list[str],
    interview_answers: list[dict] | None,
    file_paths: list[str] | None,
) -> str:
    result = (
        get_client()
        .table("requests")
        .insert(
            {
                "user_id": user_id,
                "text": text,
                "features": features,
                "interview_answers": interview_answers,
                "file_paths": file_paths,
            }
        )
        .execute()
    )
    return result.data[0]["id"]


def save_output(request_id: str, output_type: str, content: dict) -> None:
    client = get_client()
    client.table("outputs").delete().eq("request_id", request_id).eq("type", output_type).execute()
    client.table("outputs").insert(
        {
            "request_id": request_id,
            "type": output_type,
            "content": content,
        }
    ).execute()


def list_requests() -> list[dict]:
    requests = (
        get_client()
        .table("requests")
        .select("id, text, features, status, created_at")
        .order("created_at", desc=True)
        .execute()
        .data
    )
    if not requests:
        return []

    request_ids = [r["id"] for r in requests]
    outputs = (
        get_client()
        .table("outputs")
        .select("request_id, type")
        .in_("request_id", request_ids)
        .execute()
        .data
    )
    types_by_request: dict[str, set[str]] = {}
    for o in outputs:
        types_by_request.setdefault(o["request_id"], set()).add(o["type"])

    for r in requests:
        r["completed_outputs"] = sorted(
            types_by_request.get(r["id"], set()), key=OUTPUT_ORDER.index
        )
    return requests


def get_request_status(request_id: str) -> str:
    result = get_client().table("requests").select("status").eq("id", request_id).execute().data
    if not result:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
    return result[0]["status"]


def get_request_detail(request_id: str) -> dict:
    requests = get_client().table("requests").select("*").eq("id", request_id).execute().data
    if not requests:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    outputs = (
        get_client()
        .table("outputs")
        .select("type, content, created_at")
        .eq("request_id", request_id)
        .execute()
        .data
    )
    return {**requests[0], "outputs": outputs}


def update_request(
    request_id: str,
    text: str | None,
    features: list[str],
    interview_answers: list[dict] | None,
    file_paths: list[str] | None,
) -> dict:
    client = get_client()
    existing = client.table("requests").select("id").eq("id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    client.table("requests").update(
        {
            "text": text,
            "features": features,
            "interview_answers": interview_answers,
            "file_paths": file_paths,
            "status": "drafting",
            "confirmed_features": None,
        }
    ).eq("id", request_id).execute()

    # 원본 요청 내용이 바뀌면 이전 PRD 기반으로 만들어진 기능명세서/유저플로우/와이어프레임도 더 이상 유효하지 않다
    client.table("outputs").delete().eq("request_id", request_id).execute()

    return get_request_detail(request_id)


def delete_request(request_id: str) -> None:
    client = get_client()
    existing = client.table("requests").select("id").eq("id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    client.table("outputs").delete().eq("request_id", request_id).execute()
    client.table("requests").delete().eq("id", request_id).execute()


def confirm_request(request_id: str, confirmed_features: list[str]) -> dict:
    client = get_client()
    existing = client.table("requests").select("id").eq("id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    client.table("requests").update(
        {"status": "confirmed", "confirmed_features": confirmed_features}
    ).eq("id", request_id).execute()

    return {
        "request_id": request_id,
        "status": "confirmed",
        "confirmed_features": confirmed_features,
    }


def update_summary(request_id: str, content: dict) -> dict:
    if get_request_status(request_id) != "drafting":
        raise HTTPException(status_code=400, detail="확정된 요청은 요약을 수정할 수 없습니다.")
    save_output(request_id, "summary", content)
    return content


def update_status(request_id: str, status: str) -> dict:
    if status not in ADMIN_STATUSES:
        raise HTTPException(status_code=400, detail=f"허용되지 않은 상태값: {status}")

    client = get_client()
    existing = client.table("requests").select("id").eq("id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    client.table("requests").update({"status": status}).eq("id", request_id).execute()
    return {"request_id": request_id, "status": status}
