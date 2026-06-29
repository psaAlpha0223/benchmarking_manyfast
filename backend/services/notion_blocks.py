"""마크다운 텍스트를 Notion 블록 객체 배열로 변환한다.

Notion API의 rich_text 한 항목은 최대 2000자이고, 페이지 생성/children append 요청 하나당
블록은 최대 100개까지 보낼 수 있다. 청크 분할은 notion_service 쪽에서 처리한다.
"""

import re

MAX_RICH_TEXT_LEN = 2000

# [링크], **bold**, `code`, ~~strikethrough~~, *italic* 순서로 검사 (겹치는 * 문자 때문에 순서가 중요함)
_INLINE_PATTERN = re.compile(r"\[(.+?)\]\((.+?)\)|\*\*(.+?)\*\*|`(.+?)`|~~(.+?)~~|\*(.+?)\*")


def _chunk_by_utf16(content: str, limit: int) -> list[str]:
    """Notion의 2000자 제한은 UTF-16 코드 유닛 기준이라, 서로게이트 쌍(이모지 등)을
    포함한 문자열은 Python len()만으로 자르면 실제로는 limit을 넘을 수 있다."""
    if not content:
        return [""]
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for ch in content:
        ch_len = 2 if ord(ch) > 0xFFFF else 1
        if current_len + ch_len > limit and current:
            chunks.append("".join(current))
            current = []
            current_len = 0
        current.append(ch)
        current_len += ch_len
    if current:
        chunks.append("".join(current))
    return chunks


def _rich_text_run(content: str, annotations: dict | None = None, link: str | None = None) -> list[dict]:
    chunks = _chunk_by_utf16(content, MAX_RICH_TEXT_LEN)
    runs = []
    for chunk in chunks:
        run: dict = {"type": "text", "text": {"content": chunk}}
        if link:
            run["text"]["link"] = {"url": link}
        if annotations:
            run["annotations"] = annotations
        runs.append(run)
    return runs


def _rich_text(content: str) -> list[dict]:
    return _rich_text_run(content)


def _parse_inline(text: str) -> list[dict]:
    runs: list[dict] = []
    pos = 0
    for m in _INLINE_PATTERN.finditer(text):
        if m.start() > pos:
            runs.extend(_rich_text_run(text[pos : m.start()]))
        if m.group(1) is not None and m.group(2) is not None:
            runs.extend(_rich_text_run(m.group(1), link=m.group(2)))
        elif m.group(3) is not None:
            runs.extend(_rich_text_run(m.group(3), {"bold": True}))
        elif m.group(4) is not None:
            runs.extend(_rich_text_run(m.group(4), {"code": True}))
        elif m.group(5) is not None:
            runs.extend(_rich_text_run(m.group(5), {"strikethrough": True}))
        elif m.group(6) is not None:
            runs.extend(_rich_text_run(m.group(6), {"italic": True}))
        pos = m.end()
    if pos < len(text):
        runs.extend(_rich_text_run(text[pos:]))
    return runs or [{"type": "text", "text": {"content": ""}}]


def _paragraph(text: str) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": _parse_inline(text)}}


def _heading(level: int, text: str) -> dict:
    key = f"heading_{level}"
    return {"object": "block", "type": key, key: {"rich_text": _parse_inline(text)}}


def _quote(text: str) -> dict:
    return {"object": "block", "type": "quote", "quote": {"rich_text": _parse_inline(text)}}


def _bulleted_item(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": _parse_inline(text)},
    }


def _numbered_item(text: str) -> dict:
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": _parse_inline(text)},
    }


def _todo_item(text: str, checked: bool) -> dict:
    return {
        "object": "block",
        "type": "to_do",
        "to_do": {"rich_text": _parse_inline(text), "checked": checked},
    }


# Notion 코드 블록의 language는 고정된 값 중 하나여야 한다 (임의 문자열 거부됨).
_ALLOWED_CODE_LANGUAGES = {
    "abap", "abc", "agda", "arduino", "ascii art", "assembly", "bash", "basic", "bnf", "c", "c#", "c++",
    "clojure", "coffeescript", "coq", "css", "dart", "dhall", "diff", "docker", "ebnf", "elixir", "elm",
    "erlang", "f#", "flow", "fortran", "gherkin", "glsl", "go", "graphql", "groovy", "haskell", "hcl",
    "html", "idris", "java", "javascript", "json", "julia", "kotlin", "latex", "less", "lisp",
    "livescript", "llvm ir", "lua", "makefile", "markdown", "markup", "matlab", "mathematica",
    "mermaid", "nix", "notion formula", "objective-c", "ocaml", "pascal", "perl", "php", "plain text",
    "powershell", "prolog", "protobuf", "purescript", "python", "r", "racket", "reason", "ruby", "rust",
    "sass", "scala", "scheme", "scss", "shell", "smalltalk", "solidity", "sql", "swift", "toml",
    "typescript", "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml", "yaml",
    "java/c/c++/c#",
}

_LANGUAGE_ALIASES = {
    "env": "shell", "dotenv": "shell", "sh": "shell", "zsh": "shell",
    "txt": "plain text", "text": "plain text",
    "yml": "yaml", "ts": "typescript", "tsx": "typescript", "js": "javascript", "jsx": "javascript",
    "py": "python", "objc": "objective-c", "md": "markdown",
}


def _normalize_language(language: str) -> str:
    key = (language or "").strip().lower()
    if not key:
        return "plain text"
    key = _LANGUAGE_ALIASES.get(key, key)
    return key if key in _ALLOWED_CODE_LANGUAGES else "plain text"


def _code_block(text: str, language: str) -> dict:
    return {
        "object": "block",
        "type": "code",
        "code": {"rich_text": _rich_text(text), "language": _normalize_language(language)},
    }


def _table_row(cells: list[str]) -> dict:
    return {
        "object": "block",
        "type": "table_row",
        "table_row": {"cells": [_parse_inline(c.strip()) for c in cells]},
    }


def _is_table_separator(line: str) -> bool:
    return bool(re.fullmatch(r"\|?[\s:\-|]+\|?", line.strip())) and "-" in line


def _parse_table(lines: list[str], start: int) -> tuple[dict, int]:
    header_cells = [c for c in lines[start].strip().strip("|").split("|")]
    rows = [header_cells]
    i = start + 2  # 헤더 + 구분선 줄은 건너뜀
    while i < len(lines) and lines[i].strip().startswith("|"):
        rows.append([c for c in lines[i].strip().strip("|").split("|")])
        i += 1
    table_width = len(header_cells)
    block = {
        "object": "block",
        "type": "table",
        "table": {
            "table_width": table_width,
            "has_column_header": True,
            "has_row_header": False,
            "children": [_table_row(r[:table_width]) for r in rows],
        },
    }
    return block, i


def markdown_to_blocks(markdown_text: str) -> list[dict]:
    lines = markdown_text.replace("\r\n", "\n").split("\n")
    blocks: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped.startswith("```"):
            language = stripped[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1  # 닫는 ``` 건너뜀
            blocks.append(_code_block("\n".join(code_lines), language))
            continue

        if stripped.startswith("|") and i + 1 < len(lines) and _is_table_separator(lines[i + 1]):
            table_block, next_i = _parse_table(lines, i)
            blocks.append(table_block)
            i = next_i
            continue

        heading_match = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if heading_match:
            level = len(heading_match.group(1))
            blocks.append(_heading(level, heading_match.group(2)))
            i += 1
            continue

        if stripped in ("---", "***", "___"):
            i += 1
            continue

        quote_match = re.match(r"^>\s?(.*)$", stripped)
        if quote_match:
            blocks.append(_quote(quote_match.group(1)))
            i += 1
            continue

        todo_match = re.match(r"^[-*]\s+\[([ xX])\]\s*(.*)$", stripped)
        if todo_match:
            checked = todo_match.group(1).lower() == "x"
            blocks.append(_todo_item(todo_match.group(2), checked))
            i += 1
            continue

        bullet_match = re.match(r"^[-*]\s+(.*)$", stripped)
        if bullet_match:
            blocks.append(_bulleted_item(bullet_match.group(1)))
            i += 1
            continue

        numbered_match = re.match(r"^\d+\.\s+(.*)$", stripped)
        if numbered_match:
            blocks.append(_numbered_item(numbered_match.group(1)))
            i += 1
            continue

        blocks.append(_paragraph(stripped))
        i += 1

    return blocks
