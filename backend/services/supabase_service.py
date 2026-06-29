import os

from fastapi import HTTPException
from supabase import Client, create_client

BUCKET = "request-files"

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
    return _client


def download_file(path: str) -> bytes:
    return get_client().storage.from_(BUCKET).download(path)


def create_request(
    pain_point: dict,
    file_paths: list[str] | None,
    team: str | None = None,
    submitter_name: str | None = None,
) -> str:
    result = (
        get_client()
        .table("requests")
        .insert(
            {
                "team": team,
                "submitter_name": submitter_name,
                "pain_point": pain_point,
                "features": [],
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


def get_request_status(request_id: str) -> str:
    result = get_client().table("requests").select("status").eq("id", request_id).execute().data
    if not result:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
    return result[0]["status"]


def get_output(request_id: str, output_type: str) -> dict | None:
    result = (
        get_client()
        .table("outputs")
        .select("content")
        .eq("request_id", request_id)
        .eq("type", output_type)
        .execute()
        .data
    )
    return result[0]["content"] if result else None


def get_request(request_id: str) -> dict:
    result = get_client().table("requests").select("*").eq("id", request_id).execute().data
    if not result:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
    return result[0]


def update_request(request_id: str, pain_point: dict, file_paths: list[str] | None) -> dict:
    client = get_client()
    existing = client.table("requests").select("id").eq("id", request_id).execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    client.table("requests").update(
        {
            "pain_point": pain_point,
            "file_paths": file_paths,
            "status": "drafting",
            "confirmed_features": None,
        }
    ).eq("id", request_id).execute()

    # 원본 요청 내용이 바뀌면 이전에 생성된 요약·PRD도 더 이상 유효하지 않다
    client.table("outputs").delete().eq("request_id", request_id).execute()

    return get_request(request_id)


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
