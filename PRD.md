# PRD: 내부 AI 기획 요청 자동화 서비스

> **문서 버전:** v2.0
> **작성일:** 2026-06-29
> **상태:** Draft
> **변경 이력:**
> - v1.1 — Input 3단계 플로우 도입, 다운로드 기능 제거
> - v1.2 — Supabase DB 설계 섹션 신규 추가, Output 렌더링 명세 추가, DB 마이그레이션 방식 추가
> - v1.3 — 어드민 계정 생성 기반 인증 시스템 추가 (Supabase Auth, 최초 로그인 비밀번호 강제 변경)
> - v1.4 — 기능명세서 3개 뷰 구조 실제 매니패스트 기준으로 재정의 (트리뷰: react-flow 마인드맵, 디렉토리뷰: 3단 패널, 도큐먼트뷰: 테이블)
> - v1.5 — `/api/generate`를 단계별(request_id + output_type) 생성 방식으로 변경, 요청 이력 목록·재개(resume) 기능 추가, 기능명세서 도큐먼트뷰 컬럼을 실제 데이터 기준("비고")으로 정정, 유저플로우 프롬프트에 Mermaid 문법 충돌 방지 규칙 추가
> - v1.6 — 요청 이력에 수정(PATCH)·삭제(DELETE) 기능 추가 (수정 시 기존 Output 전체 삭제 후 PRD부터 재생성)
> - v1.7 — 헤더 네비게이션을 탭 형태로 재설계 (현재 페이지 활성 상태 표시, 서비스명과 네비게이션 분리)
> - v1.8 — MVP 배포 단계에서 와이어프레임 생성을 환경변수로 비활성화 (`ENABLE_WIREFRAME`/`NEXT_PUBLIC_ENABLE_WIREFRAME`, 기능 코드는 유지, Vercel 서버리스 타임아웃 회피 목적)
> - v1.9 — 배포 아키텍처 신규 추가: 프론트엔드 Vercel, 백엔드 Render (Vercel 서버리스 10초 실행 제한과 Claude 생성 소요 시간 불일치로 인한 결정)
> - v1.10 — 주요 기능 태그 최대 개수 제한(3개) 제거, PRD 생성 프롬프트의 백엔드 기술 스택 기본값을 FastAPI에서 Supabase(BaaS)로 변경 (FastAPI는 복잡한 커스텀 로직이 필요할 때만 선택적 사용), 외부 툴 연동(Zoom·Google Sheets 등) 언급 시 연동 방식·데이터 흐름·인증·제약사항을 구체적으로 작성하도록 PRD 프롬프트에 규칙 추가
> - v1.11 — (1) 태그 개수 제한 제거에 맞춰 남아있던 자유 텍스트 입력칸 안내문구("1~3개") 수정 및 기능 태그 라벨 문구를 "최소 1개 필수, 개수 제한 없음 · 현재 N개"로 명확화 (2) Vercel 프론트엔드 배포를 CLI 단발 배포에서 GitHub 저장소 연동 기반 자동 배포로 전환, 실제 운영 배포 주소를 10.3에 기록
> - v1.12 — 사용자 역할 분리(요청자 뷰 / 어드민 뷰) 도입: `users` 테이블에 `is_admin` 컬럼 추가, `requests` 테이블에 `status` 컬럼 추가, 요청자 뷰 Output(서비스 요약 카드 + 기능 체크리스트 자동 생성, 화면 목업 선택 생성) 신규 추가, 요청자 확정 플로우(`POST /api/requests/{id}/confirm`) 추가 — 확정 후에만 PRD·기능명세서·유저플로우(어드민 뷰) 생성 트리거, 요약 카드·체크리스트 생성 프롬프트(6.7) 신규 추가
> - v1.13 — v1.12 구현 과정에서 실제 구조와 다르게 결정된 부분 정리 (세부 내용은 이전 버전 참고)
> - v1.14 — 운영 중 발견된 개선사항 반영: keep-alive 워크플로, 요약 내용 수정 기능, 어드민 요약 블록 항상 읽기전용, 어드민 헤더에서 "새 요청" 탭 숨김
> - v1.15 — 요청자 수정 플로우 개선: "이전 요청 내용 수정하기" 버튼이 같은 화면에서 인라인 수정 후 자동 재생성되도록 변경
> - v1.16 — 사용자 권한 정보를 `user_metadata`에서 전용 `profiles` 테이블로 이전, "직원 관리" 화면 신규 추가
> - v1.17 — 요청자 로그인 제거(요청자는 비로그인, 팀/이름 텍스트 입력으로 대체), 요청 이력 화면을 어드민 전용으로 제한
> - **v2.0 — 전면 재구축: 어드민/인증 시스템 전체 제거, 출력 방식을 자체 화면 대신 노션 협업 DB 연동으로 전환.** 아래 7가지가 핵심 변경이다.
>   1. **인증·어드민 시스템 전체 삭제.** Supabase Auth, 로그인/비밀번호 변경/재설정 화면, `profiles` 테이블, "직원 관리" 화면, 어드민 계정을 모두 제거했다. 이 서비스에는 이제 로그인이라는 개념이 전혀 없다.
>   2. **Step 1 입력을 자유 텍스트+기능 태그+AI 사전 인터뷰(Step 2) 방식에서, 10개 문항으로 구성된 구조화된 "Pain Point" 입력 폼으로 완전히 교체.** AI가 추가 질문을 생성하는 단계(舊 Step 2)는 제거되었고, 전체 플로우는 2단계(요청 입력 → 요청 확인)로 단순화됐다.
>   3. **Output을 PRD·기능명세서·유저플로우·와이어프레임 4종에서 PRD 1종으로 축소.** 요청자가 보는 화면은 여전히 서비스 요약 카드 + 기능 체크리스트뿐이며, PRD는 화면에 렌더링하지 않고 노션으로 직접 적재한다.
>   4. **요청자가 "확정"을 누르면, 백그라운드에서 PRD를 생성한 뒤 기존에 운영 중이던 "인텔리전스팀 협업 노션 데이터베이스"에 새 행으로 자동 적재한다.** 기존에 쌓여 있던 행은 절대 읽거나 수정하지 않고, 오직 새 행 추가만 수행한다.
>   5. PRD 전문은 노션 위에 **별도 하위 페이지**로 생성되고, 행의 새 컬럼("PRD")에 그 페이지로의 멘션(링크 칩)이 들어간다.
>   6. "신청자"·"담당자" 컬럼은 노션의 `people` 타입 속성이며, 신청자는 요청자가 입력한 이름+팀으로 노션 워크스페이스 멤버를 검색해 자동 매칭하고, 담당자는 인텔리전스팀 3인(정연이·박선애·양재현)을 기본값으로 채운다.
>   7. PRD 프롬프트가 Pain Point의 "5. 반드시 필요한 결과물"·"6. 현재 사용 중인 도구" 답변을 분석해, 외부 툴 연동이 필요하면 연동 대상·방식·데이터 흐름·인증·주의사항을 기능 요구사항 섹션에 구체적으로 작성하도록 변경했다.
>
>   세부 내용은 아래 각 섹션에 반영되어 있다. 이번 버전부터 React Flow 기능명세서 트리뷰, mermaid.js 유저플로우, react-markdown PRD 렌더링, Supabase Auth는 더 이상 이 서비스에서 사용하지 않는다.

---

## 1. 프로젝트 개요

### 1.1 목적

본부 내 타 팀이 AI 솔루션·자동화 시스템 개발을 요청할 때 발생하는 **기획 단계의 모호함을 제거**하는 내부 기획 자동화 웹 서비스다. 요청자가 구조화된 Pain Point 양식에 답변하면 AI가 PRD를 자동으로 생성하고, 요청자가 확정하는 즉시 **인텔리전스팀이 이미 사용 중이던 노션 협업 데이터베이스**에 새 행으로 적재되어 별도 검토 화면 없이도 바로 검토가 시작될 수 있도록 한다.

> **v2.0:** 기존에는 인텔리전스팀(어드민)이 이 서비스 안에서 직접 로그인해 PRD·기능명세서·유저플로우를 검토했으나, 이미 운영 중이던 노션 협업 페이지로 검토 워크플로를 일원화하기로 결정하면서 자체 검토 화면과 인증 시스템 전체를 제거했다.

### 1.2 문제 및 해결 방안

| 문제 | 해결 방안 |
|------|-----------|
| 타 팀의 AI 개발 요청이 추상적이고 구두로 전달되어 기획 공수 낭비 발생 | 10개 문항으로 구성된 구조화된 Pain Point 양식으로 요청 구체화 강제화 (2.2) |
| 기획 문서 포맷이 팀마다 달라 리뷰·검토 비효율 발생 | PRD를 표준 마크다운 템플릿으로 자동 생성 |
| 요청 내용이 모호하여 외부 툴 연동 여부를 매번 다시 확인해야 함 | "반드시 필요한 결과물"·"현재 사용 중인 도구" 답변을 분석해 PRD에 연동 방식·인증·주의사항을 자동으로 구체화 (6.3) |
| 검토를 위해 별도 화면에 로그인해야 해서 기존 노션 협업 워크플로와 단절됨 | 확정 즉시 기존 노션 협업 DB에 자동 적재, 인텔리전스팀은 익숙한 노션에서 바로 검토 (2.7, 8장) |
| 요청자가 PRD 같은 기획 문서를 이해하기 어려워 본인 요청 반영 여부 확인 불가 | 요청자에게는 서비스 요약 카드 + 기능 체크리스트만 제공 (2.3) |

### 1.3 타겟 사용자

- **주 사용자(요청자):** 본부 내 타 팀 구성원 (개발 역량 없음, 기획 경험 낮음). 로그인하지 않는다.
- **검토자:** 인텔리전스팀 구성원. 이 서비스에 로그인하지 않고, 노션에서 새로 적재된 행을 확인·검토한다.

### 1.4 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js (App Router) |
| 백엔드 | FastAPI |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| 스타일링 | Tailwind CSS |
| DB | Supabase (PostgreSQL + Storage) |
| ORM | supabase-py |
| DB 마이그레이션 | SQL 마이그레이션 파일 + Python 실행 스크립트 |
| 파일 파싱 | python-docx, pdfplumber, openpyxl, Pillow |
| 노션 연동 | Notion REST API (httpx 직접 호출, 별도 SDK 미사용) |

> **v2.0:** 인증(Supabase Auth), 기능명세서 트리뷰(`@xyflow/react`), PRD 렌더링(`react-markdown`+`remark-gfm`), 유저플로우 렌더링(`mermaid.js`)을 모두 제거했다. PRD는 화면에 렌더링하지 않고 노션 마크다운으로 직접 변환해 적재하기 때문이다.

---

## 2. 기능 요구사항

### 2.1 인증

**v2.0부터 이 서비스에는 인증이 전혀 없다.** 요청자도, 인텔리전스팀도 로그인하지 않는다. 과거 버전(v1.3~v1.17)에 있던 어드민 계정 생성, 로그인/비밀번호 변경/재설정 화면, `profiles` 테이블, "직원 관리" 화면은 전부 삭제됐다.

### 2.2 Input — Pain Point 구조화 양식 (v2.0 전면 교체)

> 과거의 "자유 텍스트 + 기능 태그 입력(舊 Step 1) → AI 사전 인터뷰(舊 Step 2)" 2단계를 제거하고, **10개 문항으로 구성된 단일 구조화 양식**으로 완전히 대체했다. AI가 추가 질문을 생성하는 단계는 더 이상 없다.

**팀·이름 입력 (필수)**
- 요청자가 로그인하지 않으므로, 본인 식별을 위해 "팀"과 "이름"을 텍스트로 직접 입력
- 둘 다 비워두면 제출 불가

**Pain Point 문항 (총 10개, `PainPoint` 스키마)**

| 번호 | 질문 | 입력 형태 | 필수 여부 |
|------|------|-----------|-----------|
| 1 | 어떤 기능을 원하시나요? | 자유 텍스트 | 필수 |
| 2 | 기존에는 위 업무를 어떤 프로세스로 진행했나요? | 자유 텍스트 | 필수 |
| 3 | 어떤 점이 가장 불편한가요? | 체크박스(다중 선택) + 기타 | 1개 이상 필수 |
| 4 | 해당 업무가 어떻게 바뀌면 좋을까요? | 자유 텍스트 | 선택 |
| 5 | 반드시 필요한 결과물은 무엇인가요? | 체크박스(다중 선택) + 기타 | 선택 |
| 6 | 현재 해당 작업을 진행할 때 사용하는 도구를 입력해주세요 | 체크박스(다중 선택) + 기타 | 선택 |
| 7 | 입력 데이터 형태 | 체크박스(다중 선택) + 기타 | 선택 |
| 8 | 샘플 파일 또는 예시 링크 | 파일 첨부 + 링크 텍스트 | 선택 |
| 9 | 자동화/개발 중 어떤 게 가장 필요한가요? | 체크박스(다중 선택, 기타 없음) | 선택 |
| 10 | 제약 사항 & 참고사항 | 자유 텍스트 | 선택 |

**체크박스 선택지 (frontend `PainPointForm.tsx` 기준, backend `pain_point_formatter.py`에 동일하게 미러링됨)**

- 3번(가장 불편한 점): 단순 반복성 업무라서 실무자의 시간을 투입하기 아깝다 / 절대량(혹은 걸리는 시간)이 너무 많다 / 실무자가 퀄리티를 맞추기 어려워 피드백에 시간을 많이 쓴다 / 실수(오류)가 자주 발생한다 / 특정 담당자에게만 지식이 몰려 있어, 그가 없으면 업무 진행이 안된다 / 사용하는 툴들이 서로 연동되지 않아 동일 데이터를 다른 양식으로 매번 바꿔야 한다 / 기타
- 5번(필요 결과물): 정리된 엑셀/시트 / 자동화된 프로세스 / 시각화(차트/그래프) / 웹 화면/툴 / 기타
- 6번(현재 도구): Excel / Google Sheets / Notion / 구글폼/설문 폼 / 기타
- 7번(입력 데이터 형태): 엑셀 파일 / PDF / 텍스트 / 오디오/비디오 / API/DB / 아직 정리 안 됨 / 기타
- 9번(개발 선호): 단순 엑셀 함수나 매크로도 괜찮아요 / 자동화 툴 (Zapier, Make 등) / 간단한 웹/앱 개발 / 잘 모르겠음 (제안에 따름)

**체크박스 UI:** 가로로 나열되는 토글 칩 방식이 아니라, **세로로 나열된 체크박스 리스트**(선택 시 파란 배경 강조)로 표시한다 — 선택지가 많을 때 가로 줄바꿈으로 가독성이 떨어진다는 피드백에 따라 변경됨.

**파일 첨부 (선택, 8번 문항과 별개로 항상 노출)**
- 지원 포맷: `.pdf`, `.docx`, `.hwp`, `.xlsx`, `.xls`, `.png`, `.jpg`, `.jpeg`
- 다중 파일 동시 업로드 / 드래그&드롭 지원, 파일당 최대 200MB, 총 1GB
- 업로드 경로는 브라우저 세션별 임시 ID로 네임스페이스 구성 (로그인이 없으므로 계정 ID 대신)

**입력 검증**
- 팀·이름 모두 입력 + 1번·2번 문항 입력 + 3번 문항 1개 이상 선택(또는 기타 입력) 시에만 제출 가능

---

### 2.3 Output 생성 — 요청자 뷰만 존재 (v2.0)

> 과거의 "요청자 뷰 / 어드민 뷰" 역할 분리 자체가 의미가 없어졌다. 어드민 뷰(PRD·기능명세서·유저플로우·와이어프레임을 이 서비스 화면에서 보여주는 것)는 전부 제거되었고, PRD는 화면이 아니라 노션으로 직접 전달된다.

**서비스 요약 카드 + 기능 체크리스트 (요청자에게 표시되는 유일한 Output)**

요청 제출 직후 `POST /api/generate`로 즉시 생성된다.

- 서비스 요약 카드: 서비스 이름 · 목적 한 줄 · 주요 사용자 · 핵심 기능 요약(최대 8개, v2.0에서 토큰 초과 방지를 위해 상한 추가)
- 기능 체크리스트: 체크·추가·삭제 가능
- "맞아요 ✓ (확정)" / "이전 요청 내용 수정하기" 버튼 제공
- "요약 내용 수정" 버튼 제공: 원본 입력은 그대로 둔 채 요약 카드·체크리스트 텍스트만 직접 고쳐 저장 (`PATCH /api/requests/{id}/summary`, 재생성 없음)

**확정 시 동작 (v2.0 신규 — 핵심 변경)**

"맞아요 ✓ (확정)" 클릭 시:
1. `POST /api/requests/{id}/confirm` 호출 → `status`를 `confirmed`로 변경, 응답은 즉시 반환됨
2. 요청자는 화면에 "확정되었습니다. 인텔리전스팀이 검토를 진행할 예정입니다."만 보고 더 기다리지 않는다
3. **백그라운드(`BackgroundTasks`)에서** 아래가 순서대로 실행된다 (2.7 참고):
   - Pain Point 답변 기반으로 PRD 마크다운 생성 (Claude `stream_completion`)
   - 생성된 PRD를 Supabase `outputs` 테이블에 저장 (`type=prd`)
   - 노션 협업 DB에 새 행 생성 + PRD 하위 페이지 생성 + 행에 PRD 페이지 멘션 연결

요청자에게는 PRD 생성·노션 적재 진행 상황이 노출되지 않는다 (별도 트리거 버튼 없이 확정과 동시에 자동 실행).

---

### 2.4 요청 상태(Status) 관리

`requests` 테이블의 `status` 컬럼으로 진행 단계를 추적한다.

| 상태값 | 설명 | 전환 조건 |
|--------|------|-----------|
| `drafting` | 요청자가 수정 중 (확정 전) | 요청 생성 시 초기값 |
| `confirmed` | 요청자가 확정 완료, 노션 적재 트리거됨 | "맞아요 ✓" 클릭 → `POST /api/requests/{id}/confirm` |

> **v2.0:** `in_review`/`completed` 상태와 어드민의 상태 변경 기능(`PATCH /api/requests/{id}/status`)을 제거했다. 확정 이후의 진행 상황(검토중/개발중/개발완료 등)은 이 서비스가 아니라 **노션 데이터베이스의 "상태" 속성**에서 인텔리전스팀이 직접 관리한다 (8.1 참고).

- 요청자는 `drafting` 상태에서만 수정·삭제 가능. `confirmed` 이후에는 수정·삭제 불가 (어드민이 없으므로 누구도 되돌릴 수 없음 — 노션에서 직접 처리해야 함).

---

### 2.5 Output 렌더링

| Output | 저장 형식 | 렌더링 방식 | 위치 |
|--------|-----------|-------------|------|
| 서비스 요약 카드 | JSON | 카드 컴포넌트로 파싱 표시 | 이 서비스 화면 |
| 기능 체크리스트 | JSON | 체크박스 목록으로 렌더링 | 이 서비스 화면 |
| PRD | Markdown → Notion 블록 | 노션 페이지 블록(제목/표/목록/코드/인용구/체크박스/링크)으로 변환되어 표시 | **노션 페이지** (이 서비스 화면에는 렌더링하지 않음) |

> **v2.0:** PRD를 이 서비스 안에서 렌더링하던 기능(`react-markdown`+`remark-gfm`)을 제거했다. 대신 `notion_blocks.py`가 마크다운을 노션 블록 JSON으로 직접 변환한다 (8.3 참고).

### 2.6 Output 저장

| 저장 대상 | 저장 위치 | 비고 |
|-----------|-----------|------|
| 요청 내용 (Pain Point 전체) | Supabase DB `requests.pain_point` (JSONB) | |
| 서비스 요약 카드 + 체크리스트 | Supabase DB `outputs` 테이블 (`type=summary`) | |
| 생성된 PRD 마크다운 | Supabase DB `outputs` 테이블 (`type=prd`) | 노션 적재 실패 시에도 PRD 자체는 보존됨 |
| 첨부 파일 | Supabase Storage | DB에는 파일 경로만 저장 |
| **확정된 요청 + PRD (최종 산출물)** | **노션 협업 데이터베이스** | 확정 시 자동 적재, 8장 참고 |

---

### 2.7 노션 연동 — 확정 시 자동 적재 (v2.0 신규)

요청자가 확정하면, 인텔리전스팀이 기존에 사용 중이던 **"인텔리전스팀 업무요청" 노션 데이터베이스**에 새 행이 자동으로 추가된다. **기존에 쌓여 있던 행은 절대 읽거나 수정하지 않으며, 오직 새 행 추가(append)만 수행한다.**

핵심 동작 요약 (세부 스키마·매칭 로직은 8장 참고):

1. 행 제목("원하는 기능 한줄요약")은 요청자가 입력한 원문이 아니라, **서비스 요약 카드의 `service_name`**(AI가 정리한 짧은 서비스명)을 사용한다 — 원문을 그대로 쓰면 제목이 너무 길고 정리되지 않은 문장이 되기 때문.
2. 새로 생성되는 페이지에는 **📮(우체통) 아이콘**이 자동으로 설정된다.
3. 페이지 본문은 Pain Point 입력 폼과 **완전히 동일한 마크다운 구조**(`## Pain Point`/`## Solution` 섹션, `1️⃣`~`🔟` 이모지 번호 헤딩, 체크박스 문항은 전체 선택지를 노션 실제 체크박스(to-do 블록)로 나열하고 선택한 항목만 체크)로 작성된다.
4. "신청자" 컬럼(`people` 타입)은 요청자가 입력한 이름+팀으로 노션 워크스페이스 멤버 목록을 검색해 일치하는 사람을 자동으로 채운다. 일치하는 사람을 찾지 못하면 빈 값으로 둔다 — `created_by`(생성자) 같은 노션 시스템 속성과 달리 `people` 타입 일반 속성은 API로 직접 채울 수 있다.
5. "담당자" 컬럼(`people` 타입)은 항상 인텔리전스팀 3인(정연이·박선애·양재현)을 기본값으로 채운다. 실제 담당 배정은 인텔리전스팀이 노션에서 직접 변경한다.
6. PRD 전문은 그 행의 **하위 페이지**로 별도 생성되고, 새로 추가한 "PRD" 컬럼(`rich_text` 타입)에는 그 하위 페이지로의 멘션(클릭 가능한 링크 칩)이 들어간다.
7. "상태" 컬럼은 항상 "신청접수"로 시작한다. "선택"(우선순위), "킥오프 미팅 여부/날짜", "완료 모듈 URL"은 운영 담당자가 나중에 채우는 값이므로 생성 시점에는 비워둔다.

---

## 3. UX/UI 요구사항

### 3.1 레이아웃 구조

```
[메인 페이지 "/"] ← 완전 공개, 로그인 없음. 유일한 화면.

[헤더] — 서비스명("AI 기획 자동화") + 파란 점 브랜드 마크. 네비게이션 없음 (로그인이 없으므로)

[히어로 배너] — 파란 그라데이션 배경, "원하는 기능이 있으신가요?" 타이틀 + 안내문

[Step 진행바] — "1 요청 입력" → "2 요청 확인" (2단계로 단순화, 舊 Step1/2/3 3단계에서 변경)
    └── 현재 단계 표시는 파란 배경 위에서도 잘 보이도록 흰 원 + 파란 글씨로 강조

├── [Step 1: 요청 입력] — 흰색 카드(둥근 모서리 + 그림자) 안에 배치
│   ├── 팀 / 이름 (텍스트 입력 2칸, 필수)
│   ├── Pain Point 섹션 (1~3번 문항)
│   ├── Solution 섹션 (4~10번 문항)
│   │   └── 체크박스형 문항은 세로 리스트, 선택 시 파란 배경 강조
│   └── [요청 제출] 버튼 — 파란 배경, 전체 폭
│
└── [Step 2: 요청 확인] — 흰색 카드 안에 배치
    ├── 서비스 요약 카드 (자동 생성)
    ├── 기능 체크리스트 (체크·추가·삭제 가능)
    ├── [요약 내용 수정] 버튼 → 인라인 수정 모드
    └── [맞아요 ✓ 확정] / [이전 요청 내용 수정하기] 버튼
        └── 확정 시 "확정되었습니다. 인텔리전스팀이 검토를 진행할 예정입니다." 메시지만 표시 (노션 적재는 백그라운드에서 진행, 화면에 노출 안 함)
```

> **v2.0:** 로그인 화면, 비밀번호 변경/재설정 화면, 어드민 헤더 네비게이션, 요청 이력 화면(`/requests`), 직원 관리 화면(`/admin/users`)을 모두 제거했다. 메인 페이지(`/`)가 유일한 화면이다.

### 3.2 인터랙션 원칙

- Step 1 → Step 2 전환 시 요약 생성 로딩 인디케이터 표시 ("요청 내용을 요약하고 있습니다...")
- 요약 생성 실패 시 실제 실패 원인(서버 에러 메시지)을 화면에 그대로 노출 — 과거에는 원인과 무관하게 고정된 안내문만 보여줬으나, 디버깅을 위해 실제 메시지를 전달하도록 변경 (v2.0)
- 체크박스 선택 시 즉시 배경색으로 선택 여부를 명확히 표현
- "이전 요청 내용 수정하기"를 누르면 같은 화면에서 인라인 폼이 펼쳐지며 기존 입력값이 유지되고, 저장 시 요약이 자동 재생성됨
- 확정 후에는 모든 수정 버튼이 비활성화되고 "검토가 진행될 예정입니다" 메시지만 표시됨

### 3.3 반응형

- 현재 버전은 데스크탑 웹 기준으로 개발 (최소 지원 해상도: 1280px)
- Tailwind CSS의 반응형 유틸리티(`sm:`, `md:`)를 초기부터 활용하여 향후 모바일 확장 시 재작업을 최소화

### 3.4 디자인 원칙

- 전체 색상을 파란색(`blue-600` 계열)으로 통일, 히어로 배너는 파란 그라데이션
- Step 진행 상태를 상단 Progress Bar로 시각화 (1/2 단계)
- 입력 화면과 확인 화면 모두 흰색 카드(`rounded-2xl` + `shadow-lg`) 안에 콘텐츠를 배치해 배경과 시각적으로 구분
- Pain Point 폼은 "Pain Point"/"Solution" 두 섹션으로 구분하고 각 질문에 파란 원형 숫자 배지 부여

---

## 4. 폴더 구조

```
project-root/
├── frontend/                          # Next.js App
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx                   # 유일한 페이지. Step 1(Pain Point 입력) ↔ Step 2(요약 확인) 흐름 관리
│   ├── components/
│   │   ├── input/
│   │   │   ├── PainPointForm.tsx      # 10개 문항 Pain Point 폼 (Pain Point/Solution 섹션 구분)
│   │   │   ├── CheckboxGroup.tsx      # 체크박스형 문항 공용 컴포넌트 (세로 리스트 + 기타 입력)
│   │   │   └── FileUploader.tsx       # 파일 첨부 드래그&드롭, 브라우저 세션 ID로 경로 네임스페이스
│   │   ├── requester/
│   │   │   ├── RequesterOutputView.tsx  # 요약 확인 화면 컨테이너 (요약 카드 + 체크리스트)
│   │   │   ├── ServiceSummaryCard.tsx   # 서비스 요약 카드
│   │   │   ├── FeatureChecklist.tsx     # 기능 체크리스트 (체크·추가·삭제)
│   │   │   └── ConfirmActions.tsx       # "맞아요 ✓ 확정" / "이전 요청 내용 수정하기" 버튼
│   │   ├── common/
│   │   │   ├── StepProgressBar.tsx    # Step 1/2 진행 상태 표시
│   │   │   ├── SkeletonLoader.tsx
│   │   │   └── ErrorMessage.tsx
│   │   └── layout/
│   │       └── Header.tsx             # 서비스명 + 브랜드 마크만 표시 (네비게이션 없음)
│   ├── lib/
│   │   ├── api.ts                     # FastAPI 호출 유틸 (인증 헤더 없음)
│   │   └── supabase.ts                # Supabase 클라이언트 (Storage 업로드 전용)
│   ├── hooks/
│   │   └── useGenerationFlow.ts       # 요약 생성 상태/SSE 처리 훅
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
└── backend/                           # FastAPI App
    ├── main.py                        # FastAPI 엔트리포인트 (generate, requests 라우터만 등록)
    ├── routers/
    │   ├── generate.py                # /api/generate — Pain Point → 요약 생성 + 요청 생성 (SSE)
    │   └── requests.py                # /api/requests/* — 수정·삭제·요약수정·확정
    ├── services/
    │   ├── file_parser.py             # 첨부 파일 텍스트 추출
    │   ├── claude_service.py          # Claude API 호출 (요약 생성 / PRD 스트리밍)
    │   ├── supabase_service.py        # Supabase DB 저장/조회
    │   ├── notion_blocks.py           # 마크다운 → 노션 블록 JSON 변환기
    │   └── notion_service.py          # 노션 페이지 생성, 사람 속성 매칭, PRD 하위페이지·멘션 연결
    ├── models/
    │   └── schemas.py                 # PainPoint 등 Pydantic 모델
    ├── prompts/
    │   ├── pain_point_formatter.py     # Pain Point → 텍스트(Claude 프롬프트용)·노션 마크다운(페이지 본문용) 변환
    │   ├── summary_prompt.py           # 요약 카드·체크리스트 생성 프롬프트
    │   └── prd_prompt.py                # PRD 생성 프롬프트
    ├── migrations/
    │   ├── 002_create_requests_table.sql
    │   ├── 003_create_outputs_table.sql
    │   ├── 004_add_status_to_requests.sql
    │   ├── 005_add_summary_to_outputs_type.sql
    │   ├── 006_create_profiles_table.sql         # v2.0에서 profiles 테이블 자체가 삭제됨 (009 참고)
    │   ├── 007_make_requests_public.sql
    │   ├── 008_allow_anonymous_file_upload.sql
    │   ├── 009_remove_admin_add_pain_point.sql   # (v2.0 신규) user_id/profiles 제거, pain_point JSONB 컬럼 추가
    │   └── reset.sql
    ├── scripts/
    │   └── migrate.py
    ├── requirements.txt
    └── .env
```

> **v2.0에서 삭제된 파일:** `routers/admin.py`, `routers/profile.py`, `routers/interview.py`, `prompts/interview_prompt.py`, `prompts/spec_prompt.py`, `prompts/userflow_prompt.py`, `prompts/wireframe_prompt.py`, `app/admin/`, `app/login/`, `app/change-password/`, `app/reset-password/`, `app/requests/`, `components/auth/`, `components/interview/`, `components/output/`, `components/renderers/`, `hooks/useUserRole.ts`, `lib/config.ts`, `middleware.ts`.

---

## 5. API 설계

### 5.1 엔드포인트 목록

> **v2.0: 모든 엔드포인트가 무인증이다.** 어드민 토큰이나 로그인 세션 개념 자체가 없다.

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/generate` | Pain Point → 요약 카드·체크리스트 생성 + 요청 생성 (SSE 스트리밍) |
| PATCH | `/api/requests/{request_id}` | 요청 내용(Pain Point·첨부파일) 수정 — `drafting` 상태일 때만 허용 |
| DELETE | `/api/requests/{request_id}` | 요청 및 모든 Output 삭제 — `drafting` 상태일 때만 허용 |
| PATCH | `/api/requests/{request_id}/summary` | 요약 카드·체크리스트 텍스트 직접 수정 (재생성 없음) |
| POST | `/api/requests/{request_id}/confirm` | 확정 처리 → `status=confirmed` + 백그라운드로 PRD 생성·노션 적재 트리거 |
| GET | `/api/health` | 서버 상태 확인 |

> **v2.0에서 제거된 엔드포인트:** `POST /api/interview`, `GET /api/requests`, `GET /api/requests/{request_id}`, `PATCH /api/requests/{request_id}/status`, `GET /api/me`, `GET·POST·PATCH /api/admin/users`. (요청 이력 목록·상세 조회 화면 자체가 사라졌고, 더 이상 호출되지 않는다.)

---

### 5.2 POST `/api/generate`

신규 요청 생성 + 요약(서비스 요약 카드·체크리스트) 생성을 겸한다.

**요청 (application/json)**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `pain_point` | object | ✅ | `PainPoint` 스키마 전체 (2.2 참고) |
| `file_paths` | string[] | 선택 | Supabase Storage 파일 경로 목록 |
| `output_type` | string | ✅ | 항상 `"summary"` (다른 값은 더 이상 존재하지 않음) |
| `request_id` | string | 선택 | 기존 요청을 수정 후 재생성할 때 전달 (없으면 새 요청 생성) |
| `team` | string | 신규 요청 생성 시 필수 | 요청자가 입력한 팀명 |
| `submitter_name` | string | 신규 요청 생성 시 필수 | 요청자가 입력한 이름 |

**응답 (SSE: text/event-stream)**

```
event: request_created
data: {"request_id": "<신규 생성된 요청 ID>"}

event: summary_start
data: {}

event: summary_done
data: {"content": {"summary_card": {...}, "feature_checklist": [...]}}

event: error
data: {"output_type": "summary", "message": "<실패 원인 그대로>"}

event: complete
data: {}
```

> **v2.0:** `error` 이벤트의 `message`는 프론트엔드(`useGenerationFlow.ts`)가 그대로 화면에 노출한다 (과거에는 무시하고 고정 문구만 표시했음). 백엔드도 실패 시 `request_id`와 함께 서버 로그에 원인을 출력한다.

---

### 5.3 PATCH `/api/requests/{request_id}/summary`

요청자가 "요약 내용 수정"을 눌러 요약 카드·체크리스트 텍스트를 직접 고친 뒤 저장할 때 호출된다. `status`가 `drafting`이 아니면 400 에러.

**요청/응답:** `{"summary_card": {...}, "feature_checklist": [...]}` 형식 그대로.

### 5.4 POST `/api/requests/{request_id}/confirm`

```json
// 요청
{"confirmed_features": ["기능1", "기능2"]}

// 응답 (즉시 반환, PRD 생성·노션 적재는 기다리지 않음)
{"request_id": "<id>", "status": "confirmed", "confirmed_features": ["기능1", "기능2"]}
```

응답을 반환한 직후 FastAPI `BackgroundTasks`로 `notion_service.generate_prd_and_push(request_id)`가 실행된다 (2.3, 8장 참고).

### 5.5 PATCH `/api/requests/{request_id}`, DELETE `/api/requests/{request_id}`

요청 내용(Pain Point·첨부파일) 수정/삭제. `drafting` 상태가 아니면 403. 수정 시 기존 `outputs`(요약·PRD)가 전부 삭제된다 — 원본이 바뀌면 이전 요약·PRD는 더 이상 유효하지 않기 때문.

---

## 6. Claude API 프롬프트 명세

> `claude-sonnet-4-6` 모델 고정, `temperature: 0` 고정. 요약은 `MAX_TOKENS_SUMMARY`(기본 4096), PRD는 `MAX_TOKENS`(기본 32000) 토큰 한도를 사용한다.

### 6.1 공통 시스템 프롬프트

```
당신은 B2B SaaS 기획 전문가입니다.
사용자가 제공하는 프로젝트 설명을 바탕으로 내부 AI 솔루션 기획 산출물을 작성합니다.
- 추측이 필요한 부분은 [가정: ...]으로 명시하세요.
- 전문 용어는 풀어서 설명하고, 실무에서 바로 사용 가능한 수준으로 작성하세요.
- 한국어로 작성하세요.
```

### 6.2 Pain Point 텍스트 변환 (`pain_point_formatter.py`)

Claude에게 전달하는 프롬프트와 노션 페이지 본문은 같은 `PainPoint` 데이터를 서로 다른 형태로 변환해서 사용한다.

- `format_pain_point(pain_point) -> str`: 10개 문항을 "**N. 라벨**\n답변" 형식의 평문으로 직렬화. `summary_prompt`·`prd_prompt`에 전달되는 `[요청 내용]` 텍스트로 사용된다.
- `to_notion_markdown(pain_point) -> str`: Pain Point 입력 폼과 **완전히 동일한 마크다운 구조**(`## Pain Point`/`## Solution`, `1️⃣`~`🔟` 이모지 헤딩, 체크박스 문항은 전체 선택지를 `- [ ]`/`- [x]`로 나열 + "기타 : {입력값}")로 직렬화. 노션 행 페이지의 본문으로만 사용된다 (8.3 참고).

### 6.3 요약 카드·기능 체크리스트 프롬프트 (`summary_prompt.py`)

```
당신은 비개발자를 위한 서비스 요약 전문가입니다.
아래 요청 내용을 바탕으로 요청자가 본인의 요청이 올바르게 반영됐는지
직관적으로 확인할 수 있는 요약 카드와 기능 체크리스트를 JSON으로 작성하세요.

[작성 원칙]
- 기술 용어를 절대 사용하지 마세요.
- 요청자가 "맞다/다르다"를 즉시 판단할 수 있도록 짧고 명확하게 작성하세요.
- 서비스 목적은 1~2문장으로 압축하세요.
- 기능 목록은 요청 내용(특히 "원하는 기능", "바뀌었으면 하는 모습")을 기반으로 작성하되, 맥락상 자연스럽게 보완하세요. 단, 기능 목록은 최대 8개까지만 작성하세요.
- JSON 외의 다른 텍스트는 출력하지 마세요.

출력 형식:
{
  "summary_card": {
    "service_name": "서비스 이름 (간결하게)",
    "purpose": "이 서비스가 하는 일을 한 문장으로",
    "target_users": "주요 사용자 설명",
    "key_features": ["핵심 기능 1", "핵심 기능 2", "핵심 기능 3"]
  },
  "feature_checklist": [
    {
      "id": "FC001",
      "name": "기능명 (요청자 언어로)",
      "description": "이 기능이 어떤 역할을 하는지 한 줄 설명",
      "checked": true
    }
  ]
}

---
[요청 내용]
{pain_point_text}
```

> **v2.0 추가:** "기능 목록은 최대 8개까지만 작성하세요" 규칙과 `MAX_TOKENS_SUMMARY` 상향(1024→4096)을 함께 적용했다. 운영 중 답변이 길고 상세한 요청에서 응답이 `max_tokens`로 잘려 JSON 파싱에 실패하는 문제가 실제로 재현되어, 두 조치를 함께 적용해 해결했다.

### 6.4 PRD 프롬프트 (`prd_prompt.py`)

```
당신은 IT 서비스 기획 전문가입니다.
아래 요청 내용을 바탕으로 PRD를 마크다운 형식으로 작성하세요.

[작성 원칙]
- 추측이 필요한 부분은 [가정: ...]으로 명시하세요.
- 비개발자도 이해할 수 있도록 쉬운 언어로 작성하되, 기술 스택 항목은 아래 규칙을 따르세요.
- 한국어로 작성하세요.

[기술 스택 규칙]
- 프론트엔드: Next.js (고정)
- 백엔드: Supabase(DB·Auth·Storage·Edge Functions 등 BaaS 기능)를 기본값으로 사용하세요. 단, 복잡한 커스텀 서버 로직 등 Supabase만으로 해결하기 어려운 요구사항이 있을 때만 FastAPI를 선택적으로 함께 사용할 수 있습니다.
- AI: Anthropic Claude API (claude-sonnet-4-6) (고정)
- 스타일링: Tailwind CSS (고정)

[외부 툴 연동 분석 — 반드시 수행] (v2.0 변경)
요청 내용 중 "5. 반드시 필요한 결과물"과 "6. 현재 사용 중인 도구" 답변을 함께 분석해서, 어떤 외부 서비스·툴과의 연동이 필요한지 판단하세요.
- "6. 현재 사용 중인 도구"에 적힌 도구(예: Excel/Google Sheets, Notion, 구글폼/설문 폼 등)는 기존 데이터가 위치한 곳이므로, 그 도구에서 데이터를 가져오거나(import) 그 도구로 결과를 내보내는(export) 연동이 필요한지 검토하세요.
- "5. 반드시 필요한 결과물"에 "정리된 엑셀/시트"가 포함되어 있다면 엑셀/구글시트 내보내기 연동을, "웹 화면/툴"이 포함되어 있다면 신규 웹 서비스 자체(별도 외부 연동이 아닐 수 있음)를 의미하는 등, 결과물 종류에 따라 연동 범위를 구체적으로 추론하세요.
- 연동이 필요하다고 판단되면, ## 2. 기능 요구사항에 해당 기능을 한 줄로만 적지 말고 연동 대상/연동 방식/데이터 흐름/필요 인증·권한/연동 시 주의사항을 별도로 구체화하여 작성하세요.
- 분석 결과 외부 연동이 필요 없다고 판단되면 이 항목은 생략해도 됩니다.

반드시 아래 8개 항목을 모두 포함하세요:
## 1. 프로젝트 개요 (1.1 목적, 1.2 기술 스택)
## 2. 기능 요구사항 (필수/중요/선택 우선순위 + 외부 툴 연동 분석 결과 포함)
## 3. UX/UI 요구사항 (3.1 레이아웃 구조, 3.2 인터랙션 원칙, 3.3 디자인 원칙)
## 4. 폴더 구조
## 5. API 설계 (5.1 엔드포인트 목록, 5.2 주요 엔드포인트 상세)
## 6. Claude API 프롬프트 명세
## 7. 환경변수 목록
## 8. 실행 방법

---
[요청 내용]
{pain_point_text}
```

> **v2.0 변경 이전**에는 "요청 내용에 외부 서비스 연동이 언급되어 있다면"이라는 막연한 조건이었으나, Pain Point 양식이 구조화되면서 5번·6번 문항을 명시적으로 분석 대상으로 지정하도록 변경했다. 실제 테스트(현재 도구: Excel/Google Sheets, Notion / 필요 결과물: 정리된 엑셀시트, 시각화)에서 "구글시트 연동(가져오기/내보내기)"과 "Notion 내보내기"가 별도 기능 항목으로 자동 식별되고, 연동 방식·인증·주의사항까지 표로 정확히 생성되는 것을 확인했다.

> **v2.0에서 제거된 프롬프트:** 인터뷰 질문 생성, 기능명세서, 유저플로우, 와이어프레임 프롬프트 4종. PRD 1종만 남았다.

---

## 7. DB 설계 (Supabase)

### 7.1 테이블 구조

#### requests (요청 이력)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | 요청 고유 ID |
| `team` | TEXT | 요청자가 입력한 팀명 |
| `submitter_name` | TEXT | 요청자가 입력한 이름 |
| `pain_point` | JSONB | Pain Point 10개 문항 답변 전체 (v2.0 신규) |
| `text`, `features`, `interview_answers` | TEXT, TEXT[], JSONB | 舊 버전 컬럼. 더 이상 채우지 않지만 `NOT NULL` 제약 호환을 위해 빈 값(`""`, `[]`)으로 계속 삽입함 — 별도 마이그레이션으로 제거하지는 않았음 |
| `confirmed_features` | TEXT[] | 요청자가 체크리스트에서 최종 확정한 기능 목록 |
| `file_paths` | TEXT[] | Supabase Storage 파일 경로 목록 |
| `status` | TEXT | `drafting` \| `confirmed` |
| `created_at` | TIMESTAMP | 요청 생성 시각 |

> **v2.0:** `user_id` 컬럼과 `profiles` 테이블을 완전히 제거했다 (마이그레이션 009). 로그인이 없으므로 `user_id`는 항상 `NULL`이었고, 이제 컬럼 자체가 없다.

#### outputs (생성된 Output)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID (PK) | Output 고유 ID |
| `request_id` | UUID (FK → requests.id) | 연결된 요청 ID |
| `type` | TEXT | `summary` \| `prd` (v2.0: `spec`/`userflow`/`wireframe`은 더 이상 생성되지 않음) |
| `content` | JSONB | 생성된 Output 원문 |
| `created_at` | TIMESTAMP | Output 생성 시각 |

### 7.2 마이그레이션

```bash
python scripts/migrate.py up      # 테이블 전체 생성/갱신
python scripts/migrate.py down    # 테이블 전체 삭제
```

```
backend/migrations/
├── 002_create_requests_table.sql
├── 003_create_outputs_table.sql
├── 004_add_status_to_requests.sql
├── 005_add_summary_to_outputs_type.sql
├── 006_create_profiles_table.sql            # v2.0에서 테이블 자체가 삭제됨 (009 참고)
├── 007_make_requests_public.sql
├── 008_allow_anonymous_file_upload.sql
├── 009_remove_admin_add_pain_point.sql       # (v2.0 신규) user_id 컬럼·profiles 테이블 제거, pain_point JSONB 컬럼 추가
└── reset.sql
```

---

## 8. 노션 연동 설계 (v2.0 신규)

### 8.1 대상 데이터베이스

인텔리전스팀이 기존에 운영 중이던 "인텔리전스팀 업무요청" 노션 데이터베이스에 새 행만 추가한다. **기존에 쌓여 있던 행은 절대 읽거나 수정·삭제하지 않는다.**

| 속성명 | 타입 | 이 서비스가 채우는 값 |
|--------|------|------------------------|
| 원하는 기능 한줄요약 | title | 요약 카드의 `service_name` (8.4) |
| 상태 | status | 항상 `"신청접수"` (운영 중인 다른 옵션: 검토중/개발중/접수완료/개발완료 — 인텔리전스팀이 직접 변경) |
| 팀 구분 | select | 요청자가 입력한 팀명 |
| 신청자 | people | 이름+팀으로 워크스페이스 멤버 자동 매칭 (8.5) |
| 담당자 | people | 인텔리전스팀 3인 기본값 (8.5) |
| 선택 / 킥오프 미팅 여부 / 킥오프 미팅 날짜 / 완료 모듈 URL | select/date/url | 비워둠 — 운영 담당자가 추후 채움 |
| 생성 일시 / 생성자 | created_time/created_by | 노션이 자동으로 채우는 시스템 속성, 이 서비스는 관여하지 않음 |
| **PRD** | rich_text | **(v2.0 신규 컬럼)** PRD 하위 페이지로의 멘션(링크 칩) (8.6) |

> `생성자`(`created_by`)는 노션 시스템 속성이라 API로 임의의 사람으로 설정할 수 없다 — 항상 API를 호출한 Integration 계정으로 고정된다. 그래서 "누가 신청했는지"를 보여주기 위해 별도로 일반 `people` 속성인 "신청자" 컬럼을 새로 추가했다.

### 8.2 페이지 아이콘

행 페이지 생성 시 `icon: {"type": "emoji", "emoji": "📮"}`를 함께 전달해 모든 신규 행에 우체통 아이콘이 자동으로 붙는다.

### 8.3 페이지 본문 — Pain Point 폼과 동일한 마크다운

`pain_point_formatter.to_notion_markdown()`이 Pain Point 폼과 **완전히 동일한 구조**의 마크다운을 생성하고, `notion_blocks.markdown_to_blocks()`가 이를 노션 블록 JSON으로 변환한다.

```
## Pain Point

### 1️⃣ 어떤 기능을 원하시나요? *
{1번 답변}

### 2️⃣ 기존에는 위 업무를 어떤 프로세스로 진행했나요? *
{2번 답변}

### 3️⃣ 어떤 점이 가장 불편한가요? *
- [x] 절대량(혹은 걸리는 시간)이 너무 많다
- [ ] 실수(오류)가 자주 발생한다
...
- [x] 기타 : {입력값}

---

## Solution

### 4️⃣ 해당 업무가 어떻게 바뀌면 좋을까요?
{4번 답변}

...

### 8️⃣ 샘플 파일 또는 예시 링크
[{링크}]({링크})

...
```

체크박스 문항(3·5·6·7·9번)은 선택하지 않은 선택지도 전체 목록으로 나열하고, 선택한 항목만 `- [x]`로 체크된다 — 어떤 선택지가 있었는지 인텔리전스팀이 한눈에 볼 수 있도록 하기 위함이다.

**`notion_blocks.py` 변환기가 지원하는 마크다운 → 노션 블록 매핑**

| 마크다운 | 노션 블록 타입 |
|----------|----------------|
| `#`/`##`/`###` | `heading_1`/`heading_2`/`heading_3` |
| `- [ ]` / `- [x]` | `to_do` (checked 여부 포함) |
| `- `/`* ` (체크박스 아님) | `bulleted_list_item` |
| `1. ` | `numbered_list_item` |
| `> ` | `quote` |
| ` ``` ` 코드 펜스 | `code` (언어 태그는 노션이 허용하는 고정 목록으로 정규화, 미지원 언어는 `plain text`로 대체) |
| GFM 표(`\|...\|` + 구분선) | `table` + `table_row` |
| `**굵게**` / `` `코드` `` / `~~취소선~~` / `*기울임*` | rich_text `annotations` |
| `[텍스트](URL)` | rich_text `link` |
| `---`/`***`/`___` | 무시 (구분선 블록 생성하지 않음) |

**처리한 Notion API 제약사항**

- rich_text 한 항목은 최대 2000자이며, 이 제한은 Python `len()`이 아니라 **UTF-16 코드 유닛 기준**이다 — 이모지 등 서로게이트 쌍 문자가 포함되면 Python 글자 수 기준 청크 분할이 실제로는 2000을 초과할 수 있어, UTF-16 코드 유닛 단위로 직접 청크를 자른다.
- 블록 children은 한 번의 생성/추가 요청당 최대 100개 — 100개 단위로 분할해 순차 추가한다.

### 8.4 행 제목

`notion_service._title(pain_point, service_name)`이 요약 카드의 `summary_card.service_name`을 우선 사용하고, 비어 있을 때만 1번 문항(원하는 기능) 답변의 첫 줄로 대체한다. 요청자의 원문은 길고 정리되지 않은 문장일 수 있어, AI가 정리한 짧은 서비스명을 우선 사용하도록 했다.

### 8.5 사람 속성 매칭 — 신청자 / 담당자

**신청자 (자동 매칭)**

`notion_service._find_submitter_user_id(submitter_name, team)`이 노션 `GET /v1/users`로 워크스페이스 멤버 전체를 조회(페이지네이션 처리)한 뒤, `name` 필드(노션 워크스페이스 멤버 이름은 보통 "이름 + 팀명" 형식으로 등록되어 있음, 예: `"박선애 인텔리전스팀"`)가 입력된 이름으로 시작하는 후보를 찾고, 팀명이 일치하는 후보가 있으면 그 사람으로 확정한다. 동명이인이 있어 팀으로도 구분이 안 되면 일치하는 사람이 정확히 1명일 때만 매칭하고, 그 외에는 빈 값으로 둔다.

**담당자 (기본값 고정)**

생성 시점에는 항상 인텔리전스팀 3인을 기본 담당자로 채운다. 실제 운영 담당자 배정은 인텔리전스팀이 노션에서 직접 변경한다.

```python
DEFAULT_ASSIGNEE_IDS = [
    "18681b4f-7e3e-4fc4-a607-3efa2615aa06",  # 정연이 인텔리전스팀
    "383d872b-594c-810e-abf6-0002796bfa11",  # 박선애 인텔리전스팀
    "38ad872b-594c-81c0-96a6-000217feaf7d",  # 양재현 인텔리전스팀
]
```

> 워크스페이스 멤버가 바뀌면 이 ID 목록을 코드에서 함께 갱신해야 한다.

### 8.6 PRD 하위 페이지 + 멘션 연결

1. PRD 마크다운을 `notion_blocks.markdown_to_blocks()`로 변환해 행 페이지의 **하위 페이지**(`parent: {"page_id": row_page_id}`)로 생성한다. 하위 페이지 제목은 `"PRD - {행 제목}"`.
2. 생성된 하위 페이지 ID로, 행의 "PRD" 컬럼(`rich_text`)에 `mention`/`page` 타입 rich_text를 채워 클릭 가능한 링크 칩으로 연결한다.

노션에는 "페이지를 값으로 갖는 속성 타입"이 없기 때문에, 가장 가까운 방법인 "별도 페이지 생성 + rich_text 멘션"으로 구현했다.

### 8.7 Integration 연결 요건 (운영 시 필수 확인)

- Notion Integration은 토큰 발급만으로 자동으로 데이터베이스에 접근할 수 없다. 대상 데이터베이스 페이지의 "···" → "연결" → "연결 추가하기"에서 **이 서비스가 쓰는 Integration을 명시적으로 연결**해야 한다 (404 `object_not_found` 발생 시 가장 먼저 확인할 부분).
- 신규 워크스페이스 멤버를 위한 "사람" 검색(8.5)이 정상 동작하려면 Integration이 사용자 정보를 조회할 권한이 있어야 한다 (`GET /v1/users`).
- "PRD" 컬럼은 v2.0에서 API로 직접 추가했다 (`PATCH /v1/databases/{id}`로 `rich_text` 속성 추가). "신청자"/"담당자" 컬럼의 `people` 타입 변경은 인텔리전스팀이 노션 UI에서 직접 수행했다.

---

## 9. 환경변수 목록

### 9.1 Backend (`.env`)

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic Claude API 키 |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | 사용 Claude 모델명 |
| `MAX_TOKENS` | `32000` | PRD 생성 최대 토큰 수 |
| `MAX_TOKENS_SUMMARY` | `4096` | 요약 카드·체크리스트 생성 최대 토큰 수 (v2.0: 1024→4096, 긴 입력에서 JSON 잘림 방지) |
| `MAX_FILE_SIZE_MB` | `200` | 파일당 최대 업로드 크기 (MB) |
| `MAX_TOTAL_FILE_SIZE_MB` | `1024` | 전체 파일 최대 업로드 크기 (MB) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS 허용 Origin |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | `eyJ...` | Supabase 서비스 롤 키 |
| `ENV` | `development` | 실행 환경 |
| `NOTION_API_KEY` | `secret_...` / `ntn_...` | 노션 협업 DB에 적재할 Integration 토큰 (v2.0 신규) |
| `NOTION_DATABASE_ID` | `...` | 적재 대상 노션 데이터베이스 ID (v2.0 신규) |
| `SUPABASE_DB_HOST`/`PORT`/`NAME`/`USER`/`PASSWORD` | - | DB 마이그레이션용 직접 Postgres 연결 (Session pooler) |

> **v2.0에서 제거:** `ENABLE_WIREFRAME` (와이어프레임 기능 자체가 삭제됨).

### 9.2 Frontend (`.env.local`)

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | FastAPI 백엔드 베이스 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase 프로젝트 URL (Storage 업로드용) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase 익명 키 |

> **v2.0에서 제거:** `NEXT_PUBLIC_ENABLE_WIREFRAME`.

---

## 10. 실행 방법

### 10.1 사전 요구사항

- Node.js 20 이상 / Python 3.11 이상 / pip
- Supabase 프로젝트, Notion Integration + 대상 데이터베이스 연결 완료 (8.7)

### 10.2 DB 마이그레이션

```bash
cd backend
python scripts/migrate.py up
```

### 10.3 Backend 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # ANTHROPIC_API_KEY, SUPABASE_*, NOTION_* 등 입력
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 10.4 Frontend 실행

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

앱 접속: `http://localhost:3000`

---

## 11. 배포 아키텍처

> 이 섹션은 v1.9~v1.11에서 결정된 내용으로, v2.0 작업 범위에서 별도로 재검토하지 않았다. 배포 시 재확인이 필요하다.

| 영역 | 플랫폼 | 이유 |
|------|--------|------|
| Frontend (Next.js) | Vercel | Next.js 표준 배포 플랫폼, GitHub 연동 시 push마다 자동 배포 |
| Backend (FastAPI) | Render | 서버리스 실행시간 제한 회피 (Claude 생성 소요 시간이 10초 이상) |

- Render 무료 티어 콜드스타트 완화를 위해 GitHub Actions가 10분 주기로 `/api/health`를 핑한다.
- 환경변수는 각 플랫폼 대시보드에 등록하며 코드에 직접 작성하지 않는다. **`NOTION_API_KEY`/`NOTION_DATABASE_ID`를 배포 환경에도 등록해야 한다 (v2.0 추가 항목, 누락 시 확정 시점에 노션 적재가 조용히 실패함).**
