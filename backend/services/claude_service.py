import json
import os
import re
from typing import Iterator, Optional

from anthropic import Anthropic

SYSTEM_PROMPT = """당신은 B2B SaaS 기획 전문가입니다.
사용자가 제공하는 프로젝트 설명을 바탕으로 내부 AI 솔루션 기획 산출물을 작성합니다.
- 추측이 필요한 부분은 [가정: ...]으로 명시하세요.
- 전문 용어는 풀어서 설명하고, 실무에서 바로 사용 가능한 수준으로 작성하세요.
- 한국어로 작성하세요."""

_client: Optional[Anthropic] = None


def get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def _model() -> str:
    return os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")


def _max_tokens() -> int:
    return int(os.environ.get("MAX_TOKENS", 4096))


def _max_tokens_summary() -> int:
    return int(os.environ.get("MAX_TOKENS_SUMMARY", 1024))


def _build_content_blocks(prompt_text: str, image_blocks: Optional[list[dict]]) -> list[dict]:
    blocks = []
    for img in image_blocks or []:
        blocks.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": img["media_type"],
                    "data": img["base64_data"],
                },
            }
        )
    blocks.append({"type": "text", "text": prompt_text})
    return blocks


def generate_questions(prompt_text: str, image_blocks: Optional[list[dict]] = None) -> dict:
    client = get_client()
    message = client.messages.create(
        model=_model(),
        max_tokens=_max_tokens(),
        temperature=0,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_content_blocks(prompt_text, image_blocks)}],
    )
    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(json)?|```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


def generate_summary(prompt_text: str) -> dict:
    client = get_client()
    message = client.messages.create(
        model=_model(),
        max_tokens=_max_tokens_summary(),
        temperature=0,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_content_blocks(prompt_text, None)}],
    )
    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(json)?|```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)


def stream_completion(
    prompt_text: str, image_blocks: Optional[list[dict]] = None
) -> Iterator[str]:
    client = get_client()
    with client.messages.stream(
        model=_model(),
        max_tokens=_max_tokens(),
        temperature=0,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_content_blocks(prompt_text, image_blocks)}],
    ) as stream:
        for text in stream.text_stream:
            yield text
        final = stream.get_final_message()
        print(
            f"[claude_service] stop_reason={final.stop_reason} output_tokens={final.usage.output_tokens}",
            flush=True,
        )
