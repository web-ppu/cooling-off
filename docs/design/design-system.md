# 쿨링오프 — Design System

> 전체 화면에서 재사용되는 시각 규칙. 토큰, 타이포, 간격, 컴포넌트 스타일.
> 거의 안 바뀌는 문서. 새 화면 작업할 때 여기서 토큰 참조.
>
> **관련 문서:**
> - 화면별 스펙: [`./screen-spec.md`](./screen-spec.md)
> - 요구사항: [`../pm/prd.md`](../pm/prd.md)

---

## 1. Color Tokens

**철학**: Primary는 차가운 신뢰의 blue-slate, 결정 대기 상태만 warm amber로 대비. Wanting 도파민의 뜨거움을 식히는 tool 감각.

```css
/* Light mode */
--co-bg:             #FAFBFC
--co-bg-alt:         #F2F4F7
--co-surface:        #FFFFFF
--co-border:         #E4E7EC

--co-primary:        #3D5A80   /* deep slate blue */
--co-primary-hover:  #2E4A6E
--co-primary-subtle: #E6ECF3

--co-warm:           #E07856   /* warm amber, ready 전용 */
--co-warm-subtle:    #FCE8DF
--co-warm-hover:     #C9653F

--co-cool:           #7B95B0   /* cooling 중간 톤 */
--co-cool-subtle:    #EEF2F7

--co-text:           #1A2332
--co-text-secondary: #64748B
--co-text-muted:     #94A3B8

--co-success:        #16A34A
--co-danger:         #DC2626

/* Dark mode */
--co-bg:             #0F1419
--co-bg-alt:         #1A2332
--co-surface:        #1E2938
--co-border:         #2E3A4C

--co-primary:        #6B8CAE
--co-primary-hover:  #85A3C2
--co-primary-subtle: #243245

--co-warm:           #E89577   /* saturation 20% ↓ */
--co-warm-subtle:    #3A2823
--co-warm-hover:     #F0A688

--co-cool:           #5A738E
--co-cool-subtle:    #243245

--co-text:           #E4E7EC
--co-text-secondary: #94A3B8
--co-text-muted:     #64748B
```

**적용 원칙:**

- **Primary slate** — 앱 로고, 버튼, 링크, 포커스 링
- **Warm amber** — 오직 ready 상태 (결정 대기 카드, 결정 버튼 강조)
- **Cool** — cooling 카드, 타이머
- **Muted** — 기록, 메타, 비활성
- 색으로만 상태 구분 금지 — 아이콘·라벨 병행 (접근성)

---

## 2. Typography

Inter, 1.25 modular ratio. 한글 fallback: Pretendard 또는 시스템 기본.

| Token | Size | Line | Weight | Use |
|---------|:----:|:----:|:------:|-----|
| `display` | 48px | 1.1 | 700 | 홈 앱명, 큰 카운트 |
| `h1` | 32px | 1.2 | 700 | 화면 제목 |
| `h2` | 24px | 1.3 | 700 | 섹션 헤더 |
| `h3` | 20px | 1.4 | 600 | 카드 제목 |
| `body-lg` | 18px | 1.5 | 400 | 본문 강조 |
| `body` | 16px | 1.55 | 400 | 본문 |
| `body-md` | 16px | 1.5 | 500 | 본문 강조 no-bold |
| `small` | 14px | 1.5 | 400 | 메타, 캡션 |
| `micro` | 12px | 1.4 | 500 | 태그, 진행률 |

**Tracking:** display/h1 `-1px`, h2/h3 `-0.25px`, body `0`, small/micro `0.1px`

---

## 3. Spacing

8px base.

**Tokens:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

**Rhythm:**

- 필드 간격: 20px
- 섹션 간격: 40px
- 카드 padding: 20~24px
- 화면 좌우: 20px (mobile) / 32px (tablet+)

---

## 4. Layout Grid

CSS Grid 기본, flex는 소단위.

| Screen | Max Width |
|--------|:---------:|
| `/` Home | 960px (2열 가능) |
| `/new` | 560px |
| `/items/[id]/cooling-waiting` | 440px |
| `/items/[id]/decide` | 600px |
| `/records` | 720px |
| `/about` | 680px |

---

## 5. Breakpoints

| Name | Condition | 특성 |
|------|-----------|------|
| mobile | < 640px | 1col, 20px padding |
| tablet | ≥ 640px | 32px padding, max-width 적용 |
| desktop | ≥ 1024px | 넓은 그리드 |

---

## 6. Elevation / Shadows

```css
--shadow-card:  0 1px 3px rgba(15,20,25,0.04), 0 1px 2px rgba(15,20,25,0.06)
--shadow-ready: 0 4px 16px rgba(224,120,86,0.12)   /* ready 카드만 */
--shadow-modal: 0 20px 60px rgba(15,20,25,0.12)
```

미니멀 원칙: shadow는 ready 카드 + 모달만 사용한다.

---

## 7. Border Radius

| Element | Radius |
|---------|:------:|
| Cards | 16px |
| Buttons | 12px |
| Inputs | 10px |
| Pills | 999px |
| Modal | 20px |

---

## 8. Dark Mode

- `prefers-color-scheme` 자동 적용
- 수동 토글은 Phase 2
- warm amber saturation 20% ↓
- primary slate lightness 15% ↑
- shadow opacity 60%

---

## 9. Chat 버블 토큰

| 속성 | AI 버블 | User 버블 |
|------|---------|----------|
| 배경 | `co-bg-alt` | `co-primary` |
| 텍스트 | `co-text` | white |
| border-radius | `16px 16px 16px 4px` | `16px 16px 4px 16px` |
| max-width | 80% | 80% |
| 정렬 | 좌측 | 우측 |

**공통:**

- 버블 padding: `12px 16px`
- 버블 간격: 8px (같은 role 연속), 16px (role 전환)
- TypingIndicator: `co-bg-alt` 배경에 3개 dot 펄스
