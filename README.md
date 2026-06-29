# AI 기획 자동화 서비스

> 본부 내 타 팀의 AI 솔루션·자동화 개발 요청을 구조화하고, AI가 PRD를 자동 생성해 인텔리전스팀의 노션 협업 데이터베이스로 바로 적재해주는 내부 기획 자동화 웹 서비스입니다.

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E)](https://supabase.com/)
[![Claude](https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-D97757)](https://www.anthropic.com/)
[![Notion API](https://img.shields.io/badge/Integration-Notion%20API-000000)](https://developers.notion.com/)

---

## 목차

- [왜 만들었나](#왜-만들었나)
- [무엇을 하는가](#무엇을-하는가)
- [전체 흐름](#전체-흐름)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [폴더 구조](#폴더-구조)
- [시작하기](#시작하기)
- [API 개요](#api-개요)
- [환경변수](#환경변수)
- [배포](#배포)
- [개발 규칙](#개발-규칙)
- [문서](#문서)

---

## 왜 만들었나

본부 내 타 팀이 인텔리전스팀에 AI 솔루션·자동화 개발을 요청할 때, 요청이 구두로 전달되거나 추상적인 한 줄 설명으로만 전달되는 경우가 많아 기획 단계에서 불필요한 핑퐁과 공수 낭비가 발생했습니다.

| 문제 | 해결 방안 |
|------|-----------|
| 요청이 추상적이고 구두로 전달되어 기획 공수 낭비 | 10개 문항으로 구성된 구조화된 **Pain Point 입력 폼**으로 요청을 구체화 |
| 기획 문서 포맷이 사람마다 달라 리뷰 비효율 발생 | AI가 표준 마크다운 템플릿으로 **PRD를 자동 생성** |
| 외부 툴 연동 여부를 매번 다시 확인해야 함 | "필요 결과물"·"현재 도구" 답변을 분석해 연동 방식·인증·주의사항을 **자동으로 구체화** |
| 검토를 위해 별도 화면에 로그인해야 해서 기존 노션 워크플로와 단절 | 확정 즉시 인텔리전스팀이 이미 쓰던 **노션 협업 DB에 자동 적재** |
| 요청자가 PRD 같은 기획 문서를 이해하기 어려움 | 요청자에게는 **서비스 요약 카드 + 기능 체크리스트**만 제공 |

## 무엇을 하는가

요청자(타 팀 구성원)는 로그인 없이 접속해서 10개 문항짜리 Pain Point 양식을 채웁니다. AI가 즉시 이해하기 쉬운 요약 카드와 기능 체크리스트를 만들어주고, 요청자가 내용을 확인한 뒤 "확정"을 누르면:

1. 백그라운드에서 Claude가 PRD 전문을 마크다운으로 생성하고
2. 인텔리전스팀이 이미 운영 중인 **노션 협업 데이터베이스**에 새 행을 추가하고 (📮 아이콘, 신청자/담당자 자동 매칭)
3. PRD 전문은 그 행의 하위 페이지로 만들어 행에서 바로 링크로 연결합니다.

요청자도, 인텔리전스팀도 이 서비스에 로그인하지 않습니다 — 검토는 모두 인텔리전스팀이 익숙한 노션에서 이뤄집니다.

## 전체 흐름

```
[요청자]                          [이 서비스]                         [인텔리전스팀]
   │                                  │                                    │
   ├─ 팀/이름 + Pain Point 10문항 입력 ─▶                                    │
   │  (체크박스 + 자유 텍스트 + 파일첨부)  │                                    │
   │                                  ├─ Claude: 요약 카드 + 체크리스트 생성    │
   │  ◀── 요약 확인 화면 ──────────────┤                                    │
   │                                  │                                    │
   ├─ 내용 확인 → "맞아요 ✓ 확정" ─────▶                                    │
   │  ◀── "확정되었습니다" 즉시 응답 ───┤                                    │
   │                                  │                                    │
   │                       (백그라운드 작업 시작)                            │
   │                                  ├─ Claude: PRD 마크다운 생성            │
   │                                  ├─ Notion: 새 행 생성 (📮 + 신청자/담당자│
   │                                  │   자동 매칭 + 폼과 동일한 본문)        │
   │                                  ├─ Notion: PRD 하위 페이지 생성 + 멘션 ──▶│ 노션에서 바로 검토
   │                                  │                                    │ (상태/담당자/일정 등은
   │                                  │                                    │  노션에서 직접 관리)
```

## 핵심 기능

- **구조화된 Pain Point 입력 폼** — 자유 텍스트 + 체크박스(+ 기타 입력) 10개 문항으로 요청을 구체화. AI가 추가로 되묻는 인터뷰 단계 없이 2단계(요청 입력 → 요청 확인)로 끝남
- **AI 요약 카드 + 기능 체크리스트** — 비개발자도 본인 요청이 올바르게 반영됐는지 바로 판단할 수 있도록 기술 용어 없이 정리, 체크/추가/삭제 및 직접 수정 가능
- **확정 시 자동 PRD 생성 + 노션 적재** — 요청자는 기다리지 않고, 백그라운드에서 PRD 생성과 노션 행 추가가 자동으로 처리됨 (기존 행은 절대 수정·삭제하지 않고 새 행만 추가)
- **노션 `people` 속성 자동 매칭** — 요청자가 입력한 이름+팀으로 노션 워크스페이스 멤버를 검색해 "신청자" 컬럼을 자동으로 채우고, "담당자"는 인텔리전스팀 기본값으로 채움
- **외부 툴 연동 자동 분석** — "필요 결과물"·"현재 도구" 답변을 분석해 PRD에 연동 대상/방식/데이터 흐름/인증/주의사항을 구체적으로 작성
- **마크다운 → 노션 블록 변환기 자체 구현** — 헤딩/표/체크박스/인용구/코드블록/볼드·이탤릭·링크 등을 노션 API 제약(UTF-16 청크, 코드 언어 enum, children 100개 제한)까지 고려해 직접 변환

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| 백엔드 | FastAPI, Python 3.11 |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| DB / Storage | Supabase (PostgreSQL + Storage) |
| 외부 연동 | Notion REST API (`httpx` 직접 호출) |
| 배포 | 프론트엔드 Vercel · 백엔드 Render |

> 인증 시스템(Supabase Auth)은 v2.0에서 완전히 제거되었습니다 — 이 서비스에는 로그인이라는 개념이 없습니다.

## 아키텍처

```
frontend (Next.js, Vercel)
   │  SSE(text/event-stream)
   ▼
backend (FastAPI, Render)
   ├─ Claude API ──────────────▶ 요약 카드 / 기능 체크리스트 / PRD 생성
   ├─ Supabase ────────────────▶ 요청·Output 저장, 첨부파일 Storage
   └─ Notion API ──────────────▶ 협업 DB에 새 행 + PRD 하위 페이지 추가
                                  (신청자/담당자 people 매칭, 마크다운→블록 변환)
```

## 폴더 구조

```
project-root/
├── PRD.md                              # 제품 요구사항 문서 (항상 최신 버전 기준으로 개발)
├── CLAUDE.md                           # 개발 규칙 (PRD 기준 개발, 에러 처리, 커밋 컨벤션 등)
├── render.yaml                         # 백엔드 Render 배포 설정
│
├── frontend/                           # Next.js App
│   ├── app/page.tsx                    # 유일한 페이지 (Step 1: 입력 ↔ Step 2: 확인)
│   ├── components/
│   │   ├── input/                      # PainPointForm, CheckboxGroup, FileUploader
│   │   ├── requester/                  # 요약 카드, 체크리스트, 확정 버튼
│   │   ├── common/                     # 진행바, 스켈레톤, 에러 메시지
│   │   └── layout/Header.tsx
│   ├── hooks/useGenerationFlow.ts      # SSE 스트리밍 상태 관리
│   └── lib/api.ts                      # 백엔드 호출 유틸 (무인증)
│
└── backend/                            # FastAPI App
    ├── main.py
    ├── routers/
    │   ├── generate.py                 # /api/generate (요청 생성 + 요약 SSE)
    │   └── requests.py                 # 수정/삭제/요약수정/확정
    ├── services/
    │   ├── claude_service.py           # Claude API 호출
    │   ├── supabase_service.py         # Supabase 저장/조회
    │   ├── notion_service.py           # 노션 행/PRD 하위페이지 생성, people 매칭
    │   └── notion_blocks.py            # 마크다운 → 노션 블록 변환기
    ├── prompts/
    │   ├── pain_point_formatter.py     # Pain Point → Claude 프롬프트 텍스트 / 노션 마크다운
    │   ├── summary_prompt.py
    │   └── prd_prompt.py
    ├── models/schemas.py                # Pydantic 모델 (PainPoint 등)
    ├── migrations/                      # SQL 마이그레이션 (scripts/migrate.py로 실행)
    └── requirements.txt
```

자세한 구조와 설계 의도는 [`PRD.md`](./PRD.md) `## 4. 폴더 구조`를 참고하세요.

## 시작하기

### 사전 요구사항

- Node.js 20 이상, Python 3.11 이상
- Supabase 프로젝트
- Notion Integration + 적재 대상 데이터베이스에 연결 완료 ([PRD.md `8.7 연결 요건`](./PRD.md) 참고)

### DB 마이그레이션

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 값 입력
python scripts/migrate.py up
```

### 백엔드 실행

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 프론트엔드 실행

```bash
cd frontend
npm install
cp .env.local.example .env.local   # 값 입력
npm run dev
```

`http://localhost:3000` 접속.

## API 개요

이 서비스의 모든 API는 **무인증**입니다 (로그인 개념이 없음).

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/generate` | Pain Point 제출 → 요약 카드·체크리스트 생성 (SSE) |
| `PATCH` | `/api/requests/{id}` | 요청 내용 수정 (`drafting` 상태에서만) |
| `DELETE` | `/api/requests/{id}` | 요청 삭제 |
| `PATCH` | `/api/requests/{id}/summary` | 요약 카드·체크리스트 텍스트 직접 수정 |
| `POST` | `/api/requests/{id}/confirm` | 확정 → 백그라운드로 PRD 생성 + 노션 적재 트리거 |
| `GET` | `/api/health` | 헬스체크 |

전체 요청/응답 스키마는 [`PRD.md`](./PRD.md) `## 5. API 설계`를 참고하세요.

## 환경변수

### Backend (`backend/.env`)

| 변수명 | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` |
| `MAX_TOKENS` | PRD 생성 최대 토큰 (기본 32000) |
| `MAX_TOKENS_SUMMARY` | 요약 생성 최대 토큰 (기본 4096) |
| `SUPABASE_URL` / `SUPABASE_KEY` | Supabase 프로젝트 정보 |
| `NOTION_API_KEY` / `NOTION_DATABASE_ID` | 노션 협업 DB 적재용 Integration 토큰/DB ID |
| `ALLOWED_ORIGINS` | CORS 허용 Origin |

### Frontend (`frontend/.env.local`)

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 베이스 URL |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 첨부파일 업로드용 Supabase 정보 |

전체 목록은 [`PRD.md`](./PRD.md) `## 9. 환경변수 목록`을 참고하세요. `.env` 파일은 절대 커밋하지 않습니다.

## 배포

| 영역 | 플랫폼 | 비고 |
|------|--------|------|
| 프론트엔드 | Vercel | `main` push 시 자동 배포 |
| 백엔드 | Render | `render.yaml` 기준, `main` push 시 자동 배포 |

노션 연동 관련 환경변수(`NOTION_API_KEY`, `NOTION_DATABASE_ID`)와 `MAX_TOKENS_SUMMARY`는 Render 대시보드에 별도로 등록해야 합니다 — 누락 시 화면에는 정상적으로 "확정되었습니다"가 표시되지만 백그라운드의 노션 적재가 조용히 실패합니다.

## 개발 규칙

이 프로젝트는 [`CLAUDE.md`](./CLAUDE.md)에 정의된 규칙을 따릅니다:

- 모든 개발은 [`PRD.md`](./PRD.md) 기준으로 진행하며, PRD와 다르게 구현해야 하면 즉시 중단하고 사용자에게 보고합니다.
- PRD 버전은 `v{major}.{minor}` 형식으로 관리하며, 변경 시 변경 항목/기존 내용/변경된 내용/변경 이유를 보고한 뒤 승인을 받습니다.
- 커밋 메시지는 한국어로 작성합니다.
- 환경변수는 반드시 `.env`/`.env.local`에서 읽고, DB 스키마 변경은 반드시 `migrations/`에 SQL 파일로 추가합니다.

## 문서

- [`PRD.md`](./PRD.md) — 제품 요구사항 전체 문서 (기능/UX/API/DB/노션 연동/배포 상세 명세, 변경 이력 포함)
- [`CLAUDE.md`](./CLAUDE.md) — 개발 규칙
