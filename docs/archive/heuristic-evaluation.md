---
date: 2026-04-12
type: evaluation
status: 📚 HISTORICAL — 프로토타입 평가 완료 (전면 재구축으로 이슈 모두 해결)
related:
  - frame-problem.md
  - jobs-to-be-done.md
  - mvp-scope.md
  - implementation-status.md
---

# Heuristic Evaluation — 현 프로토타입 5개 화면

> 아카이브 문서입니다. 현재 제품 스펙은 `docs/pm/prd.md`와 `docs/design/screen-spec.md`를 우선합니다.

> ## 📚 Historical Document
>
> 이 평가는 **Release 0.3 전면 재구축 결정의 근거**로 작성됐습니다. 평가 당시 프로토타입의 Catastrophe 5건 + Major 10건은 **Release 0.3 재구축(2026-04-12)으로 모두 해결**됐습니다.
>
> 현재 구현 상태는 [`implementation-status.md`](./implementation-status.md) 참조.
>
> **이 문서가 필요한 경우**:
> - "왜 프로토타입을 전면 재구축했는가?" 질문에 대한 근거
> - 교수·팀 리뷰에서 "Nielsen Heuristics 기반 평가 수행했다"는 증빙
> - 재구축 전후 비교 (Before/After)
>
> 그 외에는 **읽지 않아도 됨**. 현재 설계 기준은 frame-problem.md + interaction-design.md + screen-design.md.

## 평가 범위

- **평가 대상**: `prototype/` 디렉토리 5개 화면
- **평가 기준**: Nielsen's 10 Usability Heuristics + `frame-problem.md` 10개 커스텀 원칙 + `mvp-scope.md` 17 opportunities 부합도
- **Severity Scale**: 0 (문제 없음) / 1 (화장품) / 2 (마이너) / 3 (메이저) / **4 (Catastrophe)**

## 총평 (Executive Summary)

**진단**: 현재 프로토타입은 **구 기획-배경 7문항 버전의 충실한 구현체**이며, 재작성한 설계 원칙(frame-problem / JTBD / mvp-scope)과 근본적으로 호환되지 않는다. 기술 스택·인프라는 견고하지만, 화면 컨텐츠와 상호작용 구조가 원칙을 다수 위반한다.

**Catastrophe 5건 요약**:
1. `/records`의 "이번 달 절약 금액" 상단 대형 표시 — 원칙 7-3 (크라우딩 아웃) 직접 위반
2. `/records`의 "포기율 %" metric — 원칙 7-6 (판단 강요 금지) 위반 + 역방향 인센티브
3. 체크리스트 7문항 유지 — MVP 스코프(5문항) + Gawande 설계 원칙 위반
4. 체크리스트 모든 문항이 Textarea 자유 입력 — Mechanical/Cognitive 마찰 구분 실패
5. 이모지 감정 선택 (Affect Labeling) 완전 부재 — O4b 누락

**결정**: 전면 재구축.

---

## 화면 1: 홈 `/` (`app/page.tsx`)

### 이슈 리스트

| # | Heuristic / 원칙 | 이슈 | Severity | 권고 |
|---|-----------------|------|:--------:|------|
| H-1 | 원칙 7-9 (돌아옴) + Nielsen #6 | "결정 대기" 섹션이 "냉각 중" 아래 배치. 재방문 시 첫 시야에 픽업 카드가 없음. O2a 구현 실패 | **3** | `ready.length > 0`이면 결정 대기가 최상단 고정 |
| H-2 | 원칙 7-10 (냉각기 blank) | 냉각 중 카드 탭 시 어디로 가는지 코드상 불명. Blank 원칙 위반 가능성 | 3 | 냉각 중 카드 탭 비활성 or blank waiting 화면으로 |
| H-3 | 원칙 7-4 + Nielsen #10 | 헤더 "사기 전에 한 번 식히기" — 앱 정체성(wanting/liking, commitment device) 노출 없음 | 2 | About 링크 헤더 배치 or 정체성 서브카피 |
| H-4 | Nielsen #1 | `EmptyState` 컴포넌트 존재하지만 진입 유도 카피 검증 필요 | 2 | 첫 등록 유도 친구 톤 카피 필요 |
| H-5 | 원칙 7-3 | 홈에 금전 metric 없음 — Good | 0 | 유지 |
| H-6 | Nielsen #1 | PWA 홈 아이콘 배지(O2b) 미구현 | 3 | `manifest.json` + Badging API |
| H-7 | Nielsen #2 | "🧊 얼음 / ✅ 체크" 이모지 — wanting 식히기 메타포와 부합 | 1 | 유지 |

**화면 평가**: H-1과 H-2가 구조적 문제. H-1이 수정되지 않으면 SP2 돌아옴 메커니즘이 완결되지 않음.

---

## 화면 2: 등록 `/new` (`app/new/page.tsx`)

### 이슈 리스트

| # | Heuristic / 원칙 | 이슈 | Severity | 권고 |
|---|-----------------|------|:--------:|------|
| N-1 | 원칙 7-8 + SP3 Circuit Breaker | 4필드(상품명·가격·URL·메모)만 존재. Circuit Breaker 4단계 중 뒤 2단계(왜·대체재) 누락. 등록이 "기록"에 그침 | **3** | 4단계 wizard로 재구성: ①이름 ②가격 ③사고 싶은 이유(감정/실용 탭) ④비슷한 거 있나(3지선다) |
| N-2 | 원칙 7-4 | `memo` 자유 서술 필드 ("왜 사고 싶은지 적어둬도 좋아") — 합리화 저격 실패. 자유 텍스트 입력 마찰 | **3** | `memo` 제거. "실용" 선택 시 "언제 쓸지" follow-up 자유 입력으로 대체 (O3b) |
| N-3 | Nielsen #1 + 원칙 7-8 | 가격 입력 시 냉각기 자동 계산 표시 — 매우 좋음 | 0 | 유지. 단 5-tier 라벨로 조정 |
| N-4 | 원칙 7-7 | 에러 메시지 "상품명을 입력해주세요" 등 존댓말 | 2 | 친구체 "상품명 적어줘" |
| N-5 | 원칙 7-9 | 등록 완료 후 `toast("등록됐어요")` + router.push — 약속 성립 감각 0 | **3** | 전환 화면 + 봉인 애니메이션 (O3d) + "냉각기 시작 · {time}에 다시 열어봐" |
| N-6 | Nielsen #5 | `defaultValues.price = 0` — 필드에 0이 박혀있어 지우고 입력해야 함 | 2 | `undefined` + placeholder |
| N-7 | Nielsen #3 | 입력 중 이탈 경고 없음 | 1 | Phase 2 |
| N-8 | 원칙 7-7 | 헤더 "사고 싶은 걸 넣어보자" — 친구 톤 양호 | 0 | 유지 |
| N-9 | 원칙 7-1 | 버튼 "냉각 시작하기" — 동사형·친구체 | 1 | 유지 또는 "맡겨두기" 변형 |

**화면 평가**: N-1, N-2, N-5 세 개가 critical. 등록 화면은 통째로 재설계 대상.

---

## 화면 3: 체크리스트 `/items/[id]/checklist/[step]` ⚠ 최대 갭

### 이슈 리스트

| # | Heuristic / 원칙 | 이슈 | Severity | 권고 |
|---|-----------------|------|:--------:|------|
| **C-1** | MVP 스코프 O4a + 원칙 7-4, 7-6 | **7문항 유지**. MVP는 5문항. 기존 "~입니까?" 심문체 + 학술 편향 매핑 | **4** | `lib/questions.ts` 전면 재작성: 5문항, Gawande 동사형, 친구체 (감정→일상상상→기회비용→liking→결정) |
| **C-2** | 원칙 7-8 + Nielsen #7 | 모든 문항이 Textarea 자유 입력. 중반 이탈 유도 | **4** | 입력 타입 차등화: ①이모지 5택1 ②자유입력 ③자유입력 ④Yes/No+한줄 ⑤탭 |
| C-3 | Nielsen #2 | Progress bar 옆 `{question.bias}` — 학술 용어 노출 ("감정적 구매", "기회비용 무시") | **3** | 편향 라벨 제거, `{stepNum}/{total}`만 |
| C-4 | 원칙 7-7 | 서브카피 "아직도 원해?" — 앱의 핵심 질문(O4d)을 선행 노출. 중복 | 2 | "{waited} 기다렸어. 잠깐 점검해볼까?" |
| C-5 | 원칙 7-10 | 7단계 URL 분리 — 아이템 `status`가 `ready`인지 검증 없음. 냉각기 중 직접 접근 가능. Blank 원칙 구멍 | **3** | `status !== "ready"`면 홈으로 redirect |
| C-6 | Nielsen #1 | `saveDraft()` 저장 피드백 없음 | 1 | "저장됨" 인디케이터 or 생략 |
| C-7 | Nielsen #3 + #9 | 중간 이탈 엣지 없음 (뒤로가기만) | 2 | "나중에" 링크 |
| C-8 | Nielsen #8 | `co-card p-6` Textarea — 시각 노이즈 적음 | 0 | 유지 |
| **C-9** | MVP 스코프 O4b | 이모지 Affect Labeling 컴포넌트 완전 부재 | **4** | EmojiAffectPicker 신설 |

**화면 평가**: **가장 큰 재작성 대상**. 7→5 문항 압축, 입력 타입 차등화, 학술 라벨 제거, blank 원칙 준수 전부 필요.

---

## 화면 4: 결정 `/items/[id]/decide` (`app/items/[id]/decide/page.tsx`)

### 이슈 리스트

| # | Heuristic / 원칙 | 이슈 | Severity | 권고 |
|---|-----------------|------|:--------:|------|
| D-1 | Nielsen #6 | `Accordion`이 기본 접힘 — 결정 직전 재회 맥락이 가려짐 | 2 | 기본 펼침 |
| D-2 | 원칙 7-4 | 답변 표시 시 `{question.text}` 그대로 노출 — 7문항 심문체 연쇄 | 2 | C-1 수정과 연동 해결 |
| D-3 | 원칙 7-6 + MVP 스코프 | `DecideButtons` 대칭성 검증 필요 (미확인) | 2 | 별도 검토 |
| D-4 | Nielsen #3 | "체크리스트로 돌아가기 → step/7" — `7` 하드코딩. 5문항 전환 시 깨짐 | 2 | 동적 `step/{total}` |
| D-5 | 원칙 7-7 | "이제 결정해볼까?" — 친구 톤 양호 | 0 | 유지 |
| D-6 | Nielsen #1 | 헤더 `{name}` + `{price}` + `waited` — 양호 | 0 | 유지 |
| D-7 | 원칙 7-9 | 재회 프레이밍 약함. "어제/어제 이 시각 기다렸던 물건" 감각 없음 | 2 | 상단 재회 카피 추가 |
| D-8 | Nielsen #5 | 결정 버튼 즉시 실행 vs confirm 미확인 | — | DecideButtons 컴포넌트 검토 필요 |

**화면 평가**: 구조는 OK지만 Accordion 기본 펼침 + 하드코딩 제거 + 재회 프레이밍 추가 필요.

---

## 화면 5: 기록 `/records` ⚠ Catastrophe 2건 집중

### 이슈 리스트

| # | Heuristic / 원칙 | 이슈 | Severity | 권고 |
|---|-----------------|------|:--------:|------|
| **R-1** | 원칙 7-3 (크라우딩 아웃) + Nielsen #2 | 헤더 "이번 달 절약 금액" + 거대 `co-display` 숫자. 앱 정체성을 "절약 앱"으로 변질시킴. Gneezy & Rustichini 어린이집 실험 재현 위험 | **4** | 전면 삭제. 대신 "지금까지 내린 결정들" 헤더 + 결정 N개 중립 카운트 |
| **R-2** | 원칙 7-6 + MVP 스코프 | "포기율 %" metric — 포기 강요 프레임. Informed decision 목적과 정면 충돌 | **4** | 전면 삭제 |
| R-3 | 원칙 7-3 | "완료 건수" — 중립. 유지 가능 | 1 | "결정 N개"로 레이블 변경 |
| R-4 | Nielsen #6 + O6c | `AnswersDialog` 답변 열람 — Good | 0 | 유지 |
| R-5 | 원칙 7-3 | `statusLabel: passed: "포기"` — "포기"는 부정 프레임 | 2 | "안 삼" / "삼" 중립화 |
| R-6 | Nielsen #7 + MVP | 월별/주별 필터 없음 — O6d 의도적 제외 | 0 | 유지 |
| R-7 | 원칙 7-7 | 빈 상태 "아직 결정한 아이템이 없어요." — 존댓말 | 1 | "아직 결정한 거 없어" |
| R-8 | MVP 스코프 O6a | 타임라인(시간축 그룹핑) 미구현 | 2 | 월 그룹 헤더 정도 추가 |

**화면 평가**: **R-1과 R-2가 전체 앱에서 가장 심각한 원칙 위반**. 70~88번 라인 블록 통째로 삭제.

---

## 교차 이슈 (화면 넘어서)

### X-1. 돌아옴 메커니즘 전면 부재 (Severity 4)
- O2a 재방문 픽업 카드: `ready` 섹션은 있지만 최상단 고정 아님
- O2b PWA 홈 배지: `manifest.json` / Badging API 미구현
- O2c Web Push: Service Worker 미설치

**루프 완결 불가능**. 사용자가 24시간 후 돌아올 방법이 북마크 수동 방문뿐.

### X-2. About / 정체성 노출 부재 (Severity 2)
- O7a 미구현
- "wanting vs liking" 설명 부재
- 발표 시 "이 앱 뭐하는 앱이에요?" 답변 근거 없음

### X-3. 친구 톤 3-layer 혼재 (Severity 3)
- 친구체: "사고 싶은 걸 넣어보자", "이제 결정해볼까?"
- 존댓말: "상품명을 입력해주세요", "아직 결정한 아이템이 없어요."
- 학술: "감정적 구매", "확증 편향"

→ 카피 전수 감사 + 친구 톤 통일 필요.

### X-4. Circuit Breaker 개념 부재 (Severity 4)
등록이 "기록"일 뿐 "개입"이 아님. N-1에서 상세.

### X-5. 5-tier 냉각기 로직 (Severity 2)
`lib/cooling.ts` 현재 tier 수 확인 필요. 5-tier로 조정.

---

## Severity Summary

| Severity | Count |
|:--------:|:-----:|
| **4 (Catastrophe)** | **5** |
| **3 (Major)** | **10** |
| **2 (Minor)** | **13** |
| **1 (Cosmetic)** | **5** |
| **Total** | **33** |

---

## 최종 결론

**Catastrophe 5건 + Major 10건**이라는 지표만 봐도 프로토타입의 **incremental fix**는 합리적이지 않다. 재작성한 3개 설계 문서(frame-problem / JTBD / mvp-scope)를 기준으로 **전면 재구축**이 오히려 빠르고 일관성 있는 경로다.

재사용·폐기 결정 문서는 오래된 구현 계획과 함께 정리됐다.

**다음 단계**:
1. `interaction-design:design-interaction` — 6개 Moment별 인터랙션 플로우 설계
2. `ui-design:design-screen` — 6개 화면별 레이아웃 설계
3. `frontend-design:frontend-design` — 전면 재구현

**발표 자료 방어용 요약문**:
> "초기 프로토타입을 개발 중 재리서치 과정에서 vault 리서치 원문 9편을 재검토한 결과, 기존 기획의 7문항 체크리스트·절약 금액 누적·예산 추적 프레임이 Gawande 체크리스트 원칙·Gneezy 크라우딩 아웃 연구·Lieberman Affect Labeling 연구 등과 충돌한다는 점을 발견했습니다. Nielsen's 10 Heuristics + 과학 근거 기반 10개 커스텀 원칙으로 재평가한 결과 Catastrophe 5건, Major 10건이 확인되어 전면 재구축을 결정했습니다. 기술 스택과 인프라 레이어는 유지하고 화면·컨텐츠·컴포넌트만 재설계했습니다."
