TEMPLATE = """아래 유저플로우를 바탕으로 주요 화면의 와이어프레임을 HTML로 작성하세요.

규칙:
- 각 화면을 <section> 태그로 구분하고, data-page="화면명" 속성 추가
- 실제 색상 없이 회색(#eee, #ccc, #999) 계열만 사용하는 로우파이 와이어프레임
- Tailwind CSS CDN을 사용하여 스타일링
- 각 화면 상단에 화면명과 Description을 <div class="description"> 태그로 표시
- 전체 화면 목록을 최상단 <nav> 태그로 제공
- 완전한 HTML 문서(<!DOCTYPE html>부터 </html>까지) 형식으로 출력

---
[유저플로우 Mermaid 코드]
{userflow_content}"""


def build_prompt(userflow_content: str) -> str:
    return TEMPLATE.format(userflow_content=userflow_content)
