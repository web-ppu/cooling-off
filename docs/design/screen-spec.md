# 쿨링오프 — Screen Spec

> 화면별 레이아웃 + 인터랙션 + 상태 전이. 자주 바뀌는 문서.
>
> **관련 문서:**
> - 디자인 시스템: [`./design-system.md`](./design-system.md)
> - 요구사항: [`../pm/prd.md`](../pm/prd.md)
> - 설계 원칙: [`../archive/frame-problem.md`](../archive/frame-problem.md)
> - Tech Spec: [`../engineering/tech-spec.md`](../engineering/tech-spec.md)
> - AI 프롬프트: [`../engineering/ai-prompt-v1.md`](../engineering/ai-prompt-v1.md)

---

## 1. State Machine

### 1-1. Item Lifecycle

DB 상태 5개: `cooling`, `ready`, `purchased`, `passed`, `deleted`
UI 전용 상태 4개: `draft`, `chat-active`, `chat-done`, `deciding` (저장 안 됨, 화면 전환용)

```
           ┌─────────┐
           │  draft  │  (단일 폼 입력 중, localStorage 미저장)
           └────┬────┘
                │ [봉인하기] + 이름/가격 valid
                ↓
           ┌─────────┐
           │ cooling │  (가격별 5-tier 타이머)
           └────┬────┘
                │ cooling_until <= now (30초 주기 체크)
                ↓
           ┌─────────┐
           │  ready  │  (Decide 대기)
           └────┬────┘
                │ pickup 카드 탭 → /decide 진입
                ↓
           ┌──────────────┐
           │ chat-active  │  (Phase A: AI chat, turn 1~N)
           └──────┬───────┘
                  │ [END] / escape / hard cap
                  ↓
           ┌──────────────┐
           │  chat-done   │  (Phase A → B 전이 대기)
           └──────┬───────┘
                  │ [결정하러 가기] 탭
                  ↓
           ┌──────────────┐
           │   deciding   │  (Phase B: [안 삼] / [삼])
           └──┬───────┬───┘
              │       │
         [안 삼]   [삼]
              │       │
        ┌─────▼───────▼─┐
        │   passed /    │
        │   purchased   │
        └───────┬───────┘
                │ 사용자 수동 삭제
                ↓
           ┌─────────┐
           │ deleted │
           └─────────┘
```

### 1-2. Transitions

| From | To | Trigger | Guard |
|------|-----|---------|-------|
| — | `draft` | `/new` 진입 | — |
| `draft` | `cooling` | [봉인하기] 탭 | 이름+가격 valid |
| `draft` | (소멸) | `/new` 이탈 | 저장 안 됨 |
| `cooling` | `ready` | 타이머 만료 | 자동, 30s 주기 |
| `cooling` | `deleted` | 30s 그레이스 내 "취소" | `created_at + 30s > now` |
| `ready` | `chat-active` | pickup 카드 탭 | `/decide` 진입 |
| `chat-active` | `chat-done` | AI `[END]` / 사용자 escape / hard cap | — |
| `chat-done` | `deciding` | [결정하러 가기] 탭 | — |
| `deciding` | `passed` | [안 삼] 탭 | — |
| `deciding` | `purchased` | [삼] 탭 | — |
| `passed`/`purchased` | `deciding` | [실행 취소] 토스트 | `decided_at + 5s > now` |
| `passed`/`purchased` | `deleted` | 기록에서 삭제 | — |

**핵심 결정:**

- cooling 상태에서 삭제 불가 (commitment device). 단 등록 후 30s 그레이스.
- 결정 후 5s Undo.
- ready → deleted 직접 전이 없음 (반드시 AI Chat 경유).

### 1-3. Screen State Matrix

| Screen | States |
|--------|--------|
| `/` (Home) | `empty` / `has-cooling-only` / `has-ready-only` / `has-both` |
| `/new` | `editing` / `sealing` / `submitting` |
| `/items/[id]/cooling-waiting` | `waiting` |
| `/items/[id]/decide` Phase A | `chat-idle` / `chat-opener` / `awaiting-user` / `ai-thinking` / `ai-streaming` / `chat-done` / `ai-error` |
| `/items/[id]/decide` Phase B | `loaded` / `deciding` / `confirmed-with-undo` / `confirmed-final` |
| `/records` | `empty` / `has-items` / `dialog-open` |
| `/about` | `static` |

---

## 2. 화면별 스펙

### 2-1. 홈 (`/`)

```
┌──────────────────────────────────────┐
│  🧊 쿨링오프              [기록] [?] │  ← Header
├──────────────────────────────────────┤
│                                      │
│  🔴 결정 대기 (N)                    │  ← SectionHeader (warm dot)
│  ┌──────────────────────────────┐    │
│  │  PickupCard (warm shadow)    │    │
│  │  아이템명 · ₩가격            │    │
│  │  "결정할 시간이 왔어"  →     │    │
│  └──────────────────────────────┘    │
│                                      │
│  🔵 냉각 중 (N)                      │  ← SectionHeader (cool dot)
│  ┌──────────────────────────────┐    │
│  │  CoolingCard                 │    │
│  │  아이템명 · ₩가격            │    │
│  │  ⏱ 남은 시간                 │    │
│  └──────────────────────────────┘    │
│                                      │
│            [+ 봉인하기]  ← FAB       │
└──────────────────────────────────────┘
```

**State Variants:**

| State | 표시 |
|-------|------|
| `empty` | HomeEmptyState — 일러스트 + "사고 싶은 게 있어?" |
| `has-cooling-only` | cooling 섹션만 |
| `has-ready-only` | ready 섹션만 (warm) |
| `has-both` | ready 섹션 상단, cooling 섹션 하단 |

**Components:** PickupCard, CoolingCard, SectionHeader, HomeEmptyState, DevCompleteButton (dev-only)

**Responsive:**

| Breakpoint | 동작 |
|------------|------|
| Mobile (<640) | 1열 + FAB 하단 |
| Tablet (640+) | max-w 720, FAB 헤더 |
| Desktop (1024+) | 2열 그리드, max-w 960 |

### 2-2. 등록 (`/new`)

```
┌──────────────────────────────┐
│  ← 뒤로                      │
├──────────────────────────────┤
│                              │
│  뭘 사고 싶어?               │  ← h1
│                              │
│  ┌────────────────────────┐  │
│  │  아이템 이름            │  │  ← Input
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  가격 (₩)              │  │  ← Input (number)
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  메모 (선택)            │  │  ← Textarea
│  └────────────────────────┘  │
│                              │
│  CoolingPreview              │  ← 가격→냉각기 라벨
│  "₩50,000 → 냉각기 24시간"  │
│                              │
│  [🔒 봉인하기]               │  ← Primary CTA
│                              │
└──────────────────────────────┘
```

단일 폼. RHF + Zod validation.

[봉인하기] 탭 시 SealAnimation (motion, 3-stage, 1400ms) → cooling 전이 → 홈 이동.

**Components:** RegisterForm, CoolingPreview, SealAnimation

### 2-3. 냉각 중 (`/items/[id]/cooling-waiting`)

```
┌──────────────────────────────┐
│  ← 홈으로                    │
├──────────────────────────────┤
│                              │
│         아이템명              │  ← h2, 센터
│         ₩가격                │
│                              │
│       ┌─────────────┐        │
│       │  BigTimer   │        │  ← display size
│       │  23:59:42   │        │
│       └─────────────┘        │
│                              │
│   "지금은 기다리는 시간이야"  │  ← body, muted
│                              │
└──────────────────────────────┘
```

max-width 440px. 타이머 만료 시 자동 ready 전이.

**Components:** BlankWaitingScreen, BigTimer

### 2-4. AI Chat + Decide (`/items/[id]/decide`)

두 Phase가 하나의 라우트에서 순차 진행.

**Phase A — Chat**

```
┌──────────────────────────────────┐
│  MiniItemHeader (sticky)         │
│  아이템명 · ₩가격                │
├──────────────────────────────────┤
│                                  │
│  ┌─ AI ──────────────────┐       │
│  │ 네 말 들어볼게.       │       │  ← MessageBubble (ai)
│  │ 이거 왜 사고 싶어?    │       │
│  └───────────────────────┘       │
│                                  │
│       ┌──────────────── User ─┐  │
│       │ 매일 출근길에 보이는데 │  │  ← MessageBubble (user)
│       │ 매번 눈이 가더라고    │  │
│       └───────────────────────┘  │
│                                  │
│  ┌─ AI ──────────────────┐       │
│  │ TypingIndicator ···   │       │  ← ai-thinking 상태
│  └───────────────────────┘       │
│                                  │
│  ChatEscapeButton                │
│  "결정하러 갈게 →"  (ghost)      │
│                                  │
├──────────────────────────────────┤
│  [ChatInput ___________] [전송]  │  ← textarea auto-grow
└──────────────────────────────────┘
```

chat-done 시 ChatInput → ChatDoneCTA ("결정하러 가기")로 교체.

**Phase B — Decide**

```
┌──────────────────────────────────┐
│  MiniItemHeader (sticky)         │
│  아이템명 · ₩가격                │
├──────────────────────────────────┤
│                                  │
│  DecideHeader                    │
│  "다시 만났네"                   │  ← 재회 프레이밍
│                                  │
│  ┌────────────────────────────┐  │
│  │ ChatTranscript (scroll)   │  │  ← 전체 대화
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────┐      │
│  │  안 삼   │  │   삼     │      │  ← DecideButtonPair (대칭)
│  └──────────┘  └──────────┘      │
│                                  │
└──────────────────────────────────┘
```

결정 후 UndoToast (sonner, 5s).

**Components:** ChatScreen, ChatMessageList, MessageBubble, ChatInput, ChatEscapeButton, ChatDoneCTA, TypingIndicator, MiniItemHeader, DecideHeader, DecideButtonPair, ChatTranscript, UndoToast

### 2-5. 기록 (`/records`)

```
┌──────────────────────────────────┐
│  ← 홈으로              기록      │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ 아이템명    ₩가격          │  │
│  │ StatusPill("안 삼")        │  │
│  │ 2026-04-12                 │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

카드 탭 시 ChatReviewDialog:

```
┌──────────────────────────────────┐
│  아이템명 · ₩가격 · 결과         │
│  ─────────────────────────────── │
│  당시 대화                       │
│  🤖 네 말 들어볼게...            │
│  🧍 매일 출근길에...              │
│  🤖 3개월 전에도...              │
│  🤖 결정은 네가 해...            │
│              [닫기]              │
└──────────────────────────────────┘
```

**Components:** ChatReviewDialog, StatusPill

### 2-6. About (`/about`)

정적 페이지. max-width 680px.

- **왜?** — 충동구매 비용 설명
- **어떻게?** — "냉각기 후 AI와 대화하며 다시 판단해"
- **원칙** — 설계 원칙 요약

### 2-7. 구버전 호환 (`/items/[id]/checklist/[step]`)

`/items/[id]/decide`로 자동 리디렉트. 별도 UI 없음.

---

## 3. 공통 패턴

### 3-1. 애니메이션 원칙

| 대상 | 스펙 |
|------|------|
| SealAnimation | 3-stage (shrink → lock → disappear), 1400ms, motion/react |
| 카드 등장 | stagger 50ms per card |
| 페이지 전환 | y:20→0 opacity, 300ms ease-out |
| Chat 버블 등장 | y:8→0 opacity, 200ms |
| TypingIndicator | 3-dot 펄스 |

**금지:** 펄스, 반짝임, 글로우 (도파민 유발). TypingIndicator의 3-dot만 예외.

### 3-2. 에러 처리

| 상황 | 처리 |
|------|------|
| 네트워크 에러 | toast + retry 버튼 |
| AI 응답 실패 | "AI가 응답하지 못했어. 바로 결정하러 갈게" → Phase B |
| 404 | 홈으로 리다이렉트 |

### 3-3. 반응형 전략

| 화면 | Mobile (<640) | Tablet (640+) | Desktop (1024+) |
|------|---------------|---------------|-----------------|
| `/` | 1열 + FAB 하단 | max-w 720, FAB 헤더 | 2열 그리드, max-w 960 |
| `/new` | 1열 + CTA 하단 | max-w 560 센터 | 동일 |
| `cooling-waiting` | 1열 min | max-w 440 센터 | 동일 |
| `/decide` | 1열 + input 하단 | max-w 600 센터 | 동일 |
| `/records` | 1열 | max-w 720 센터 | 동일 |
| `/about` | 1열 | max-w 680 센터 | 동일 |

원칙: reading-optimized 1열. 예외는 홈 desktop (2열 카드).

---

## 4. 컴포넌트 카탈로그

### 홈

| Component | 역할 |
|-----------|------|
| `PickupCard` | warm shadow, 결정 대기 CTA |
| `CoolingCard` | cool 톤, 타이머 표시 |
| `SectionHeader` | warm/cool dot + 개수 |
| `HomeEmptyState` | 빈 상태 일러스트 |

### 등록

| Component | 역할 |
|-----------|------|
| `RegisterForm` | 단일 폼, RHF + Zod |
| `CoolingPreview` | 가격 → 냉각기 라벨 |
| `SealAnimation` | motion, 3-stage, 1400ms |

### Chat (Phase A)

| Component | 역할 |
|-----------|------|
| `ChatScreen` | container |
| `ChatMessageList` | scroll auto-follow |
| `MessageBubble` | ai/user variant |
| `ChatInput` | textarea auto-grow + send |
| `ChatEscapeButton` | "결정하러 갈게 →" ghost |
| `ChatDoneCTA` | chat-done 시 input 대체 |
| `TypingIndicator` | 3-dot 펄스 |
| `MiniItemHeader` | sticky, 이름+가격 |

### Decide (Phase B)

| Component | 역할 |
|-----------|------|
| `DecideHeader` | 재회 프레이밍 |
| `DecideButtonPair` | 대칭 [안 삼]/[삼] |
| `ChatTranscript` | 전체 대화 scroll |
| `UndoToast` | sonner, 5s |

### 기록

| Component | 역할 |
|-----------|------|
| `ChatReviewDialog` | Chat transcript 표시 |
| `StatusPill` | 중립 "삼"/"안 삼" |

### 냉각 중

| Component | 역할 |
|-----------|------|
| `BlankWaitingScreen` | 대기 화면 |
| `BigTimer` | display size 타이머 |

### shadcn primitives

accordion, button, card, dialog, form, input, label, separator, sonner, textarea

---

## 5. 폐기 기록

v1.2 (2026-04-12, LLM chat pivot)에서 폐기:

| 폐기 대상 | 대체 |
|-----------|------|
| Circuit Breaker 4-step wizard | 단일 폼 (`RegisterForm`) |
| Decision Checklist 4문항 | AI Chat Phase A |
| AIProbeBubble (inline) | full ChatScreen |
| Affect Labeling (emoji) | 제거 (cargo cult) |
| `/items/[id]/checklist/[step]` | `/items/[id]/decide` 리디렉트 |

근거: `archive/adr-llm-chat-pivot.md` 참조.
