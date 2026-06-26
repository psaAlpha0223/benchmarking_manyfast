TEMPLATE = """당신은 비개발자를 위한 서비스 요약 전문가입니다.
아래 프로젝트 설명과 주요 기능을 바탕으로 요청자가 본인의 요청이 올바르게 반영됐는지
직관적으로 확인할 수 있는 요약 카드와 기능 체크리스트를 JSON으로 작성하세요.

[작성 원칙]
- 기술 용어를 절대 사용하지 마세요.
- 요청자가 "맞다/다르다"를 즉시 판단할 수 있도록 짧고 명확하게 작성하세요.
- 서비스 목적은 1~2문장으로 압축하세요.
- 기능 목록은 요청자가 입력한 기능 태그를 기반으로 작성하되, 맥락상 자연스럽게 보완하세요.
- JSON 외의 다른 텍스트는 출력하지 마세요.

출력 형식:
{{
  "summary_card": {{
    "service_name": "서비스 이름 (간결하게)",
    "purpose": "이 서비스가 하는 일을 한 문장으로",
    "target_users": "주요 사용자 설명",
    "key_features": ["핵심 기능 1", "핵심 기능 2", "핵심 기능 3"]
  }},
  "feature_checklist": [
    {{
      "id": "FC001",
      "name": "기능명 (요청자 언어로)",
      "description": "이 기능이 어떤 역할을 하는지 한 줄 설명",
      "checked": true
    }}
  ]
}}

---
[주요 기능]
{features}

[질문 응답 내용]
{interview_answers}

[프로젝트 설명]
{user_input}"""


def build_prompt(features: list[str], user_input: str, interview_answers: str) -> str:
    return TEMPLATE.format(
        features=", ".join(features),
        interview_answers=interview_answers or "(응답 없음)",
        user_input=user_input or "(자유 텍스트 없음, 첨부 파일 참고)",
    )
