TEMPLATE = """아래 프로젝트 설명과 PRD를 바탕으로 기능명세서를 JSON 형식으로 작성하세요.

출력 형식:
{{
  "features": [
    {{
      "id": "F001",
      "category": "대분류명",
      "name": "기능명",
      "description": "기능 설명",
      "sub_features": [
        {{
          "id": "F001-1",
          "name": "세부 기능명",
          "description": "세부 설명",
          "priority": "필수 / 중요 / 선택",
          "notes": "추가 코멘트"
        }}
      ]
    }}
  ]
}}

JSON 외의 다른 텍스트는 출력하지 마세요.

---
[PRD]
{prd_content}

[프로젝트 설명]
{user_input}"""


def build_prompt(prd_content: str, user_input: str) -> str:
    return TEMPLATE.format(
        prd_content=prd_content,
        user_input=user_input or "(자유 텍스트 없음, 첨부 파일 참고)",
    )
