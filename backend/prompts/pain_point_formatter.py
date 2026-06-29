LABELS = {
    "feature_request": "1. 원하는 기능",
    "current_process": "2. 기존 업무 프로세스",
    "pain_points": "3. 가장 불편한 점",
    "desired_change": "4. 바뀌었으면 하는 모습",
    "required_outputs": "5. 반드시 필요한 결과물",
    "current_tools": "6. 현재 사용 중인 도구",
    "input_data_types": "7. 입력 데이터 형태",
    "sample_link": "8. 샘플 파일/예시 링크",
    "dev_preference": "9. 선호하는 자동화/개발 방식",
    "constraints": "10. 제약 사항 및 참고사항",
}


def _join(values: list[str] | None, other: str | None) -> str:
    items = list(values or [])
    if other:
        items.append(other)
    return ", ".join(items) if items else "(미입력)"


def format_pain_point(pain_point: dict) -> str:
    lines = [
        f"**{LABELS['feature_request']}**\n{pain_point.get('feature_request') or '(미입력)'}",
        f"**{LABELS['current_process']}**\n{pain_point.get('current_process') or '(미입력)'}",
        f"**{LABELS['pain_points']}**\n{_join(pain_point.get('pain_points'), pain_point.get('pain_points_other'))}",
        f"**{LABELS['desired_change']}**\n{pain_point.get('desired_change') or '(미입력)'}",
        f"**{LABELS['required_outputs']}**\n{_join(pain_point.get('required_outputs'), pain_point.get('required_outputs_other'))}",
        f"**{LABELS['current_tools']}**\n{_join(pain_point.get('current_tools'), pain_point.get('current_tools_other'))}",
        f"**{LABELS['input_data_types']}**\n{_join(pain_point.get('input_data_types'), pain_point.get('input_data_types_other'))}",
        f"**{LABELS['sample_link']}**\n{pain_point.get('sample_link') or '(없음)'}",
        f"**{LABELS['dev_preference']}**\n{_join(pain_point.get('dev_preference'), None)}",
        f"**{LABELS['constraints']}**\n{pain_point.get('constraints') or '(없음)'}",
    ]
    return "\n\n".join(lines)


# --- 노션 페이지 본문용: 요청 폼(PainPointForm.tsx)과 완전히 동일한 마크다운 구조 ---

QUESTION_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

PAIN_POINT_OPTIONS = [
    "단순 반복성 업무라서 실무자의 시간을 투입하기 아깝다",
    "절대량(혹은 걸리는 시간)이 너무 많다",
    "실무자가 퀄리티를 맞추기 어려워 피드백에 시간을 많이 쓴다",
    "실수(오류)가 자주 발생한다",
    "특정 담당자에게만 지식이 몰려 있어, 그가 없으면 업무 진행이 안된다",
    "사용하는 툴들이 서로 연동되지 않아 동일 데이터를 다른 양식으로 매번 바꿔야 한다",
]
REQUIRED_OUTPUTS_OPTIONS = ["정리된 엑셀/시트", "자동화된 프로세스", "시각화(차트/그래프)", "웹 화면/툴"]
CURRENT_TOOLS_OPTIONS = ["Excel / Google Sheets", "Notion", "구글폼/설문 폼"]
INPUT_DATA_TYPES_OPTIONS = ["엑셀 파일", "PDF", "텍스트", "오디오/비디오", "API/DB", "아직 정리 안 됨"]
DEV_PREFERENCE_OPTIONS = [
    "단순 엑셀 함수나 매크로도 괜찮아요",
    "자동화 툴 (Zapier, Make 등)",
    "간단한 웹/앱 개발",
    "잘 모르겠음 (제안에 따름)",
]


def _checkbox_lines(
    options: list[str], selected: list[str] | None, other: str | None = None, include_other: bool = True
) -> list[str]:
    selected = selected or []
    lines = [f"- [{'x' if opt in selected else ' '}] {opt}" for opt in options]
    if include_other:
        lines.append(f"- [{'x' if other else ' '}] 기타 : {other or ''}".rstrip())
    return lines


def to_notion_markdown(pain_point: dict) -> str:
    sample_link = pain_point.get("sample_link")
    lines = [
        "## Pain Point",
        "",
        f"### {QUESTION_EMOJIS[0]} 어떤 기능을 원하시나요? *",
        "",
        pain_point.get("feature_request") or "(미입력)",
        "",
        f"### {QUESTION_EMOJIS[1]} 기존에는 위 업무를 어떤 프로세스로 진행했나요? *",
        "",
        pain_point.get("current_process") or "(미입력)",
        "",
        f"### {QUESTION_EMOJIS[2]} 어떤 점이 가장 불편한가요? *",
        "",
        *_checkbox_lines(PAIN_POINT_OPTIONS, pain_point.get("pain_points"), pain_point.get("pain_points_other")),
        "",
        "---",
        "",
        "## Solution",
        "",
        f"### {QUESTION_EMOJIS[3]} 해당 업무가 어떻게 바뀌면 좋을까요?",
        "",
        pain_point.get("desired_change") or "(미입력)",
        "",
        f"### {QUESTION_EMOJIS[4]} 반드시 필요한 결과물은 무엇인가요?",
        "",
        *_checkbox_lines(
            REQUIRED_OUTPUTS_OPTIONS, pain_point.get("required_outputs"), pain_point.get("required_outputs_other")
        ),
        "",
        f"### {QUESTION_EMOJIS[5]} 현재 해당 작업을 진행할 때 사용하는 도구를 입력해주세요",
        "",
        *_checkbox_lines(
            CURRENT_TOOLS_OPTIONS, pain_point.get("current_tools"), pain_point.get("current_tools_other")
        ),
        "",
        f"### {QUESTION_EMOJIS[6]} 입력 데이터 형태",
        "",
        *_checkbox_lines(
            INPUT_DATA_TYPES_OPTIONS, pain_point.get("input_data_types"), pain_point.get("input_data_types_other")
        ),
        "",
        f"### {QUESTION_EMOJIS[7]} 샘플 파일 또는 예시 링크",
        "",
        f"[{sample_link}]({sample_link})" if sample_link else "(없음)",
        "",
        f"### {QUESTION_EMOJIS[8]} 자동화/개발 중 어떤 게 가장 필요한가요?",
        "",
        *_checkbox_lines(DEV_PREFERENCE_OPTIONS, pain_point.get("dev_preference"), include_other=False),
        "",
        f"### {QUESTION_EMOJIS[9]} 제약 사항 & 참고사항",
        "",
        pain_point.get("constraints") or "(없음)",
    ]
    return "\n".join(lines)
