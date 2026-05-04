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

## 0. 변경 이력

### v1.4 (2026-05-01, PRD 정합성 수정)

| 변경 | 왜 바꿨는지 |
|------|-------------|
| 냉각 중 UI에서 상품명·가격·URL 비노출로 수정 | `wanting` 재점화를 막는 PRD 원칙과 FR-2를 맞추기 위해 |
| 등록 폼을 4필드(이름/가격/URL/"왜 사고 싶어?")로 수정 | PRD의 단일 폼 요구사항과 실제 입력 정보를 일치시키기 위해 |
| `ready → deleted` 자동 전이를 추가하고 ready window를 48시간으로 명시 | `default = 삭제`를 상태 머신에 실제로 반영하고, 구매를 능동적 opt-in으로 만들기 위해 |
| 결정 기록 삭제 경로를 제거 | 과거 기록이 AI 반박의 핵심 자산이라, 결정 이후 이력을 남겨야 제품 논리가 유지되기 때문에 |
| 기록 화면에 중립 카운트 + 월별 그룹핑을 추가 | PRD의 "결정의 궤적" 정의를 화면 스펙에 반영하기 위해 |
| About 페이지에 데이터 저장 정책과 쇼핑중독 면책을 추가 | PRD가 요구하는 주의 문구를 누락 없이 명시하기 위해 |
| AI 시작 메시지를 고정 opener로 수정 | PRD의 "항상 같은 질문으로 시작" 규칙과 Decide 예시를 맞추기 위해 |
| 등록 직후 30초 취소 UI를 홈 토스트로 명시 | 상태 전이만 있고 UI가 없던 grace cancel을 실제 인터랙션으로 구체화하기 위해 |

## 1. State Machine

### 1-1. Item Lifecycle

저장 상태 5개: `cooling`, `ready`, `purchased`, `passed`, `deleted`
UI 전용 상태 5개: `draft`, `chat-gathering`, `chat-perspective`, `fact-summary`, `deciding` (저장 안 됨, 화면 전환용)

```
           ┌─────────┐
           │  draft  │  (단일 폼 입력 중, 아직 저장 안 됨)
           └────┬────┘
                │ [봉인하기] + 이름/가격 유효
                ↓
           ┌─────────┐
           │ cooling │  (가격별 5-tier 타이머, 정보 비공개)
           └──┬───┬──┘
  30s 그레이스│   │ cooling_until <= now (30초 주기 체크)
    내 취소   │   ↓
              │ ┌─────────┐
              │ │  ready  │  (Decide 대기, 48h window)
              │ └────┬────┘
              │      │ pickup 카드 탭 → /decide 진입
              │      ↓
              │ ┌──────────────────┐
              │ │ chat-gathering   │  (AI 정보 수집 중, [결정하기] 미노출)
              │ └──────┬───────────┘
              │        │ AI 응답 phase: "perspective"
              │        ↓
              │ ┌──────────────────┐
              │ │ chat-perspective │  ([결정하기] 버튼 노출, 대화 계속 가능)
              │ └──────┬───────────┘
              │        │ [결정하기] 탭 / hard cap 10턴
              │        ↓
              │ ┌──────────────┐
              │ │ fact-summary │  (팩트 요약 카드 표시)
              │ └──────┬───────┘
              │        │ 자동 전이 (요약 표시 후)
              │        ↓
              │ ┌──────────────┐
              │ │   deciding   │  ([안 삼] / [삼])
              │ └──┬───────┬───┘
              │    │       │
              │[안 삼]   [삼]
              │    │       │
              │    ↓       ↓
              │ ┌──────┐ ┌───────────┐
              │ │passed│ │purchased  │
              │ └──────┘ └───────────┘
              │
              │ ready window 만료 / 그레이스 취소
              ↓
           ┌─────────┐
           │ deleted │
           └─────────┘
```

### 1-2. Transitions

| From | To | Trigger | Guard |
|------|-----|---------|-------|
| — | `draft` | `/new` 진입 | — |
| `draft` | `cooling` | [봉인하기] 탭 | 이름+가격 유효 |
| `draft` | (소멸) | `/new` 이탈 | 저장 안 됨 |
| `cooling` | `ready` | 타이머 만료 | 자동, 30s 주기 |
| `cooling` | `deleted` | 홈 토스트의 [취소] | `created_at + 30s > now` |
| `ready` | `chat-gathering` | pickup 카드 탭 | `/decide` 진입 |
| `ready` | `deleted` | ready window 만료 | `ready_at + 48h <= now` |
| `chat-gathering` | `chat-perspective` | AI 응답 `phase: "perspective"` | — |
| `chat-perspective` | `fact-summary` | [결정하기] 탭 / hard cap 10턴 | — |
| `fact-summary` | `deciding` | 팩트 요약 표시 완료 | — |
| `deciding` | `passed` | [안 삼] 탭 | — |
| `deciding` | `purchased` | [삼] 탭 | — |
| `passed`/`purchased` | `deciding` | [실행 취소] 토스트 | `decided_at + 5s > now` |

**핵심 결정:**

- cooling 상태에서는 상품명/가격/URL 비노출. 단 등록 직후 30s 그레이스 동안만 홈 토스트로 취소 가능.
- ready 상태는 48시간 동안만 유지. 아무 행동이 없으면 `deleted`로 자동 전이되어 `default = 삭제`를 구현.
- 결정 후 5s Undo.
- 결정이 확정된 `passed`/`purchased` 항목은 기록으로 보존되며 삭제 UI를 두지 않음.
- **[결정하기] 버튼은 `chat-perspective` 이후에만 노출** — AI가 관점을 제시하기 전에는 결정 불가.
- **대화와 결정 버튼이 같은 화면에 공존** — 별도 화면 전환 없음.

### 1-3. Screen State Matrix

| Screen | States |
|--------|--------|
| `/` (Home) | `empty` / `has-cooling-only` / `has-ready-only` / `has-both` / `grace-cancel-visible` |
| `/new` | `editing` / `sealing` / `submitting` |
| `/items/[id]/cooling-waiting` | `waiting` |
| `/items/[id]/decide` Chat | `chat-idle` / `chat-opener` / `awaiting-user` / `ai-thinking` / `ai-streaming` / `ai-error` |
| `/items/[id]/decide` 결정 | `perspective-shown` / `fact-summary` / `deciding` / `confirmed-with-undo` / `confirmed-final` |
| `/records` | `empty` / `has-month-groups` / `dialog-open` |
| `/about` | `static` |

### 1-4. Login Guard

MVP는 최소 로그인 방식 1개를 제공한다. 구체 구현 방식은 개발 문서에서 확정한다.

| Route | 비로그인 접근 | 로그인 후 |
|-------|---------------|-----------|
| `/` | 로그인 버튼 + About 링크 표시 | 사용자 계정 데이터 기준 홈 표시 |
| `/new` | 로그인 화면/버튼으로 이동 | 등록 폼 표시 |
| `/items/[id]/cooling-waiting` | 로그인 화면/버튼으로 이동 | 본인 item이면 대기 화면 표시 |
| `/items/[id]/decide` | 로그인 화면/버튼으로 이동 | 본인 ready item이면 Decide 표시 |
| `/records` | 로그인 화면/버튼으로 이동 | 본인 결정 기록 표시 |
| `/about` | 접근 가능 | 접근 가능 |

- 비로그인 사용자는 실제 등록, 냉각, Decide, 기록 열람을 할 수 없다.
- 로그인 후 모든 item/chat 조회는 현재 로그인 사용자의 데이터로 제한한다.
- 다른 사용자의 item id 또는 존재하지 않는 id로 접근하면 홈으로 리다이렉트한다.

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
│  │  봉인됨                      │    │
│  │  ⏱ 남은 시간                 │    │
│  └──────────────────────────────┘    │
│                                      │
│  [방금 봉인했습니다. 30초 안에 취소 가능] │  ← GraceCancelToast
│                                      │
│            [+ 봉인하기]  ← FAB       │
└──────────────────────────────────────┘
```

**State Variants:**

| State | 표시 |
|-------|------|
| `empty` | HomeEmptyState — 일러스트 + "사고 싶은 물건이 있나요?" |
| `has-cooling-only` | cooling 섹션만 |
| `has-ready-only` | ready 섹션만 (warm) |
| `has-both` | ready 섹션 상단, cooling 섹션 하단 |

- cooling 카드에는 **상품명/가격/URL을 노출하지 않음**. 카드 전체는 대기 화면으로 이동하는 affordance만 제공.
- 등록 직후 30초 동안만 `GraceCancelToast` 노출. 여기서만 [취소] 가능.

**Components:** PickupCard, CoolingCard, SectionHeader, HomeEmptyState, GraceCancelToast, DevCompleteButton (dev-only)

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
│  사고 싶은 물건 등록          │  ← h1
│                              │
│  ┌────────────────────────┐  │
│  │  아이템 이름            │  │  ← Input
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  가격 (₩)              │  │  ← Input (number)
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  URL (선택)            │  │  ← Input
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  왜 사고 싶어?         │  │  ← Textarea (1~3줄)
│  │  14일 뒤 돌아왔을 때   │  │
│  │  나중에 다시 볼 이유예요 │  │
│  └────────────────────────┘  │
│                              │
│  CoolingPreview              │  ← 가격→냉각기 라벨
│  "₩50,000 → 냉각기 24시간"  │
│                              │
│  [🔒 봉인하기]               │  ← 주요 버튼
│                              │
└──────────────────────────────┘
```

단일 폼. 입력 검증 적용.

[봉인하기] 탭 시 SealAnimation (motion, 3-stage, 1400ms) → cooling 전이 → 홈 이동 + `GraceCancelToast` 30초 노출.

#### 입력 검증

| 필드 | 정책 | 에러 문구 |
|------|------|-----------|
| 이름 | 필수, 공백만 입력 불가, 최대 40자 | 이름을 입력해 주세요 |
| 가격 | 필수, 1원 이상 정수 | 가격을 숫자로 입력해 주세요 |
| URL | 선택. 입력한 경우 URL 형식 확인 | 링크 형식을 확인해 주세요 |
| 왜 사고 싶어? | 선택, 최대 200자 | 200자 이내로 입력해 주세요 |

- [봉인하기]는 이름과 가격이 유효할 때만 활성화.
- URL 형식 오류는 저장을 막지 않고 경고만 표시한다. 등록 30초 원칙을 우선한다.
- "왜 사고 싶어?"는 선택이지만, 비어 있으면 보조 문구로 작성 유도.
- 입력 검증 문구는 AI 말투와 분리한다. 사용자가 막힌 상황이므로 반말을 쓰지 않는다.

**Components:** RegisterForm, CoolingPreview, SealAnimation

### 2-3. 냉각 중 (`/items/[id]/cooling-waiting`)

```
┌──────────────────────────────┐
│  ← 홈으로                    │
├──────────────────────────────┤
│                              │
│                              │
│       ┌─────────────┐        │
│       │  BigTimer   │        │  ← display size
│       │  23:59:42   │        │
│       └─────────────┘        │
│                              │
│   "지금은 기다리는 시간입니다" │  ← body, muted
│                              │
└──────────────────────────────┘
```

max-width 440px. 상품명/가격/URL 비노출. 타이머 만료 시 자동 ready 전이.

**Components:** BlankWaitingScreen, BigTimer

### 2-4. Decide (`/items/[id]/decide`) — 단일 화면, 4단계

대화와 결정이 **같은 화면**에서 진행. 별도 화면 전환 없음.

> 의사결정 근거: [`../archive/adr-decide-flow.md`](../archive/adr-decide-flow.md)
> AI-프론트엔드 인터페이스: [`../engineering/ai-frontend-contract.md`](../engineering/ai-frontend-contract.md)

**단계 ①~② — AI 대화 + [결정하기] 버튼**

```
┌──────────────────────────────────┐
│  MiniItemHeader (sticky)         │
│  아이템명 · ₩가격                │
├──────────────────────────────────┤
│                                  │
│  ┌─ AI ──────────────────┐       │
│  │ 네 말 들어볼게. 왜 이거 │       │  ← 항상 같은 opener로 시작
│  │ 지금 사고 싶어?         │       │
│  └───────────────────────┘       │
│                                  │
│       ┌──────────────── User ─┐  │
│       │ 제스처 볼륨은 잘      │  │
│       │ 쓰겠지               │  │
│       └───────────────────────┘  │
│                                  │
│  ┌─ AI ──────────────────┐       │
│  │ 35만원어치 귀찮음인    │       │  ← phase: perspective
│  │ 거야.                  │       │    → [결정하기] 버튼 노출
│  └───────────────────────┘       │
│                                  │
├──────────────────────────────────┤
│  [결정하기]          (sticky)    │  ← perspective 이후 노출
├──────────────────────────────────┤
│  [ChatInput ___________] [전송]  │  ← 대화 계속 가능
└──────────────────────────────────┘
```

- 첫 AI 메시지는 항상 `"네 말 들어볼게. 왜 이거 지금 사고 싶어?"`로 고정.
- `phase: gathering` 동안: [결정하기] 버튼 **미노출**. 채팅만.
- 둘째 턴부터는 등록 사유, 과거 기록, 사용자 답변을 바탕으로 구체화 질문 진행.
- `phase: perspective` 이후: [결정하기] 버튼 **노출**. 채팅 입력창도 유지 (대화 계속 가능).
- `phase: closing` 시: AI가 "결정할 준비 됐어?"라고 대화로 마무리 제안. 사용자가 "아직"이면 대화 계속.
- Hard cap 10턴: AI가 맥락 인지 마무리 + 입력창 비활성화. [결정하기] 버튼만 남음.
- [결정하기] 버튼은 한 번 나타나면 사라지지 않음.

**단계 ③ — 팩트 요약 카드**

[결정하기] 탭 시 채팅 입력창 사라지고, 팩트 요약 카드가 대화 아래에 표시.

```
┌──────────────────────────────────┐
│  MiniItemHeader (sticky)         │
├──────────────────────────────────┤
│                                  │
│  (위: 대화 히스토리 scroll)      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ FactSummaryCard            │  │
│  │ • 배터리: 하루 버티지만    │  │
│  │   충전 귀찮음              │  │
│  │ • 자동 번역: 쓸지 모름     │  │
│  │ • 배터리 교체: 7~8만원     │  │
│  │ • 새 거 사고 싶은 게 진짜  │  │
│  │   이유라고 인정함          │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌──────────┐  ┌──────────┐      │
│  │  안 삼   │  │   삼     │      │  ← DecideButtonPair (대칭)
│  └──────────┘  └──────────┘      │
│                                  │
└──────────────────────────────────┘
```

- 팩트 요약은 AI의 `summary` 필드에서 가져옴. 판단 없이 사실만.
- summary가 없으면 (closing 없이 바로 [결정하기] 누른 경우) 팩트 요약 카드 없이 바로 [안 삼]/[삼] 표시.

**단계 ④ — 결정 + Undo**

[안 삼]/[삼] 탭 → 결정 상태와 결정 시각 저장 → UndoToast (sonner, 5s) → 홈 이동.

**Components:** ChatScreen, ChatMessageList, MessageBubble, ChatInput, TypingIndicator, MiniItemHeader, DecideButton ("결정하기", sticky), FactSummaryCard, DecideButtonPair, UndoToast

### 2-5. 기록 (`/records`)

```
┌──────────────────────────────────┐
│  ← 홈으로              기록      │
├──────────────────────────────────┤
│                                  │
│  지금까지 내린 결정 12개         │  ← neutral count
│                                  │
│  2026년 4월                      │  ← month group header
│  ┌────────────────────────────┐  │
│  │ 아이템명    ₩가격          │  │
│  │ StatusPill("안 삼")        │  │
│  │ 2026-04-12                 │  │
│  └────────────────────────────┘  │
│                                  │
│  2026년 3월                      │
│  ┌────────────────────────────┐  │
│  │ 아이템명    ₩가격          │  │
│  │ StatusPill("삼")           │  │
│  │ 2026-03-28                 │  │
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

- 기록은 월별 그룹핑.
- 상단 카운트는 포기/구매를 합산한 **중립 카운트**만 표시.
- 기록 삭제 액션 없음. 이 화면의 목적은 "결정의 궤적" 재열람.
- 기록은 현재 로그인 사용자 데이터만 표시.

**Components:** ChatReviewDialog, StatusPill, DecisionCountHeader, RecordMonthSection

### 2-6. About (`/about`)

정적 페이지. max-width 680px.

- **왜?** — 충동구매 비용 설명
- **어떻게?** — "냉각기 후 AI와 대화하며 다시 판단해"
- **원칙** — 설계 원칙 요약
- **주의 1** — 사용자 기록은 로그인 계정 기준으로 저장되고 관리됨
- **주의 2** — MVP에서는 최소 로그인 방식 1개만 지원하며, 계정 설정/탈퇴/데이터 삭제 플로우는 아직 제공하지 않음
- **주의 3** — 쇼핑중독 치료 도구가 아니며, 임상적 문제에는 적합하지 않음

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

### 3-2. Copy Tone

- AI 채팅 메시지만 짧고 직설적인 반말을 사용한다.
- AI 반말은 친근한 수다체가 아니라, 외부 관찰자가 사실과 질문을 짧게 던지는 말투다.
- 시스템 UI, 입력 검증, 오류, 로그인, 저장 안내는 짧고 중립적인 존댓말을 사용한다.
- 버튼 문구는 명령형보다 행동을 설명하는 중립형을 우선한다.
- 사용자가 막힌 상황에서는 농담, 비꼼, 과한 친근함을 쓰지 않는다.

### 3-3. 에러 처리

| 상황 | 처리 |
|------|------|
| 네트워크 에러 | 토스트 "연결이 불안정합니다." + [다시 시도] 버튼 |
| AI 응답 실패 (1~2회) | 토스트 "AI 응답을 받지 못했습니다." + [다시 시도] 버튼 |
| AI 응답 3회 연속 실패 | "AI 없이 결정할 수 있습니다." + [결정하기] 버튼 강제 노출. 팩트 요약은 "요약을 만들 수 없습니다." |
| phase 파싱 실패 | fallback: 3턴 이후 [결정하기] 자동 노출 |
| 404 | 홈으로 이동 |

### 3-4. 반응형 전략

| 화면 | Mobile (<640) | Tablet (640+) | Desktop (1024+) |
|------|---------------|---------------|-----------------|
| `/` | 1열 + FAB 하단 | max-w 720, FAB 헤더 | 2열 그리드, max-w 960 |
| `/new` | 1열 + 주요 버튼 하단 | max-w 560 센터 | 동일 |
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
| `PickupCard` | warm shadow, 결정 대기 버튼 |
| `CoolingCard` | cool 톤, 남은 시간만 표시하는 비공개 카드 |
| `SectionHeader` | warm/cool dot + 개수 |
| `HomeEmptyState` | 빈 상태 일러스트 |
| `GraceCancelToast` | 등록 직후 30초 취소 affordance |

### 등록

| Component | 역할 |
|-----------|------|
| `RegisterForm` | 단일 폼, RHF + Zod |
| `CoolingPreview` | 가격 → 냉각기 라벨 |
| `SealAnimation` | motion, 3-stage, 1400ms |

### Decide (단일 화면: 대화 + 결정)

| Component | 역할 |
|-----------|------|
| `ChatScreen` | container |
| `ChatMessageList` | scroll auto-follow |
| `MessageBubble` | ai/user variant |
| `ChatInput` | textarea auto-grow + send |
| `TypingIndicator` | 3-dot 펄스 |
| `MiniItemHeader` | sticky, 이름+가격 |
| `DecideButton` | "결정하기", sticky (perspective 이후 노출) |
| `FactSummaryCard` | 팩트 요약 bullet (summary 필드 표시) |
| `DecideButtonPair` | 대칭 [안 삼]/[삼] |
| `UndoToast` | sonner, 5s |

### 기록

| Component | 역할 |
|-----------|------|
| `ChatReviewDialog` | Chat transcript 표시 |
| `StatusPill` | 중립 "삼"/"안 삼" |
| `DecisionCountHeader` | 상단 중립 카운트 |
| `RecordMonthSection` | 월별 그룹 헤더 + 카드 묶음 |

### 냉각 중

| Component | 역할 |
|-----------|------|
| `BlankWaitingScreen` | 정보 비공개 대기 화면 |
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

v1.3 (2026-04-16, Decide 플로우 재설계)에서 폐기:

| 폐기 대상 | 대체 |
|-----------|------|
| Phase A → Phase B 별도 화면 전환 | 단일 화면 (대화 + 결정 공존) |
| `ChatEscapeButton` | `DecideButton` ("결정하기", phase 기반 노출) |
| `ChatDoneButton` (chat-done 시 input 대체) | 제거 (입력창 유지, 버튼 공존) |
| `DecideHeader` | `FactSummaryCard` (팩트 요약) |
| `ChatTranscript` (Phase B 전체 대화) | 제거 (같은 화면이라 scroll로 충분) |
| `chat-done` UI 상태 | `chat-perspective` (phase 기반) |

근거: `archive/adr-decide-flow.md` 참조.
