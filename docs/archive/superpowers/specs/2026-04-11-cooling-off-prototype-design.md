---
date: 2026-04-11
type: design-spec
status: draft
version: 0.1
topic: 쿨링오프 화면 프로토타입
related:
  - ../../prd.md
  - ../../기획-배경.md
  - ../../user-story-map.md
  - ../../tech-design.md
  - ../../../DESIGN.md
---

# 쿨링오프 — 화면 프로토타입 설계

## 1. 목적

**이건 본 개발이 아니다.** 본 개발은 5월 W5~W7에 진행된다. 이 프로토타입의 목적은 기획 문서(PRD, 기획-배경, User Story Map)를 텍스트로만 읽다가 갇히는 느낌을 깨고, **화면을 손에 잡히는 상태로 만들어 스펙을 역방향 보정**하는 것이다.

작동 원리:
1. 프로토타입 구현 → 스펙 허점 발견 → PRD/Story Map 수정 → 다시 구현
2. 4월 W2~W3 기간 활용 (시험 전)
3. 5월 본 개발 시작 시 프로토타입 코드의 컴포넌트/구조는 그대로 승계

## 2. 구현 범위

### 포함

- **5개 화면(라우트)**:
  - `/` — 메인 (냉각 중 / 결정 대기 그룹 카드 리스트)
  - `/new` — 상품 등록
  - `/items/[id]/checklist/[step]` — 체크리스트 (1~7, 독립 라우트)
  - `/items/[id]/decide` — 결정 (좌우 대칭 버튼)
  - `/records` — 기록/절약

- **구현할 User Story (MUST)**:
  - US-1 상품 등록
  - US-2 위시리스트 조회 (빈 상태 포함)
  - US-4 체크리스트 7문항
  - US-5 결정 처리
  - US-7 기록/절약 금액 (답변 다시 보기 포함 — 원래 SHOULD였으나 경량이라 포함)
  - US-8 반응형 (768px 기준 분기)
  - US-10 냉각 중 삭제

- **톤 원칙 UI 반영**:
  - 결정 화면 [포기] / [구매] 버튼 완벽 좌우 대칭, **둘 다 secondary gray**
  - 중립적 토스트 문구 ("기록됐어요")
  - 빈 상태 "첫 상품을 등록해보세요" 초대형 문구
  - 과장 칭찬/비꼼 금지

### 제외 (5월 본 개발에서 처리)

- **Supabase / Auth / RLS** → localStorage, single-user 가정
- **PWA manifest / Service Worker / Web Push** → 구현 안 함
- **Edge Function 냉각 타이머** → 카드에 **개발용 "냉각 완료 처리" 버튼** 노출 (수동 트리거)
- **US-3 푸시 알림** — UI는 만들되 실제 알림은 발송 안 함
- **US-6 자동 삭제 Cron** — 48시간 타이머 실제 돌리지 않음, 수동 트리거로 대체
- **US-9 PWA 설정** — `manifest.json` 없음
- **US-11~14 SHOULD 스토리** — 전부 제외

### 왜 타이머 시뮬레이션 버튼인가

실제 setTimeout으로 냉각기 돌리면:
- 브라우저 닫으면 타이머 꺼짐 → 의미 없음
- 실제 완료까지 대기하려면 프로토타입 테스트가 몇 시간~며칠 걸림 → 스펙 보정 루프 속도 죽음

수동 트리거가 더 정직한 프로토타입이다. 본 개발에선 Edge Function으로 교체.

## 3. 기술 스택

| 레이어 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 App Router + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 컴포넌트 | shadcn/ui (New York style) |
| 폼 | React Hook Form + Zod |
| 상태 | React Context + localStorage (Zustand 오버) |
| 토스트 | sonner (shadcn 권장) |
| 폰트 | Inter (NotionInter 대체) |

**Next.js 프로젝트 루트**: `/Users/musinsa/cooling-off/prototype/`

## 4. 디자인 시스템 매핑 (DESIGN.md → 쿨링오프)

### 색상
| 역할 | 값 |
|---|---|
| 배경 메인 | `#ffffff` |
| 배경 섹션 alt | `#f6f5f4` (warm white) |
| 본문 텍스트 | `rgba(0,0,0,0.95)` |
| 보조 텍스트 | `#615d59` |
| Muted | `#a39e98` |
| Primary CTA | `#0075de` (Notion Blue) |
| 결정 버튼 (양쪽) | `rgba(0,0,0,0.05)` bg + near-black text |
| 상태 pill 배경 | `#f2f9ff` |
| 상태 pill 텍스트 | `#097fe8` |
| whisper border | `1px solid rgba(0,0,0,0.1)` |

### 타이포 (Inter)
- Display (메인 태그라인, 절약 금액): 48~64px / weight 700 / letter-spacing -1.5 ~ -2.125px
- Sub-heading (섹션): 26px / weight 700 / letter-spacing -0.625px
- Card title: 22px / weight 700 / letter-spacing -0.25px
- Body: 16px / weight 400 / line-height 1.5
- Nav/Button: 15px / weight 600
- Badge: 12px / weight 600 / letter-spacing 0.125px

### 카드
- Radius: 12px (일반) / 16px (결정 화면 히어로)
- Border: whisper border
- Shadow: 4-layer stack per DESIGN.md

### 핵심 톤 원칙의 시각 구현

1. **결정 버튼 완벽 대칭**: [포기] / [구매] 모두 동일한 secondary gray 스타일. Notion Blue는 사용 안 함. 크기·padding·font 동일. 좌우 위치만 다름.
2. **결정 후 이동**: 결정 기록 후 홈으로 이동.
3. **빈 상태**: 일러스트 없이 Notion 스타일로 "첫 상품을 등록해보세요" 큰 문구 + [+ 등록하기] CTA.

## 5. 화면 상세

### 5-1. 메인 `/`

- 상단: "쿨링오프" wordmark + "사기 전에 한 번 식히기" 태그라인
- 섹션 1: **🧊 냉각 중** (status='cooling')
  - 각 카드: 상품명 / 가격(원화) / 남은 시간 ("12일 3시간" 또는 "3시간 12분")
  - 카드 우상단 `⋯` 메뉴: [삭제] / **[개발] 냉각 완료 처리**
- 섹션 2: **✅ 결정 대기** (status='ready')
  - 카드 하단 CTA "결정하기 →" → `/items/[id]/checklist/1`
- 빈 상태: 위 톤 원칙 적용
- FAB (모바일) / 상단 버튼 (PC): `[+ 등록하기]`

### 5-2. 등록 `/new`

- 상품명 (필수, text)
- 가격 (필수, number, 원화 마스킹)
- 가격 입력 시 실시간 "→ 냉각기: 7일" 계산 표시
  - ~5만: 24시간
  - 5~10만: 48시간
  - 10~30만: 7일
  - 30~100만: 14일
  - 100만+: 30일
- URL (선택)
- 메모 (선택)
- [냉각 시작하기] → localStorage 저장 → `/` 리다이렉트
- Zod validation → 필수 필드 에러 메시지

### 5-3. 체크리스트 `/items/[id]/checklist/[step]`

- URL로 진행도 보존 (새로고침/딥링크 견딤)
- 상단: "운동화 ₩129,000 · 7일 기다렸어. 아직도 원해?"
- 진행도: `1/7`
- 질문 텍스트 (PRD 4-1의 7개 질문 그대로) + `<Textarea>`
- [← 이전] / [다음 →] (step 1은 이전 숨김)
- 답변 onBlur마다 localStorage 저장
- step 7 [다음 →] → `/items/[id]/decide` 이동

### 5-4. 결정 `/items/[id]/decide`

- 상단: 상품명/가격/기다린 시간
- 보조: "기록된 답변 7개" 접힌 섹션 (확장 시 체크리스트 답변 요약)
- 중앙: [포기] ↔ [구매] **완벽 대칭**
- 선택 후:
  - localStorage status 업데이트 (`passed` or `purchased`), `decided_at` 기록
  - `/` 이동

### 5-5. 기록 `/records`

- 히어로: "이번 달 절약 금액" `₩XXX,XXX` (48px NotionInter weight 700)
- 보조 카드 3개: 이번 달 완료 건수 / 포기율(%) / (여백)
- 리스트: status IN ('passed','purchased','deleted') 최근 순
  - 각 카드 클릭 → 상세 모달 (체크리스트 답변 다시 보기)

## 6. 데이터 모델 (localStorage)

tech-design 4-1의 PostgreSQL 스키마를 그대로 유지. 5월 본 개발 시 필드명 변경 없이 Supabase로 이관 가능.

**키**: `cooling-off:items`, `cooling-off:checklist_answers`

```typescript
type ItemStatus = 'cooling' | 'ready' | 'purchased' | 'passed' | 'deleted'

interface Item {
  id: string               // uuid
  user_id: 'local'         // 고정값 (single-user)
  name: string
  price: number
  url?: string
  memo?: string
  status: ItemStatus
  cooling_until: string    // ISO timestamp
  created_at: string       // ISO timestamp
  decided_at?: string      // ISO timestamp
}

interface ChecklistAnswer {
  id: string               // uuid
  item_id: string
  question_no: 1 | 2 | 3 | 4 | 5 | 6 | 7
  answer: string
  answered_at: string      // ISO timestamp
}
```

Context API로 React에 주입, `useItems()` / `useAnswers()` 훅 제공. 쓰기 시마다 localStorage 동기화.

## 7. 프로젝트 구조

```
prototype/
├── app/
│   ├── layout.tsx           # 루트 레이아웃 + Inter + Sonner Toaster
│   ├── page.tsx             # 메인 /
│   ├── new/page.tsx         # 등록
│   ├── items/[id]/
│   │   ├── checklist/[step]/page.tsx
│   │   └── decide/page.tsx
│   └── records/page.tsx
├── components/
│   ├── ui/                  # shadcn 컴포넌트
│   ├── ItemCard.tsx
│   ├── EmptyState.tsx
│   ├── CoolingTimer.tsx
│   └── DevCoolingCompleteButton.tsx
├── lib/
│   ├── storage.ts           # localStorage 추상화
│   ├── cooling.ts           # 가격별 냉각기 계산
│   └── types.ts
├── contexts/
│   └── ItemsContext.tsx
└── DESIGN.md                # 루트의 DESIGN.md 심볼릭 링크 또는 복사
```

## 8. 스펙 보정 루프 (의심 지점)

프로토타입 구현 중 다음 3개 지점을 먼저 의심한다. 막히면 즉시 PRD/Story Map 수정.

1. **US-5 결정 후 이동 타이밍**
   - 결정 후 바로 메인으로 이동할지, 기록 완료 문구를 잠깐 보여줄지 UX 검증 필요.

2. **체크리스트 중단→복귀 동선**
   - 알림 없이 그냥 메인 들어왔을 때, "결정 대기" 카드 클릭 → 체크리스트로 바로 가야 함
   - PRD는 알림 → 딥링크 경로만 명시. 메인 → 카드 클릭 경로 빠짐.
   - Story Map 2.1에 "카드 클릭 → 상세 페이지 이동" SHOULD로 있지만 체크리스트 연결은 불명확.

3. **수동 삭제 vs 자동 삭제의 절약 금액 합산**
   - US-6 AC4: "자동 삭제된 아이템도 절약 금액에 합산"
   - US-10: 냉각 중 수동 삭제 → 절약 금액에 합산되나?
   - 의심: 수동 삭제는 "아 필요 없었네" 결정 성공 사례일 수도, "잘못 등록" 실수일 수도. 합산 여부가 스펙에 모호.

## 9. 프로토타입의 성공 기준

- [ ] 5개 화면 전부 클릭 가능
- [ ] 반응형: 768px 기준으로 모바일/PC 둘 다 자연스러움
- [ ] 톤 원칙 3개(좌우대칭, 중립 피드백, 빈 상태) 시각 구현
- [ ] 스펙 보정 루프에서 최소 3개 이상의 스펙 수정 사항 발견 및 반영
- [ ] 5월 본 개발 시작 시 컴포넌트/라우트 구조 승계 가능

## 10. 범위 밖

- 로그인 / 회원가입 / 사용자별 데이터 격리
- Supabase 연동
- Service Worker / manifest / Web Push
- 서버 사이드 렌더링 최적화
- 실제 타이머 기반 냉각 완료 처리
- 테스트 코드 (프로토타입이라 생략. 본 개발에서 추가)
- 국제화, 다국어
- 접근성 고급 기능 (shadcn 기본 수준만)
- 감정 태깅, 월별 차트 등 SHOULD/Future 스토리
