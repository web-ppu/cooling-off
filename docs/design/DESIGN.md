---
version: alpha
name: cooling-off
description: 충동구매와 결제 사이에 시간과 AI 채팅을 넣어 식은 머리로 다시 판단하게 만드는 반응형 웹 서비스의 디자인 시스템.

colors:
  primary: "#2f6f86"
  primary-active: "#1f5468"
  primary-disabled: "#dde3eb"
  ink: "#161c26"
  body: "#3a4150"
  body-strong: "#232a36"
  muted: "#6b7280"
  muted-soft: "#8a93a0"
  hairline: "#e0e5ec"
  hairline-soft: "#ebeff4"
  canvas: "#f4f6f8"
  surface-soft: "#eef1f5"
  surface-card: "#e8ecf1"
  surface-cool-strong: "#dde3eb"
  surface-dark: "#161c26"
  surface-dark-elevated: "#1f2632"
  surface-dark-soft: "#1a212c"
  on-primary: "#ffffff"
  on-dark: "#eef1f5"
  on-dark-soft: "#8a93a0"
  accent-frost: "#7fb3c5"
  accent-sand: "#b8a784"
  success: "#3f8a6f"
  warning: "#b88a2e"
  error: "#a64a4a"

typography:
  display-xl:
    fontFamily: "Noto Serif KR, Pretendard, serif"
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -1px
  display-lg:
    fontFamily: "Noto Serif KR, Pretendard, serif"
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.6px
  display-md:
    fontFamily: "Noto Serif KR, Pretendard, serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.4px
  display-sm:
    fontFamily: "Noto Serif KR, Pretendard, serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: -0.2px
  timer-xl:
    fontFamily: "JetBrains Mono, Pretendard, ui-monospace, monospace"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -1px
  title-lg:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-md:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0
  title-sm:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0
  body-md:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  body-sm:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  caption:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 1.2px
  numeric:
    fontFamily: "JetBrains Mono, Pretendard, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Pretendard, Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 14px 20px
    height: 48px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted-soft}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 14px 20px
    height: 48px
  button-decision-pass:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 16px 20px
    height: 52px
  button-decision-buy:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 16px 20px
    height: 52px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 56px
  bottom-fab-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: 16px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 64px 24px
  decision-ready-card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  cooling-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  cooling-timer-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.timer-xl}"
    rounded: "{rounded.xl}"
    padding: 40px 24px
  registration-form:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  fact-summary-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  record-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 20px
  about-section-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  chat-bubble-ai:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 14px 16px
  chat-bubble-user:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 14px 16px
  chat-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
    height: 48px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
    height: 48px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  textarea-reason:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  section-header:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
  section-counter-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 10px
  status-dot-ready:
    backgroundColor: "{colors.primary}"
    size: 8px
    rounded: "{rounded.full}"
  status-dot-cooling:
    backgroundColor: "{colors.muted-soft}"
    size: 8px
    rounded: "{rounded.full}"
  badge-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body-strong}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-result-pass:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body-strong}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-result-buy:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body-strong}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  empty-state:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.body-md}"
    padding: 48px 24px
  toast-error:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    typography: "{typography.body-sm}"
    padding: 32px 24px
---

## Overview

쿨링오프는 AI 제품 카테고리에서 가장 **조용한 인터페이스**다. 기본 분위기는 **차가운 오프-화이트 캔버스**(`{colors.canvas}` — #f4f6f8) — 따뜻한 베이지나 순백이 아니라 살짝 푸르스름한 회백색이다. 쇼핑몰이 쓰는 자극적인 화이트/레드 콤보의 반대편에 의도적으로 자리한다. "🧊 식히기"라는 서비스 메타포가 색에 그대로 들어와 있다.

브랜드 전압은 **차가운 캔버스 + 깊은 네이비 + 절제된 청록**의 3색 조합에서 나온다. 청록(`{colors.primary}` — #2f6f86)은 신중함과 거리감을 동시에 갖는다 — 쇼핑 카테고리가 흔히 쓰는 빨강, 주황, 사이언이 아니라, "한 번 더 생각하는 사람"의 색이다. 청록은 등록, 결정하기, 로그인 같은 **결정 외 행동**에만 쓰고, [안 삼]/[삼]에는 절대 쓰지 않는다 — 결정 중립성을 시각적으로 보장한다.

시스템은 세 가지 표면 모드를 갖는다:

1. **차가운 캔버스**(`{colors.canvas}`) — 기본 바닥
2. **차가운 카드**(`{colors.surface-card}`) — 냉각 중 카드, 채팅 AI 말풍선, 기록 카드
3. **깊은 네이비**(`{colors.surface-dark}`) — **결정 대기** 카드와 사용자 채팅 말풍선

깊은 네이비는 시스템에서 가장 강한 시각 신호이며, **"지금 행동이 필요하다"** 라는 의미만 갖는다. 결정 대기 카드가 네이비인 이유는 카드 전환 한 번에 사용자의 주의를 가장 강하게 끌어야 하기 때문이다. 그 외의 자리에는 네이비를 쓰지 않는다.

**Key Characteristics:**

- 차가운 오프-화이트 캔버스(`{colors.canvas}` — #f4f6f8)에 깊은 잉크(`{colors.ink}` — #161c26). 쇼핑몰의 순백/원색 대비를 의도적으로 피한다.
- 절제된 청록 단일 액션 컬러(`{colors.primary}` — #2f6f86). 등록, 결정하기, 로그인에만 쓴다. [안 삼]/[삼]에는 절대 쓰지 않는다.
- Noto Serif KR 디스플레이 + Pretendard 본문. 시리프 헤드라인이 "고려된 판단"의 톤을 만든다. 광고체 산세리프 두꺼운 폰트는 쓰지 않는다.
- 큰 모노스페이스 타이머(`{typography.timer-xl}`) — 냉각 중 화면의 유일한 시각적 주인공. 깜빡임, 펄스, 글로우 없이 그냥 숫자가 줄어든다.
- 결정 대기 카드(`{component.decision-ready-card}`)만 깊은 네이비. 시스템 전체에서 다크 표면이 의미하는 단 하나의 신호: **지금 결정할 시간**.
- 채팅 말풍선은 AI 좌측(쿨 그레이) / 사용자 우측(네이비) — 외부 관찰자(AI)와 자기 자신(사용자)의 시각적 분리.
- 보더 라디우스는 위계형: `{rounded.md}`(10px) 버튼·인풋, `{rounded.lg}`(14px) 카드, `{rounded.xl}`(20px) 타이머 카드, `{rounded.pill}` 배지.
- 섹션 리듬 `{spacing.section}`(64px) — 모바일 우선 흐름. 카드 내부 패딩은 `{spacing.lg}`(24px)로 본문이 숨 쉴 공간을 둔다.
- 도파민 자극(펄스, 반짝임, 글로우, 색대비 강조)을 명시적으로 금지한다.

## Colors

### 브랜드 & 액션

- **Primary / 청록**(`{colors.primary}` — #2f6f86): 시스템의 단일 액션 컬러. [냉각 시작], [결정하기], [로그인], [+ 사고 싶은 물건 등록] 같은 **결정 외 행동**에만 쓴다. 채도가 낮은 푸른빛 청록 — 신뢰감과 거리감을 동시에 준다.
- **Primary Active**(`{colors.primary-active}` — #1f5468): 누름 상태에서만 한 단계 어두워진다. 호버 변형은 따로 정의하지 않는다.
- **Primary Disabled**(`{colors.primary-disabled}` — #dde3eb): 등록 폼이 유효하지 않은 동안의 [냉각 시작] 비활성 상태.
- **Accent Frost**(`{colors.accent-frost}` — #7fb3c5): 결정 대기 섹션 헤더의 작은 상태 점, About 페이지의 강조 라인 정도에만 드물게 쓰는 보조 톤.
- **Accent Sand**(`{colors.accent-sand}` — #b8a784): 기록 화면의 월별 구분선이나 팩트 요약 카드 좌측 가는 선처럼, 정적인 정보 영역에 따뜻한 균형감을 약하게 더할 때만 쓴다.

### Surface

- **Canvas**(`{colors.canvas}` — #f4f6f8): 모든 화면의 기본 바닥. 미세하게 푸르스름한 오프-화이트.
- **Surface Soft**(`{colors.surface-soft}` — #eef1f5): 팩트 요약 카드, About 섹션 카드 배경. 캔버스보다 한 단계만 어둡다.
- **Surface Card**(`{colors.surface-card}` — #e8ecf1): 냉각 중 카드, AI 채팅 말풍선, 섹션 카운터 칩. 카드 표면의 기본값.
- **Surface Cool Strong**(`{colors.surface-cool-strong}` — #dde3eb): 헤어라인 강조나 비활성 토글 같은 가장 진한 쿨 톤이 필요할 때.
- **Surface Dark**(`{colors.surface-dark}` — #161c26): **결정 대기 카드**와 **사용자 채팅 말풍선** 단 두 자리. 시스템에서 가장 무거운 표면이며, 다른 곳에 함부로 쓰지 않는다.
- **Surface Dark Elevated**(`{colors.surface-dark-elevated}` — #1f2632): 네이비 위에 올린 보조 영역 (사용자 말풍선 안쪽 카운터 등).
- **Surface Dark Soft**(`{colors.surface-dark-soft}` — #1a212c): 네이비 카드 내부의 미세한 구분이 필요할 때.
- **Hairline**(`{colors.hairline}` — #e0e5ec): 인풋, 카드 경계의 1px 선. 본 잉크 라인이 아니라 "한 단계 다른 표면"으로 느껴진다.
- **Hairline Soft**(`{colors.hairline-soft}` — #ebeff4): 같은 영역 안 분할용 거의 보이지 않는 선.

### Text

- **Ink**(`{colors.ink}` — #161c26): 모든 헤드라인과 주요 본문. 살짝 푸른빛이 도는 깊은 색.
- **Body Strong**(`{colors.body-strong}` — #232a36): 리드 문장, 강조된 단락.
- **Body**(`{colors.body}` — #3a4150): 기본 본문 색.
- **Muted**(`{colors.muted}` — #6b7280): 보조 라벨, 남은 시간, 결정 가능 시점 같은 메타 정보.
- **Muted Soft**(`{colors.muted-soft}` — #8a93a0): 푸터, 미세한 카운터, 입력 글자 수 표시.
- **On Primary**(`{colors.on-primary}` — #ffffff): 청록 버튼 위 텍스트.
- **On Dark**(`{colors.on-dark}` — #eef1f5): 네이비 표면 위 본문. 캔버스 톤과 맞춰 살짝 푸른빛.
- **On Dark Soft**(`{colors.on-dark-soft}` — #8a93a0): 네이비 카드의 메타 라벨.

### Semantic

- **Success**(`{colors.success}` — #3f8a6f): 로그인 성공 토스트, 등록 완료 안내처럼 시스템 메시지 안에서만 등장. **[안 삼] 색깔이 아니다.**
- **Warning**(`{colors.warning}` — #b88a2e): 네트워크 불안정, AI 응답 실패 안내.
- **Error**(`{colors.error}` — #a64a4a): 입력 검증 실패 문구. 짙은 흙빛 빨강 — 쇼핑몰의 형광 빨강이 아니다.

## Typography

### Font Family

시스템은 **Noto Serif KR** 를 디스플레이 시리프로, **Pretendard**(Inter 폴백)를 본문 산세리프로, **JetBrains Mono** 를 타이머와 숫자에 쓴다. 한국어 가독성이 1순위이므로 두 폰트 모두 한국어 자소가 단단한 패밀리를 골랐다. 폴백 체인은 디스플레이는 `Noto Serif KR, Source Han Serif KR, "Nanum Myeongjo", serif`, 본문은 `Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", Inter, sans-serif`.

디스플레이/본문 분리는 신중함의 톤을 만들기 위한 것이다:

- Noto Serif KR (weight 500, 음수 트래킹) → 화면 제목, 빈 상태 헤드라인, About 헤딩
- Pretendard (weight 400-600) → 본문, 네비, 버튼, 캡션, 라벨
- JetBrains Mono → 냉각 타이머, 가격 숫자, 글자 수 카운터(`123/500`)

쇼핑몰의 굵은 광고체 산세리프(800/900 헤드라인)는 명시적으로 배제한다. 광고체는 흥분을 만들고, 시리프 500은 "한 번 더 생각하는 사람"의 톤을 만든다.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 56px | 500 | 1.2 | -1px | 비로그인 홈의 메인 카피 — Noto Serif KR |
| `{typography.display-lg}` | 40px | 500 | 1.25 | -0.6px | About 페이지 상단 헤딩 — Noto Serif KR |
| `{typography.display-md}` | 32px | 500 | 1.3 | -0.4px | 화면 제목 (등록, 기록 등) — Noto Serif KR |
| `{typography.display-sm}` | 24px | 500 | 1.35 | -0.2px | 빈 상태 헤드라인 ("사고 싶은 물건이 있나요?") |
| `{typography.timer-xl}` | 64px | 400 | 1.0 | -1px | 냉각 중 화면의 타이머 — JetBrains Mono, tabular nums |
| `{typography.title-lg}` | 20px | 600 | 1.4 | 0 | 섹션 제목 "결정 대기 (N)", "냉각 중 (N)" — Pretendard |
| `{typography.title-md}` | 18px | 600 | 1.45 | 0 | 카드 안의 물건 이름 |
| `{typography.title-sm}` | 16px | 600 | 1.45 | 0 | 기록 카드 제목, 팩트 요약 헤더 |
| `{typography.body-md}` | 16px | 400 | 1.65 | 0 | 기본 본문, 채팅 메시지 — Pretendard |
| `{typography.body-sm}` | 14px | 400 | 1.6 | 0 | 메타 정보, 푸터 |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | 배지, 결정 가능 시점 |
| `{typography.caption-uppercase}` | 12px | 500 | 1.4 | 1.2px | 섹션 카운터, "OPTIONAL" 표시 |
| `{typography.numeric}` | 14px | 500 | 1.5 | 0 | 가격, 글자 수 카운터 (tabular nums) |
| `{typography.button}` | 15px | 600 | 1.0 | 0 | 모든 버튼 라벨 |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | 상단 메뉴 항목 |

### Principles

디스플레이는 weight 500을 쓰고 800/900으로 굵히지 않는다. 음수 트래킹(-0.2 ~ -1px)은 시리프가 한국어에서 답답해 보이지 않게 만드는 필수 장치다. 시리프를 산세리프로 바꾸는 순간 쿨링오프는 "또 하나의 핀테크/생산성 앱" 처럼 보인다 — 시리프가 신중함의 캐릭터다.

본문은 400, 라벨/버튼/제목은 500-600. 700 이상은 쓰지 않는다. 굵은 본문은 시각적으로 "강조"이지만, 강조는 사용자에게 어느 한쪽 결정을 유도하는 신호로 읽힐 수 있다 — 결정 중립성을 위해 굵기 사용을 절제한다.

타이머에는 반드시 모노스페이스 + `font-variant-numeric: tabular-nums`를 적용한다. 매 초 숫자가 바뀔 때 폭이 흔들리면 그 자체가 도파민 자극이 된다.

### 한국어 처리

- 줄바꿈은 단어 단위가 아니라 어절 단위로 한다 (`word-break: keep-all`).
- 디스플레이 사이즈에서는 한 줄에 12~14자, 본문은 30~40자가 편안한 호흡이다.
- 숫자(가격, 날짜, 시간, 글자 수)는 모두 tabular nums.

### 폰트 대체

Noto Serif KR이 로드 안 될 때 **Nanum Myeongjo** 가 폴백. Pretendard가 로드 안 될 때 **Apple SD Gothic Neo**(macOS/iOS) → **Malgun Gothic**(Windows) → **Inter** 체인. JetBrains Mono가 로드 안 될 때 시스템 모노스페이스로 폴백하되 반드시 tabular-nums를 유지해야 한다.

## Layout

### Spacing System

- **기본 단위:** 4px.
- **토큰:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- **섹션 패딩:** `{spacing.section}`(64px) — 모바일 단일 컬럼 흐름의 호흡 단위.
- **카드 내부 패딩:** 카드별 `{spacing.lg}`(20-24px). 냉각 타이머 카드는 `{spacing.xl}` 이상으로 더 너그럽게 — 타이머가 시각의 중심이라서 주변이 비어야 한다.
- **화면 좌우 마진:** 모바일 16px, 태블릿 이상 24-32px.

### Grid & Container

- **최대 본문 폭:** 560px 중앙 정렬. 쿨링오프는 데스크탑에서도 단일 컬럼을 유지한다 — 한 번에 하나의 행동만 보이는 것이 원칙이다.
- **모바일 우선:** 화면 정책 mockup이 모두 단일 컬럼 세로 프레임. 데스크탑에서도 양옆에 여백을 두고 같은 폭을 유지한다.
- **홈의 카드 리스트:** 항상 1-up. 카드를 가로 2개 이상 늘어놓지 않는다.
- **기록의 월별 묶음:** 월 헤더 + 그 아래 1-up 카드 리스트.

### Whitespace Philosophy

차가운 캔버스 + 시리프 디스플레이 + 너그러운 카드 내부 여백은 쇼핑몰의 빽빽한 정보 밀도와 반대의 호흡을 만든다. 쿨링오프는 사용자가 빠르게 스크롤하는 화면이 아니라, 잠시 멈추고 하나씩 처리하는 화면이다. 섹션 사이 64px, 카드 내부 20-24px가 그 멈춤을 만든다.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | 그림자 없음, 보더 없음 | 본문 영역, 상단 네비, 비로그인 홈 히어로 |
| Soft hairline | 1px `{colors.hairline}` 보더 | 인풋, 냉각 중 카드, 기록 카드 |
| Cool card | `{colors.surface-card}` 배경 — 그림자 없음 | 냉각 중 카드, AI 채팅 말풍선 |
| Dark surface card | `{colors.surface-dark}` 배경 — 그림자 없음 | 결정 대기 카드, 사용자 채팅 말풍선 |
| Subtle drop shadow | `0 1px 2px rgba(22,28,38,0.06)` | 하단 고정 버튼 바, 토스트 |

깊이는 그림자가 아니라 **색의 대비**로 만든다. 결정 대기 카드와 냉각 중 카드의 명도 차이가 가장 강한 깊이 신호다.

### Decorative Depth

- 도파민 자극(펄스, 반짝임, 글로우, 무지개 그래디언트)을 시스템 전역에서 금지.
- 냉각 타이머는 그냥 1초마다 숫자가 줄어든다. 깜빡임이나 색 변화 없음.
- AI 응답 대기 표시는 작은 회색 점 3개의 부드러운 페이드 — 주의를 끌지 않는 정도까지만.
- 카드 등장은 100-150ms ease-out 페이드 + 4px 슬라이드 정도가 상한.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | 거의 사용 안 함 |
| `{rounded.sm}` | 6px | 인라인 카운터 칩, 토스트 |
| `{rounded.md}` | 10px | 버튼, 인풋, 채팅 입력창 |
| `{rounded.lg}` | 14px | 모든 카드 (결정 대기, 냉각 중, 기록, 팩트 요약, About 섹션) |
| `{rounded.xl}` | 20px | 냉각 타이머 카드 — 가장 부드러운 둥글기, "쉼"의 시각 신호 |
| `{rounded.pill}` | 9999px | 섹션 카운터, 결과 배지, 상태 점 |
| `{rounded.full}` | 9999px | 아이콘 버튼 |

### 일러스트 / 시각 요소

쿨링오프는 **상품 이미지를 일체 쓰지 않는다** (`docs/archive/adr-no-product-image.md`). 시각 요소는 다음으로 한정한다:

- **🧊** 서비스 마크. 차분한 톤의 단일 글리프. 다른 이모지로 대체하지 않는다.
- **상태 점**: 8px 원. 결정 대기 = 청록(`{colors.primary}`), 냉각 중 = 회색(`{colors.muted-soft}`). 형광색 빨강/파랑은 쓰지 않는다.
- **타이머 숫자**: 시각의 주인공. 별도 아이콘 없이 숫자만으로 충분하다.
- **AI/사용자 식별**: 채팅 말풍선의 좌/우 위치 + 색상(쿨 그레이 vs 네이비)으로 구분. 아바타 이미지는 쓰지 않는다.
- **결과 라벨**: 기록 카드의 "안 삼" / "삼"은 같은 배지 스타일(`{component.badge-result-pass}` / `{component.badge-result-buy}`) — 색을 다르게 주지 않는다. 시각적 대칭이 결정 중립성의 핵심이다.

쇼핑몰의 상품 카드, 별점, 가격 강조, 할인 표시 같은 시각 요소는 시스템에 존재하지 않는다.

## Components

### Top Navigation

**`top-nav`** — 56px 높이의 차분한 상단 영역. `{colors.canvas}` 배경, 그림자 없음. 좌측에 🧊 + "쿨링오프" 워드마크, 우측에 [기록] 텍스트 버튼과 [?](About) 아이콘 버튼. 비로그인 상태에서는 [기록]을 숨긴다. 메뉴 항목은 `{typography.nav-link}`(Pretendard 14px / 500). 스크롤에 따라 색이 바뀌거나 그림자가 생기지 않는다.

### Buttons

**`button-primary`** — 시스템의 단일 액션 버튼. 배경 `{colors.primary}`(#2f6f86), 텍스트 `{colors.on-primary}`(흰색), 타입 `{typography.button}`(Pretendard 15px / 600), 패딩 14px × 20px, 높이 48px, 라운드 `{rounded.md}`(10px). 누름 상태는 `button-primary-active`. **[냉각 시작], [결정하기], [로그인하기], [+ 사고 싶은 물건 등록]에만 쓴다.**

**`button-primary-disabled`** — 등록 폼 유효성 미달 시 [냉각 시작]의 회색 상태. `{colors.primary-disabled}`(#dde3eb) 배경 + `{colors.muted-soft}` 텍스트.

**`button-secondary`** — `{colors.canvas}` 배경 + 1px hairline 보더 + `{colors.ink}` 텍스트. [닫기], [다시 시도], [홈으로] 같은 보조 행동.

**`button-decision-pass`** + **`button-decision-buy`** — **시스템에서 가장 중요한 시각 대칭 규칙**. [안 삼]과 [삼] 버튼은 폰트, 사이즈, 라운드, 패딩, 배경, 텍스트 색, 보더가 전부 동일하다. 색 차이, 굵기 차이, 위계 차이 일체 없다. 둘 다 `{colors.canvas}` 배경 + 1px hairline 보더 + `{colors.ink}` 텍스트, 높이 52px(`button-primary`보다 한 단계 큼 — 두 선택지 모두에 무게를 둠), 가로 1:1 분할. **이 두 버튼에 청록이나 다른 액션 컬러를 쓰지 않는다.**

**`button-text-link`** — 인라인 텍스트 버튼. "쿨링오프가 뭔가요?", "← 홈으로", "← 뒤로" 같은 메타 이동.

**`button-icon-circular`** — 36px 원형 아이콘 버튼. 상단 [?] 도움말 버튼, 카드 [삭제] 진입 등. `{colors.canvas}` 배경 + hairline 보더.

**`text-link`** — 본문 안 인라인 링크. `{colors.primary}` (청록). 사용량은 매우 적음 (About 페이지 내부 정도).

### 홈 카드

**`decision-ready-card`** — **결정 대기** 항목 카드. 배경 `{colors.surface-dark}`(#161c26), 텍스트 `{colors.on-dark}`, 라운드 `{rounded.lg}`(14px), 패딩 20px. 안에는 물건 이름(`{typography.title-md}`, on-dark 색), 가격(`{typography.numeric}`, on-dark-soft 색), 그리고 우측에 작은 `{colors.primary}` 상태 점과 "결정할 시간입니다" 문구. 카드 전체가 탭 영역 — 누르면 AI 채팅 화면으로. 시스템 전체에서 이 카드와 사용자 채팅 말풍선만 다크 표면이다.

**`cooling-card`** — **냉각 중** 항목 카드. 배경 `{colors.surface-card}`(#e8ecf1), 텍스트 `{colors.ink}`, 라운드 `{rounded.lg}`, 패딩 20px. 안에는 물건 이름(`{typography.title-md}`), 작은 회색 상태 점, "⏱ 남은 시간"과 "5월 6일 14:00부터 결정 가능"(`{typography.body-sm}`, muted 색). **가격, URL, 사고 싶은 이유는 절대 표시하지 않는다** (PRD FR-3 원칙). 카드 전체가 탭 영역 — 누르면 냉각 중 화면으로.

**`section-header`** — 홈의 "결정 대기 (N)", "냉각 중 (N)" 섹션 제목. `{typography.title-lg}` + 우측에 `{component.section-counter-pill}`. 결정 대기 섹션이 항상 위, 냉각 중 섹션이 아래.

### 등록 폼

**`registration-form`** — 단일 컬럼 폼. 캔버스 위에 4개 필드 세로 배치: 이름, 가격, URL(선택), 사고 싶은 이유(선택). 각 필드 위에 라벨(`{typography.title-sm}`), 아래에 입력 검증 문구 자리(`{typography.body-sm}`, error 색). 폼 하단에 가격→냉각 시간 안내 문구(`{typography.body-sm}`, muted 색)와 [냉각 시작] 버튼. 입력 검증이 통과해야 [냉각 시작]이 활성화된다.

**`text-input`** — 표준 인풋. `{colors.canvas}` 배경, `{colors.ink}` 텍스트, hairline 1px 보더, 라운드 `{rounded.md}`(10px), 패딩 12px × 14px, 높이 48px (모바일 터치 안전). 한 줄 인풋(이름, 가격, URL).

**`text-input-focused`** — 포커스 상태. 보더가 `{colors.primary}`(청록)으로 변경 + 외부 2px 청록-15%-알파 링.

**`textarea-reason`** — 사고 싶은 이유 입력용 멀티라인. 최소 높이 80px, 최대 200자. 우측 하단에 글자 수 카운터(`{typography.numeric}`, muted 색).

### 냉각 중 화면

**`cooling-timer-card`** — 냉각 중 화면의 시각 중심. 캔버스 위에 거대한 라운드 `{rounded.xl}`(20px) 카드, 패딩 40px × 24px. 안에 물건 이름(`{typography.title-md}`)을 상단에 두고 중앙에 `{typography.timer-xl}`(JetBrains Mono 64px) 타이머 표시. 타이머 아래 "5월 6일 14:00부터 결정 가능"(`{typography.body-sm}`, muted 색)과 "지금은 기다리는 시간입니다"(`{typography.body-md}`, body 색). 깜빡임/펄스 없음.

### AI 채팅

**`chat-bubble-ai`** — 좌측 정렬, `{colors.surface-card}` 배경, `{colors.ink}` 텍스트, 라운드 `{rounded.lg}`, 패딩 14px × 16px. 본문 `{typography.body-md}`. 한 메시지의 최대 폭은 캔버스 폭의 80%까지. 메시지 위 작은 라벨 "AI" 또는 글리프(선택).

**`chat-bubble-user`** — 우측 정렬, `{colors.surface-dark}` 배경, `{colors.on-dark}` 텍스트, 라운드 `{rounded.lg}`. AI와 사용자의 위치 + 색 대비가 외부 관찰자(AI)와 자기 자신(사용자)을 시각적으로 분리한다.

**`chat-input`** — 화면 하단 고정 영역의 한 줄 인풋 + [전송] 버튼. 인풋은 `{component.text-input}` 스펙. 좌측에는 글자 수 카운터 `123/500`(`{typography.numeric}`, muted 색). 500자 초과 시 [전송] 비활성. AI 응답 대기 중에는 인풋 자체가 비활성 + AI 말풍선 영역에 회색 점 3개 페이드 인디케이터.

**`fact-summary-card`** — [결정하기] 누름 후 채팅 영역 하단에 등장. `{colors.surface-soft}` 배경, hairline 보더, 라운드 `{rounded.lg}`, 패딩 20px. 상단에 작은 라벨 "팩트 요약"(`{typography.caption-uppercase}`, muted 색). 그 아래 불릿 리스트(`{typography.body-md}`). **판단/조언/결론은 들어가지 않음** — 사실만. 좌측 가는 선은 `{colors.accent-sand}` 정도의 차분한 강조 (선택).

**결정 버튼 페어** — `{component.button-decision-pass}`와 `{component.button-decision-buy}`가 가로 1:1로 배치. 둘 사이 8px 갭. 시스템 전체에서 가장 엄격한 시각 대칭 규칙이 적용된 자리.

### 기록 화면

**`record-card`** — 월별 그룹 안의 결정 카드. 배경 `{colors.canvas}`, hairline 1px 보더, 라운드 `{rounded.lg}`, 패딩 20px. 안에 물건 이름(`{typography.title-sm}`), 가격(`{typography.numeric}`, muted 색), 결과 배지(`{component.badge-result-pass}` 또는 `{component.badge-result-buy}` — **같은 스타일**), 결정 날짜(`{typography.body-sm}`, muted 색). 카드 전체가 탭 영역 — 누르면 대화 다시 보기.

**월 헤더** — `{typography.title-md}` 또는 `{typography.display-sm}` 의 시리프. "2026년 4월" 같은 단순한 라벨. 아래 카드들과 24px 간격.

**결정 개수 표시** — 기록 화면 상단의 "지금까지 내린 결정 12개"(`{typography.title-lg}`). [안 삼]과 [삼]을 합산한 단일 숫자 — 비율을 보여주지 않는 것이 원칙(외재 보상 금지).

### About 화면

**`about-section-card`** — 정적 설명 영역. `{colors.surface-soft}` 배경, 라운드 `{rounded.lg}`, 패딩 24px. 안에 섹션 제목(`{typography.title-md}`)과 본문(`{typography.body-md}`). About 페이지는 이 카드를 3-4개 세로로 쌓는 구성.

### 배지 / 칩

**`badge-pill`** — 일반 카테고리/메타 배지. `{colors.surface-card}` 배경, `{colors.body-strong}` 텍스트, `{typography.caption}`, 라운드 `{rounded.pill}`, 패딩 4px × 12px.

**`badge-result-pass`** + **`badge-result-buy`** — 기록 카드의 "안 삼" / "삼" 결과 배지. **동일한 스타일** (`{colors.surface-soft}` 배경 + `{colors.body-strong}` 텍스트). 어느 쪽도 색깔로 강조하지 않는다.

**`section-counter-pill`** — 섹션 제목 옆 항목 개수. "(2)" 같은 표시. `{colors.surface-card}` 배경, `{typography.caption}`, 라운드 `{rounded.pill}`.

### 상태 표시

**`status-dot-ready`** — 8px 원, `{colors.primary}` 채움. 결정 대기 섹션 헤더와 결정 대기 카드에 사용.

**`status-dot-cooling`** — 8px 원, `{colors.muted-soft}` 채움. 냉각 중 섹션 헤더와 냉각 중 카드에 사용.

### 빈 상태 / 에러

**`empty-state`** — 등록한 항목이 없을 때의 홈 빈 상태. 화면 중앙에 `{typography.display-sm}` 시리프로 "사고 싶은 물건이 있나요?"와 그 아래 `{typography.body-md}` muted 색의 보조 안내. 일러스트는 없다.

**`toast-error`** — 화면 하단의 임시 에러 메시지. `{colors.surface-dark}` 배경, `{colors.on-dark}` 텍스트, 라운드 `{rounded.md}`, 패딩 12px × 16px, 약한 그림자. 약 3초 후 자동 페이드 아웃.

### 푸터 (옵션)

**`footer`** — 본 시스템은 별도 풋터를 거의 쓰지 않는다. About 페이지 하단에 작은 카피라이트 + 데이터 정책 링크 정도만 `{typography.body-sm}` muted 색으로.

## Do's and Don'ts

### Do

- 모든 화면을 차가운 캔버스(`{colors.canvas}`) 위에 둔다. 순백, 따뜻한 베이지, 형광 컬러는 쿨링오프의 톤을 깨뜨린다.
- 디스플레이는 Noto Serif KR 500. 본문은 Pretendard. 시리프-산세리프 분리가 신중함의 톤을 만든다.
- `{colors.primary}`(청록)을 결정 외 행동([냉각 시작], [결정하기], [로그인], [+ 등록])에만 쓴다. 다른 자리에 청록을 칠하지 않는다.
- [안 삼]과 [삼] 버튼은 폰트, 사이즈, 색, 보더, 라운드를 동일하게 유지한다. 시각 대칭이 결정 중립성의 핵심이다.
- `{component.decision-ready-card}`만 네이비. 이 카드의 다크 표면이 "지금 결정할 시간"이라는 단일 신호다.
- 냉각 중 카드에는 항목 이름, 남은 시간, 결정 가능 시점만 표시한다. 가격, URL, 사고 싶은 이유, 이미지는 표시하지 않는다.
- 한국어 줄바꿈은 `word-break: keep-all`을 적용해서 어절 단위로 자른다.
- 숫자(타이머, 가격, 카운터)는 tabular nums + 모노스페이스로 폭을 고정한다.
- 섹션 사이 64px, 카드 내부 20-24px의 여유를 둔다.

### Don't

- 따뜻한 베이지/크림 캔버스를 쓰지 않는다. 쿨톤이 브랜드 메타포다.
- 형광 빨강/파랑/주황으로 결정 대기/냉각 중을 구분하지 않는다. 명도 차이(다크 vs 라이트)와 작은 상태 점으로 충분하다.
- 굵은 광고체 산세리프(weight 800/900) 헤드라인을 쓰지 않는다. 쇼핑몰 톤이 된다.
- [안 삼]에 초록색, [삼]에 빨강/주황 같은 색 신호를 주지 않는다. 어느 쪽도 정답이 아니다.
- 절약 금액, 안 삼 비율, 스트릭, 배지 같은 게이미피케이션 요소를 시각화하지 않는다.
- 펄스, 반짝임, 글로우, 무지개 그래디언트, 컨페티 같은 도파민 자극을 쓰지 않는다.
- 상품 이미지를 어떤 형태로도 넣지 않는다 (`docs/archive/adr-no-product-image.md`).
- 호버 상태를 따로 스타일링하지 않는다. 기본 상태와 누름(`-active`) 상태만 정의한다.
- 데스크탑에서도 컬럼을 늘리지 않는다. 한 번에 하나의 행동이 원칙이다.
- AI 채팅 외 모든 시스템 텍스트(인풋 라벨, 에러, 토스트, 로그인 안내)에 반말을 쓰지 않는다.

## Responsive Behavior

쿨링오프는 모바일 우선의 반응형 웹 서비스다. 화면 정책 mockup은 모두 단일 컬럼 세로 프레임이며, 데스크탑에서도 같은 구조를 유지한다.

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | 좌우 16px 마진, 단일 컬럼, 하단 고정 [+ 등록] 버튼 |
| Tablet | 640–1024px | 좌우 24-32px 마진, 본문 폭 최대 560px 중앙 정렬, 단일 컬럼 유지 |
| Desktop | ≥ 1024px | 본문 폭 560px 중앙 정렬, 양옆은 캔버스 여백, 하단 고정 버튼이 인라인 버튼으로 |
| Wide | > 1440px | 데스크탑과 동일. 본문 폭은 더 늘리지 않는다 |

### Touch Targets

- `{component.button-primary}` 최소 48 × 48px (모바일 안전 폭).
- `{component.button-decision-pass}` + `{component.button-decision-buy}` 각 52px 높이 — 결정 버튼이 가장 큰 터치 영역.
- `{component.button-icon-circular}` 36 × 36 — 자주 누르지 않는 메타 버튼 한정.
- `{component.text-input}` / `{component.chat-input}` 48px 높이.
- 카드 전체가 탭 영역(`{component.cooling-card}`, `{component.decision-ready-card}`, `{component.record-card}`) — 실 탭 영역 >> 44px.

### Collapsing Strategy

- 상단 네비는 워드마크 + [기록] + [?] 만 있으므로 모바일에서도 그대로 표시 — 햄버거 메뉴 불필요.
- 홈의 결정 대기 / 냉각 중 섹션은 모든 폭에서 1-up 세로 카드 — 화면 폭이 늘어나도 카드가 옆으로 늘어나지 않는다.
- 등록 폼은 모든 폭에서 세로 단일 컬럼. 라벨/인풋이 가로로 붙는 데스크탑 폼 스타일을 쓰지 않는다.
- 결정 버튼 페어는 모든 폭에서 가로 1:1 분할 — 세로로 쌓이지 않는다 (가로 대칭이 시각적으로 더 중요).
- AI 채팅은 모든 폭에서 좌(AI)/우(사용자) 말풍선 구조 유지. 사용자 메시지의 최대 폭만 화면에 따라 조정.

### Image Behavior

- 시스템에 상품 이미지가 없으므로 이미지 반응형 규칙도 거의 필요 없음.
- 🧊 워드마크 글리프는 모든 폭에서 동일 크기.
- 일러스트가 들어갈 경우(추후 About 페이지 등) 단순한 단색 라인 아트로 한정, 가로 폭에 따라 비례 축소.

## Iteration Guide

1. 한 번에 한 컴포넌트만 다룬다. YAML 키로 참조한다 (`{component.decision-ready-card}`, `{component.cooling-timer-card}`).
2. 기존 컴포넌트의 변형(`-active`, `-disabled`, `-focused`)은 `components:`에 별도 엔트리로 둔다.
3. `{token.refs}`를 어디서나 쓴다 — 헥스 값을 인라인으로 박지 않는다.
4. 호버 상태는 정의하지 않는다. 기본 상태와 누름(active) 상태만.
5. 디스플레이는 Noto Serif KR 500 + 음수 트래킹. 본문은 Pretendard. 이 분리는 깰 수 없다.
6. 차가운 캔버스 + 청록 + 깊은 네이비가 3원색. 네 번째 표면 톤을 도입하지 않는다 (따뜻한 베이지 카드 없음, 보라/초록 카드 없음).
7. [안 삼]과 [삼]은 항상 시각적으로 동일하다. 결정 중립성이 변형의 첫 번째 검토 기준이다.
8. 강조가 필요할 때 색을 더하기 전에 시리프 크기를 먼저 키운다.

## Known Gaps

- Pretendard와 Noto Serif KR은 오픈소스 웹폰트로 제공되지만, 한국어 글리프 풀세트는 파일 크기가 크다. 실제 구현 시 서브셋(서비스에서 실제로 쓰는 자소)으로 잘라 로드 성능을 확보해야 한다.
- 다크모드는 현재 시스템 범위 밖이다. `{colors.surface-dark}`는 결정 대기 카드와 사용자 채팅 말풍선의 의미 신호이므로, 전체 다크 모드를 도입하면 그 신호가 사라진다. 향후 도입 시 결정 대기/사용자 말풍선의 대체 신호를 같이 설계해야 한다.
- 알림(Web Push) UI 자체는 OS 영역이라 이 디자인 시스템 토큰으로 통제할 수 없다. 알림 문구 톤만 PRD/screen-spec 기준을 따른다.
- AI 응답 대기 인디케이터, 채팅 메시지 등장 모션, 타이머 업데이트 같은 미세 모션의 정확한 타이밍 값은 이 문서 범위 밖이다. 단, "도파민 자극 금지" 원칙은 유지한다.
- [안 삼] / [삼] 누름 직후의 결정 확정 피드백(토스트, 화면 전환)이 사용자에게 "축하 효과"로 읽히지 않도록 차분한 페이드 + 홈 이동 정도로 제한해야 하며, 구체 모션은 구현 단계에서 확정.
- 일러스트 가이드(About 페이지의 단순 라인 아트가 필요할 경우)는 이 문서에 정형화하지 않았다. 추후 필요 시 별도 섹션으로 추가.
