# 쿨링오프 -- 개발 참고 메모

> 개발자가 구현 방식을 확정할 때 참고하는 최소 메모입니다.
> PRD와 화면 정책은 사용자 요구사항과 화면 동작만 정의하고, DB/Auth/ERD/API 세부는 개발자가 결정합니다.

---

## 1. 현재 확정된 제품 조건

- 반응형 웹 서비스로 구현합니다.
- MVP는 최소 로그인 방식 1개를 제공합니다.
- 실제 등록, 냉각, AI 채팅, 기록 열람은 로그인 후 가능합니다.
- 등록 물건, 결정 결과, AI 채팅 기록은 계정 기반 영구 저장소에 저장합니다.
- 사용자 데이터는 사용자별로 분리되어야 합니다.
- 브라우저 로컬 저장소는 사용자 데이터 저장에 사용하지 않습니다.
- 냉각기가 끝난 항목은 결정 대기 상태로 표시합니다.
- 냉각기 만료 시 알림을 제공합니다. 알림은 웹 기술 스택 안에서 구현합니다.
- 현재 MVP의 AI 채팅은 mock 기반이며, 이후 실제 AI API 연결을 검토합니다.

---

## 2. 개발자가 확정할 것

- Auth provider와 로그인 방식
- DB/저장소 선택
- 데이터 모델과 테이블 구조
- API 경로와 요청/응답 구조
- 알림 구현 조합
- 실제 AI API 연결 방식
- 배포/환경변수/운영 설정

---

## 3. 이 문서에서 정하지 않는 것

- ERD
- TypeScript 타입 정의
- 컴포넌트 파일 구조
- 특정 폼/검증 라이브러리
- 특정 DB 제품
- 특정 Auth 제품
- AI API 비용 추산
- prompt caching 같은 API 최적화 세부

---

## 4. 관련 문서

- 요구사항: [`../pm/prd.md`](../pm/prd.md)
- 화면 정책: [`../design/screen-spec.md`](../design/screen-spec.md)
- AI 프롬프트: [`./ai-prompt-v1.md`](./ai-prompt-v1.md)

---

## 5. 확정된 기술 스택

### Frontend

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 + TypeScript |
| 스타일 | Tailwind CSS + shadcn/ui |
| 서버 상태 | TanStack Query |
| UI 상태 | Zustand |
| 폼 검증 | React Hook Form + Zod |
| 날짜/시간 | date-fns |

### Backend / DB / Auth

| 항목 | 선택 |
|------|------|
| DB + Auth | Supabase (Postgres + Auth + Row Level Security) |
| 로그인 | Google OAuth 1개 |
| 알림 트리거 | Supabase Cron + Edge Function |
| 이메일 발송 | Resend |

### AI

| 단계 | 구현 |
|------|------|
| MVP | `/api/chat` POST, mock 응답. 응답 스키마: `{ message, providedNewPerspective, isFinalTurn }` |
| Phase 2 | Anthropic SDK 교체 — 동일 스키마 유지 |

- `providedNewPerspective: true` 일 때 클라이언트가 [결정하기] 버튼 노출
- [결정하기] 노출 조건과 냉각 기간 단위는 추후 변경 가능성 있음

### 변경 가능 항목 격리

| 파일 | 역할 |
|------|------|
| `src/lib/cooling.ts` | 가격 → 냉각 시간 변환 (현재 N×24h) |
| `src/lib/ai-mock.ts` | mock 응답 생성 |
| `src/lib/decision-trigger.ts` | [결정하기] 노출 조건 판단 |

### 품질 / 배포

| 항목 | 선택 |
|------|------|
| 단위 테스트 | Vitest |
| E2E 테스트 | Playwright |
| 배포 | Vercel + Supabase |
