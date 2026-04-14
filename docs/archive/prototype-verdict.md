---
date: 2026-04-12
type: decision
status: Release 0.3 재구축 완료, v1.1
version: 1.1
supersedes: prototype-verdict.md v1.0
related:
  - frame-problem.md
  - jobs-to-be-done.md
  - mvp-scope.md
  - implementation-status.md
---

# Prototype Verdict — 전면 재구축 결정 (v1.1)

`prototype/` 5개 화면에 대한 휴리스틱 평가 결과, **구 기획-배경 7문항 버전의 충실한 구현체**이며 새로 재작성한 설계 원칙(frame-problem / JTBD / mvp-scope)과 **근본적으로 호환되지 않음**을 확인했다.

**결정**: 프로토타입의 **5개 화면과 콘텐츠는 전면 폐기**. 단, **기술 스택·인프라 레이어는 재사용**한다.

**v1.1 업데이트**: Release 0.3 실제 재구축 완료. 상태는 각 섹션에 ✅ 표시. 폐기 대상 파일 5개는 empty stub으로 교체됨 (수동 `rm` 권장).

---

## 1. 재사용 (Keep)

### 기술 스택 전체
- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui 기반)
- React Hook Form + Zod
- Sonner (토스트)
- Inter 폰트
- localStorage (Supabase 전환 전 single-user)

### 인프라 파일 (수정 없음 or 최소)
| 파일 | 상태 |
|------|------|
| `contexts/items-context.tsx` | **그대로** — 상태머신(cooling/ready/passed/purchased/deleted) 그대로 사용. 단 `purchased/passed` 결정 로직은 OK, 라벨만 UI 레벨에서 중립화 |
| `lib/storage.ts` | **그대로** |
| `lib/format.ts` | **그대로** |
| `lib/types.ts` | **수정** — `QuestionNo` 타입 1~7 → 1~5, `ChecklistAnswer.answer`가 텍스트 전용 → 다양한 입력 타입 수용 가능하게 확장 |
| `lib/cooling.ts` | **수정** — 5-tier 확정 (≤5만/~10만/~30만/~100만/100만+) |
| `components/ui/*` (shadcn) | **그대로** |
| 라우팅 구조 | **유지** — `/`, `/new`, `/items/[id]/checklist/[step]`, `/items/[id]/decide`, `/records` + `/about` 신설 |
| `app/layout.tsx` | **그대로** |
| `package.json` 의존성 | **그대로** |

---

## 2. 폐기 (Throw Away)

### 화면 컨텐츠 전부
- `app/page.tsx` (홈)
- `app/new/page.tsx` (등록)
- `app/items/[id]/checklist/[step]/page.tsx` (체크리스트)
- `app/items/[id]/decide/page.tsx` (결정)
- `app/records/page.tsx` (기록)

### 화면별 컴포넌트
- `components/item-card.tsx`
- `components/empty-state.tsx`
- `components/decide-buttons.tsx`
- `components/answers-dialog.tsx`
- `lib/questions.ts` (7문항 정의)

### 원칙 위반 요소 (철거 확정)
- ❌ `/records`의 "이번 달 절약 금액" + "포기율" 블록 — **크라우딩 아웃 + 판단 강요** (원칙 7-3, 7-6)
- ❌ 7문항 심문체 — **MVP 스코프 5문항 + 친구 톤 + Gawande 동사형** 위반
- ❌ 모든 체크리스트 문항 Textarea 자유 입력 — **Mechanical/Cognitive 마찰 구분 실패** (원칙 7-8 + M10)
- ❌ 편향 학술 라벨 노출 ("감정적 구매", "기회비용 무시") — Nielsen #2 위반
- ❌ 등록 폼의 자유 서술 `memo` 필드 — 합리화 저격 실패 (원칙 7-4)
- ❌ 존댓말 에러 메시지 — 친구 톤 2-layer 위반 (원칙 7-7)

---

## 3. 신규 설계 필요

### 화면 (5 + 1)
- `/` 홈 — **결정 대기 픽업존 최상단 고정** (O2a) + 냉각 중 리스트 하단
- `/new` 등록 — **Circuit Breaker 4단계 wizard** (O1a/b, O3a, O3b)
- `/items/[id]/checklist/[step]` — **5문항 + 입력 타입 차등화** (O4a~d)
- `/items/[id]/decide` — **재회 프레이밍 + 답변 열람 + 대칭 결정 버튼** (O4e, O6c)
- `/records` — **결정 N개 중립 카운트 + 타임라인** (O6a, O6b)
- **`/about` 신설** — Wanting vs Liking 설명 1페이지 (O7a)

### 새 컴포넌트 (v1.1 실제 구현)
- ✅ **Circuit Breaker는 `app/new/page.tsx` 내부 인라인** (별도 wizard 컴포넌트 안 만듦)
- ✅ `EmojiPicker` → `components/checklist/emoji-picker.tsx` (Affect Labeling)
- ✅ `SealAnimation` → `components/seal-animation.tsx` (motion library, 3-stage drift)
- ✅ `PickupCard` → `components/home/pickup-card.tsx` (warm tone)
  - ⚠️ O2b PWA 배지는 **미구현**, Phase 2 이관
- ✅ Records 타임라인은 `app/records/page.tsx` 인라인 (MonthSection, RecordCard 인라인)
- ✅ `AnswerReviewDialog` → `components/records/answer-review-dialog.tsx`
- ❌ `CoolingTimer` — 인라인 처리, 별도 컴포넌트 안 만듦 (CoolingCard에 내장)
- ✅ Blank waiting → `app/items/[id]/cooling-waiting/page.tsx` (컴포넌트 없이 페이지 직접)
- **v1.1 신규**: `AIProbeBubble` → `components/checklist/ai-probe-bubble.tsx` (AI fact-check scaffold)

### 새 라이브러리 (v1.1 실제 구현)
- ✅ `lib/checklist.ts` — 4문항 정의 + `CHECKLIST`, `MOOD_OPTIONS`, 타입 가드
- ❌ `lib/circuit-breaker.ts` — 생성 안 함. CB 상태는 react-hook-form이 처리
- ❌ `public/manifest.json` PWA 배지 — **Phase 2 이관**
- ❌ Service Worker / Web Push — **Phase 2 이관**
- **v1.1 신규**: `lib/ai/mock-probes.ts` — AI probe rule-based mock selector (5 scenarios)

---

## 4. 재설계 원칙 재확인

새 화면·컴포넌트 설계 시 상위 기준 문서:

1. **`frame-problem.md`** — Problem statement, persona, 10개 원칙, 10개 과학 메커니즘
2. **`jobs-to-be-done.md`** — Core job, 6 moments, 설계 입력값
3. **`mvp-scope.md`** — 17 opportunities + themes + critical path

이 세 문서 중 어느 것과 충돌하면 **바로 중단하고 문서를 먼저 수정**한다. 코드가 문서를 선도하지 않음.

---

## 5. 실제 진행 결과 (v1.1 업데이트)

- ✅ `interaction-design.md` 작성 완료 (v1.1까지)
- ✅ `screen-design.md` 작성 완료 (v1.1까지)
- ✅ **Release 0.1~0.8 구현 완료** — Theme A~E 모든 화면·컴포넌트
- ✅ **Release 0.10 AI Layer scaffold** 완료 (신규 MVP 확장)
- ✅ PRD + Story Map v1.1 업데이트 완료
- ⏳ Release 0.9 (엣지 케이스·접근성·30초 grace) 미착수
- ⏳ Release 0.11~0.12 (AI 실제 API + 프롬프트 iteration) 미착수

## 6. 폐기 대상 stub 파일 — 수동 삭제 권장

Release 0.3 재작성 완료 후 다음 5개 파일은 **아무 import 없이** empty stub(`export {};`) 상태로 남아있음. 수동 삭제 명령:

```bash
rm /Users/musinsa/cooling-off/prototype/lib/questions.ts
rm /Users/musinsa/cooling-off/prototype/components/answers-dialog.tsx
rm /Users/musinsa/cooling-off/prototype/components/empty-state.tsx
rm /Users/musinsa/cooling-off/prototype/components/item-card.tsx
rm /Users/musinsa/cooling-off/prototype/components/cooling-timer.tsx
```

삭제 후 `npm run lint` 재실행하여 import 에러 없는지 확인.

## 7. 연관 문서

구현 상태의 단일 진실 공급원: **`docs/implementation-status.md`**. Drift, 미구현, 기술 결정은 거기 기록.
