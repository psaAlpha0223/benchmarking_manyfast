"""요청자가 확정한 요청을 인텔리전스팀 협업 노션 데이터베이스에 새 행으로 적재한다.

기존에 쌓여 있는 행은 절대 읽거나 수정하지 않는다 — 오직 새 행 추가(append)만 수행한다.
컬럼명은 실제 노션 데이터베이스 스키마와 1:1로 맞춰야 하므로, 운영 중 실제 속성명이
다르면 아래 PROP_* 상수만 고치면 된다.
"""

import os

import httpx

from prompts import pain_point_formatter, prd_prompt
from services import claude_service, notion_blocks, supabase_service

NOTION_VERSION = "2022-06-28"
NOTION_API_BASE = "https://api.notion.com/v1"

# 데이터베이스의 실제 속성(컬럼)명 — 노션 쪽 컬럼명이 바뀌면 여기만 수정하면 된다.
PROP_TITLE = "원하는 기능 한줄요약"
PROP_STATUS = "상태"
PROP_TEAM = "팀 구분"
PROP_SUBMITTER = "신청자"  # people 타입 — 노션 워크스페이스 멤버 검색 결과로 채움
PROP_ASSIGNEE = "담당자"  # people 타입 — 인텔리전스팀 3인을 기본값으로 채움
PROP_PRD = "PRD"

STATUS_RECEIVED = "신청접수"

# 담당자 기본값 (인텔리전스팀). 워크스페이스 멤버가 바뀌면 여기 ID도 같이 갱신해야 한다.
DEFAULT_ASSIGNEE_IDS = [
    "18681b4f-7e3e-4fc4-a607-3efa2615aa06",  # 정연이 인텔리전스팀
    "383d872b-594c-810e-abf6-0002796bfa11",  # 박선애 인텔리전스팀
    "38ad872b-594c-81c0-96a6-000217feaf7d",  # 양재현 인텔리전스팀
]


def _token() -> str:
    return os.environ["NOTION_API_KEY"]


def _database_id() -> str:
    return os.environ["NOTION_DATABASE_ID"]


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_token()}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _notion_post(path: str, body: dict) -> dict:
    res = httpx.post(f"{NOTION_API_BASE}{path}", headers=_headers(), json=body, timeout=30)
    if res.status_code >= 400:
        raise RuntimeError(f"Notion API 오류 ({path}): {res.status_code} {res.text}")
    return res.json()


def _notion_patch(path: str, body: dict) -> dict:
    res = httpx.patch(f"{NOTION_API_BASE}{path}", headers=_headers(), json=body, timeout=30)
    if res.status_code >= 400:
        raise RuntimeError(f"Notion API 오류 ({path}): {res.status_code} {res.text}")
    return res.json()


def _append_children_chunked(block_id: str, blocks: list[dict]) -> None:
    for i in range(0, len(blocks), 100):
        chunk = blocks[i : i + 100]
        _notion_patch(f"/blocks/{block_id}/children", {"children": chunk})


def _notion_get(path: str, params: dict | None = None) -> dict:
    res = httpx.get(f"{NOTION_API_BASE}{path}", headers=_headers(), params=params, timeout=30)
    if res.status_code >= 400:
        raise RuntimeError(f"Notion API 오류 ({path}): {res.status_code} {res.text}")
    return res.json()


def _list_workspace_users() -> list[dict]:
    users: list[dict] = []
    cursor: str | None = None
    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor
        data = _notion_get("/users", params)
        users.extend(u for u in data.get("results", []) if u.get("type") == "person")
        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")
    return users


def _find_submitter_user_id(submitter_name: str | None, team: str | None) -> str | None:
    if not submitter_name:
        return None
    candidates = [u for u in _list_workspace_users() if (u.get("name") or "").startswith(submitter_name)]
    if team:
        team_matches = [u for u in candidates if team in (u.get("name") or "")]
        if team_matches:
            return team_matches[0]["id"]
    if len(candidates) == 1:
        return candidates[0]["id"]
    return None


def _title(pain_point: dict, service_name: str | None = None) -> str:
    if service_name and service_name.strip():
        return service_name.strip()[:200]
    text = (pain_point or {}).get("feature_request") or "(제목 없음)"
    return text.strip().splitlines()[0][:200]


def create_request_row(request: dict, title: str) -> str:
    pain_point = request.get("pain_point") or {}
    properties = {
        PROP_TITLE: {"title": [{"type": "text", "text": {"content": title}}]},
        PROP_STATUS: {"status": {"name": STATUS_RECEIVED}},
    }
    if request.get("team"):
        properties[PROP_TEAM] = {"select": {"name": request["team"]}}

    submitter_user_id = _find_submitter_user_id(request.get("submitter_name"), request.get("team"))
    if submitter_user_id:
        properties[PROP_SUBMITTER] = {"people": [{"id": submitter_user_id}]}

    properties[PROP_ASSIGNEE] = {"people": [{"id": uid} for uid in DEFAULT_ASSIGNEE_IDS]}

    body_blocks = notion_blocks.markdown_to_blocks(pain_point_formatter.to_notion_markdown(pain_point))

    page = _notion_post(
        "/pages",
        {
            "parent": {"database_id": _database_id()},
            "icon": {"type": "emoji", "emoji": "📮"},
            "properties": properties,
            "children": body_blocks[:100],
        },
    )
    page_id = page["id"]
    if len(body_blocks) > 100:
        _append_children_chunked(page_id, body_blocks[100:])
    return page_id


def create_prd_subpage(parent_page_id: str, title: str, prd_markdown: str) -> str:
    page_title = f"PRD - {title}"
    page = _notion_post(
        "/pages",
        {
            "parent": {"page_id": parent_page_id},
            "properties": {"title": {"title": [{"type": "text", "text": {"content": page_title}}]}},
        },
    )
    prd_page_id = page["id"]
    _append_children_chunked(prd_page_id, notion_blocks.markdown_to_blocks(prd_markdown))
    return prd_page_id


def set_prd_mention(row_page_id: str, prd_page_id: str) -> None:
    _notion_patch(
        f"/pages/{row_page_id}",
        {
            "properties": {
                PROP_PRD: {
                    "rich_text": [{"type": "mention", "mention": {"type": "page", "page": {"id": prd_page_id}}}]
                }
            }
        },
    )


def generate_prd_and_push(request_id: str) -> None:
    request = supabase_service.get_request(request_id)
    pain_point = request.get("pain_point") or {}
    summary = supabase_service.get_output(request_id, "summary") or {}
    service_name = (summary.get("summary_card") or {}).get("service_name")
    title = _title(pain_point, service_name)

    pain_point_text = pain_point_formatter.format_pain_point(pain_point)
    prompt_text = prd_prompt.build_prompt(pain_point_text)
    prd_markdown = "".join(claude_service.stream_completion(prompt_text))
    supabase_service.save_output(request_id, "prd", {"content": prd_markdown})

    row_page_id = create_request_row(request, title)
    prd_page_id = create_prd_subpage(row_page_id, title, prd_markdown)
    set_prd_mention(row_page_id, prd_page_id)
