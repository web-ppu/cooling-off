# 쿨링오프

> 사기 전에 한 번 식히기. 충동구매와 결제 사이에 시간과 대화를 넣어서, 식은 머리로 다시 판단하게 해주는 앱.

---

## 로컬 실행

```bash
cd prototype
npm install
npm run dev
# http://localhost:3000
```

---

## 역할별 읽기 순서

### 디자이너

1. [pm/prd.md](./pm/prd.md) — 원칙, 사용 흐름, AI 대화 컨셉
2. [design/design-system.md](./design/design-system.md) — 색상, 타이포, 간격 (토큰 참조용)
3. [design/screen-spec.md](./design/screen-spec.md) — 7개 화면 레이아웃 + 인터랙션

### 개발자

1. [engineering/tech-spec.md](./engineering/tech-spec.md) — 기술 스택, 데이터 모델, 구현 상태, 다음 할 것
2. [engineering/ai-prompt-v1.md](./engineering/ai-prompt-v1.md) — AI 프롬프트, 톤, 응답 단계 규칙
3. [pm/prd.md](./pm/prd.md) — 기능 요구사항 FR-1~FR-10

### PM / 기획자

1. [pm/prd.md](./pm/prd.md) — 요구사항, 원칙, 메트릭, 릴리스 계획
2. [pm/기획-배경.md](./pm/기획-배경.md) — 리서치 원문 (통계, 뇌과학, 경쟁 분석)

### 교수 / 리뷰어

[pm/prd.md](./pm/prd.md) 하나만 읽으면 됨.

---

## 문서 구조

```
docs/
├── pm/                         ← "뭘 왜 만드나"
│   ├── prd.md                  ← 요구사항, 원칙, 메트릭, 릴리스 계획
│   └── 기획-배경.md              ← 리서치 원문 아카이브
├── design/                     ← "어떻게 보이고 동작하나"
│   ├── design-system.md         ← 색상, 타이포, 간격 토큰
│   └── screen-spec.md           ← 7개 화면 레이아웃 + 인터랙션
├── engineering/                ← "어떻게 만드나"
│   ├── tech-spec.md            ← 기술 스택, 데이터 모델, 구현 상태
│   ├── ai-prompt-v1.md         ← AI 프롬프트, 톤, 응답 단계 규칙
│   ├── ai-simulation-log.md    ← AI 대화 시뮬레이션 기록 + 프롬프트 규칙
│   └── ai-frontend-contract.md ← AI-프론트엔드 인터페이스 계약 (phase 기반)
└── archive/                    ← 의사결정 맥락 보관 (평소 안 읽어도 됨)
```

---

## archive/

의사결정 맥락 보관 문서. 평소에 안 읽어도 됨. "왜 이렇게 결정했지?" 궁금할 때 참조.

- `frame-problem.md` — 설계 원칙 12개 + 과학 근거 11개 (AI 맥락용 딥 레퍼런스)
- `adr-llm-chat-pivot.md` — 체크리스트를 버리고 AI 대화로 간 배경
- `adr-no-product-image.md` — 상품 이미지를 넣지 않는 이유 (2026-04-16)
- `adr-decide-flow.md` — AI 대화 종료 시점 + 결정 버튼 노출 구조 재설계 (2026-04-16)

---

## 배포

https://prototype-sandy-ten.vercel.app
