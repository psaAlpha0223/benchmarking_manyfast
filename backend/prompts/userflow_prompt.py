TEMPLATE = """아래 기능명세서를 바탕으로 핵심 기능의 유저플로우를 Mermaid flowchart 코드로 작성하세요.

규칙:
- 각 주요 기능별로 별도 flowchart 블록 작성
- 노드 ID는 영문 알파벳+숫자 조합 (예: A1, B2)
- 노드 텍스트는 한국어
- 분기(조건)는 菱形 노드로 표현
- 엣지 라벨(예: -->|라벨|)은 한 줄로 작성하고 파이프(|)나 줄바꿈을 포함하지 않는다
- 노드 텍스트(대괄호 [] 안)에 경로나 URL처럼 슬래시(/)가 포함되면 큰따옴표로 감싼다 (예: D3["/admin/login 으로 리다이렉트"])
- 코드 블록(```mermaid ... ```) 형식으로 출력

예시:
```mermaid
flowchart TD
    A1[시작] --> B1[텍스트 입력]
    B1 --> C1{{파일 첨부 여부}}
    C1 -->|있음| D1[파일 업로드]
    C1 -->|없음| E1[생성 요청]
```

---
[기능명세서 JSON]
{spec_content}"""


def build_prompt(spec_content: str) -> str:
    return TEMPLATE.format(spec_content=spec_content)
