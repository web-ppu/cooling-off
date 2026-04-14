---
date: 2026-04-12
type: adr
status: accepted
related:
  - frame-problem.md
  - jobs-to-be-done.md
  - mvp-scope.md
  - prd.md
  - interaction-design.md
  - screen-design.md
  - ai-prompt-v1.md
  - implementation-status.md
supersedes:
  - Decision Checklist 4문항 구조 (구 Moment 5)
  - Circuit Breaker 4-step wizard (구 Moment 2)
  - Mood emoji Affect Labeling step
  - Inline AIProbeBubble (구 Release 0.10 scaffold)
---

# ADR — LLM Chat Pivot + Register 단순화

## 1. 맥락

Release 0.10에서 AI Fact-Check Layer를 scaffold했다: Decision Checklist Step 2 아래 inline `AIProbeBubble`, rule-based mock probes. UX 검증 중 세 가지 근본 문제가 드러났다.

1. **AI 개입 지점이 어색함** — Step 2(일상 상상)는 **상상 턴**이고 AI는 팩트 반박자. 상상을 팩트로 끊는 건 mismatch.
2. **기회비용 질문(Step 3)이 합리화형에 약함** — "이 돈이면 뭐할 수 있지?" → "투자야"로 우회 쉬움.
3. **Inline bubble = 1탭 바이패스** — "답변 수정 / 그래도 통과" 2버튼 구조는 정적 체크리스트의 합리화형 취약성을 동일하게 답습.

추가로 `implementation-status.md` 5-2에 **parked** 상태였던 사용자 의문(2회 반복 제기):

4. **CB wizard 4단계가 무거움** — "등록할 때 그냥 바로 등록하면 안됨?"

## 2. 결정

### 2-1. LLM Chat이 Decide 단계의 **핵심 메커니즘**이 된다

Inline probe sprinkle(보조) → **Full chat screen**(핵심)으로 격상.

**근거**:
- 정적 체크리스트는 합리화형에 뚫림 (자가 검토 구조라 motivated reasoning 방어 불가)
- Solomon의 역설(Grossmann & Kross 2014)은 **외부 관찰자와 대화**할 때만 작동. Chat만이 실제로 대화.
- **User history = 앱 고유 탄약** — ChatGPT가 못 따라오는 차별점 (cold start 이후)
- 앱 정체성(wanting/liking을 외부 관찰자가 뚫어준다)과 **기능 구조가 일치**해야 좋은 기능.

### 2-2. Decision Checklist 4문항 전면 삭제

| Step | 질문 | 삭제 이유 |
|:---:|---|---|
| 1 | 이모지 기분 (Affect Labeling) | **Cargo cult**. 이모지 1탭 ≠ verbal/written 명시적 라벨링. 원 연구(Lieberman 2007)의 메커니즘과 불일치. 효과 크기 ~0 |
| 2 | 일상 상상 | Chat opener "왜 이거 지금 사고 싶어?"가 동일 효과. **중복** |
| 3 | 기회비용 | 합리화형에 약함. "투자야"로 우회 |
| 4 | Yes/No liking | Chat이 자연스럽게 포괄. 체크박스 → 5턴짜리 질문으로 격상 |

### 2-3. Decide 플로우 = 2 phase (Mood phase 없음)

```
[/items/[id]/decide] 단일 라우트
  ├─ Phase A: chat         (1~3분, 4~6턴, hard cap 10)
  └─ Phase B: decide       ([안 삼] / [삼] 대칭)
  ↓
[홈] + undo toast 5s
```

### 2-4. 등록 화면 단순화 — wizard 폐기, 단일 폼

**삭제**:
- 4-step wizard 구조 (progress bar, step transitions)
- `reason: "emotion" | "practical"` 탭
- `reason_detail` follow-up (실용 선택 시 자유 입력)
- `alternative: "have" | "none" | "unsure"` 탭

**신규** (단일 폼 4 필드):
1. 이름 (text, 필수)
2. 가격 (number, 실시간 냉각기 라벨, 필수)
3. URL (선택)
4. **"왜 사고 싶어?"** — free text textarea, 1~3줄 (선택이지만 강하게 권장)

서브카피: *"14일 뒤 돌아왔을 때 네가 읽게 될 말이야"* (원칙 7-9 재회 프레이밍 정합)

**필드 schema 변경**:
```typescript
// Before
reason?: "emotion" | "practical";
reason_detail?: string;
alternative?: "have" | "none" | "unsure";

// After
reason?: string;  // free text 단일 필드
```

### 2-5. "Circuit Breaker" 용어 폐기

기존엔 "CB 4단계 = 도파민 감쇠 개입 장치"였으나, 이제 그 역할은 **Seal + 냉각 타이머 + AI Chat**이 담당. CB는 실체 없는 라벨.

**문서·코드 전체에서 "Circuit Breaker" / "CB wizard" 용어 제거.** 대체어: **"등록(Register)"**.

### 2-6. AI 대화 구조

- **Opener (고정)**: "네 말 들어볼게. 왜 이거 지금 사고 싶어?"
- **Soft target**: 4~6턴
- **Hard cap**: 10턴 (safety net, 평상시 미도달)
- **3 exit paths**:
  1. AI `[END]` 토큰 — 자각 신호 포착 시 조기 종료
  2. 사용자 "결정하러 갈게 →" ghost button — 항상 노출 (원칙 7-6)
  3. Hard cap 도달 → 강제 종료
- **고정 꼬리**: 마지막 AI 메시지는 *"결정은 네가 해. 결정하러 가자."* 템플릿

### 2-7. Cold Start 처리 (신규 사용자)

History 0인 첫 등록 사용자는 AI 고유 탄약(past_pattern, contradiction) 사용 불가. 처리:

- **반박 각도 제한**: `specificity`, `reality_check`만 허용. `past_pattern`, `contradiction` 금지 (hallucination 엄금).
- **Hard cap 5턴** (history 있는 10보다 짧게 — 팔 만큼 없음)
- **마지막 메시지 프레이밍**: *"첫 등록이라 기록 못 꺼냈어. 다음부턴 네 패턴으로 더 파고들 수 있어"* — 약점이 아닌 "앞으로 강해짐" 기대로 전환
- **등록 봉인 화면 한 줄**: *"첫 등록이라 결정 시점 대화가 얕을 수 있어. 3~4개 쌓이면 패턴 기반으로 강해져"*

**임계치 초안** (iterate 대상):

| 등록 개수 | AI 모드 | Turn cap |
|:---:|:---:|:---:|
| 0개 | specificity-only | 5 |
| 1~2개 | specificity + 약한 past_pattern | 8 |
| 3+개 | full power (모든 각도) | 10 |

### 2-8. 신규 원칙 2개

**원칙 7-11** — *"AI는 판사가 아니라 팩트 반박자"*
- AI는 history 기반 사실 증거를 제시할 뿐, 판결·지시·도덕 평가 금지
- 최종 결정은 여전히 사용자 (원칙 7-6과 정합)
- **How to apply**: 시스템 프롬프트 금지사항에 명시, 마지막 메시지 고정 꼬리로 enforcement

**원칙 7-12** — *"과학 근거는 메커니즘까지 맞춰야 유효하다. 라벨만 빌리면 미신"*
- mood emoji 사례에서 도출 (Affect Labeling의 verbal labeling 메커니즘과 이모지 탭 불일치)
- **Why**: 과학 이름만 빌리면 cargo cult가 되어 마찰만 남고 효과 0
- **How to apply**: 신 기능 도입 시 "원 연구의 메커니즘이 내 구현과 일치하는가?" 자문 필수

## 3. 영향 범위

### 3-1. 문서 (이번 세션 반영)

| 파일 | 변경 |
|------|------|
| `frame-problem.md` | 원칙 7-11, 7-12 추가. SP3(Circuit Breaker) 라벨 변경. |
| `jobs-to-be-done.md` | Moment 2 재작성(단일 폼), Moment 5 재작성(Chat 2 phase) |
| `mvp-scope.md` | Theme A 재작성(O3a·O3b 삭제, O4a~e 재구성), Theme F cold start 반영 |
| `prd.md` | FR-1(등록 단순화), FR-3(Chat flow), FR-10(AI Layer 핵심화) |
| `interaction-design.md` | Chat Phase MI 신규, 구 체크리스트 MI 삭제/deprecated |
| `screen-design.md` | Screen 2 단일 폼, Screen 3(체크리스트) 폐기, Screen 5(decide) chat 통합 |
| `ai-prompt-v1.md` | v0.2 섹션: multi-turn + cold start + hard/soft cap |
| `implementation-status.md` | Pivot drift 섹션 추가, 대규모 폐기 항목 |

### 3-2. 프로토타입 코드 (**다음 세션 범위**)

이번 세션 범위 아님. 작업 목록만 기록:

- [ ] `/items/[id]/checklist/*` 라우트·컴포넌트 전체 삭제
- [ ] `/new` 단일 폼 재작성 (wizard layout, ReasonToggle, AlternativeToggle, WizardStep* 컴포넌트 삭제)
- [ ] `/items/[id]/decide` chat phase 구현 (ChatScreen, ChatMessageList, MessageBubble, ChatInput, ChatEscapeButton, ChatDoneCTA)
- [ ] `lib/types.ts` — `ChecklistAnswer` → `ChatMessage` / `ChatSession` 재설계
- [ ] `lib/ai/` 재구조 — `mock-probes.ts` deprecate, `mock-chat.ts` 신규 (multi-turn mock)
- [ ] `components/checklist/*` 삭제
- [ ] `seed-demo-data` 재작성 (reason 단일 필드, chat 기록 포함)

## 4. 의도적 미결정

- **턴 cap 최종값 (6/8/10)** — 프롬프트 iteration 시 실측 데이터로 재결정
- **Chat 요약 vs 전체 scroll** (Phase B decide 화면): 초안 **전체 scroll** (요약 = 토큰 낭비 + 결론 유도 리스크)
- **AI Layer MVP 필수 여부** — 여전히 미결정. 프롬프트 iteration 품질 검증 후 확정
- **Turn counter UI 노출 여부** — 숨김 권장(몰입 유지)이나 debug용은 필요

## 5. 기각된 대안

| 대안 | 기각 이유 |
|------|---------|
| **Inline bubble 유지 + 개선** | 1탭 바이패스 구조는 근본적 결함. 재구조 필요 |
| **CB wizard에 chat 삽입** | 등록 마찰 폭증. 원칙 7-8 (등록 제일 쉬워야) 위배 |
| **AI chat을 선택지(opt-in)로** | 합리화형은 안 누름 → 효과 0 |
| **Mood emoji 유지** | 원칙 7-12 위반 (cargo cult), 마찰만 있고 효과 없음 |
| **Turn cap 6 hard** | 예시 대화에서 정확히 6 사용 = 여유 0. 10으로 상향 |
| **Register에 reason(감정/실용) 탭 유지** | AI가 free text에서 동일 정보 + 더 풍부 추출 가능. 탭은 정보 평탄화 |

## 6. 연결

- 이 ADR은 `mvp-scope.md` v1.1의 O3a, O3b, O4a~e 기회를 무효화하고 재정의함
- `ai-prompt-v1.md` v0.1은 이 pivot 이후 v0.2로 승계 (multi-turn 재작성)
- 원칙 7-11, 7-12는 `frame-problem.md`에 통합되어 SSOT 역할
- Prototype 코드 변경은 별도 세션 — Batch 3로 분리 실행

---

## Changelog

### v1.0 (2026-04-12)
- 최초 작성. Release 0.10 AI Layer scaffold 직후 pivot 결정 기록.
