# 쿨링오프

> 사기 전에 한 번 식히기. 충동구매와 결제 사이에 시간과 AI 채팅을 넣어서, 식은 머리로 다시 판단하게 해주는 반응형 웹 서비스.

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

1. [pm/prd.md](./pm/prd.md) — 원칙, 사용 흐름, AI 채팅 기준
2. [design/screen-spec.md](./design/screen-spec.md) — 화면별 레이아웃 + 인터랙션

### 개발자

1. [engineering/tech-spec.md](./engineering/tech-spec.md) — 개발 참고 메모, 구현자가 확정할 항목
2. [engineering/ai-prompt-v1.md](./engineering/ai-prompt-v1.md) — AI 프롬프트와 톤
3. [pm/prd.md](./pm/prd.md) — 기능 요구사항 FR-1~FR-9

### PM / 기획자

1. [pm/prd.md](./pm/prd.md) — 요구사항, 원칙, 메트릭, 릴리스 계획
2. [pm/기획-배경.md](./pm/기획-배경.md) — 문제 배경과 제품 결정 근거

### 교수 / 리뷰어

[pm/prd.md](./pm/prd.md) 하나만 읽으면 됩니다.

---

## 문서 구조

```
docs/
├── pm/                         ← "뭘 왜 만드나"
│   ├── prd.md                  ← 요구사항, 원칙, 메트릭, 릴리스 계획
│   └── 기획-배경.md              ← 문제 배경과 제품 결정 근거
├── design/                     ← "어떻게 보이고 동작하나"
│   └── screen-spec.md           ← 화면별 레이아웃 + 인터랙션
├── engineering/                ← "어떻게 만드나"
│   ├── tech-spec.md            ← 개발 참고 메모, 구현자가 확정할 항목
│   ├── ai-prompt-v1.md         ← AI 프롬프트와 톤
│   └── ai-simulation-log.md    ← AI 채팅 시뮬레이션 기록 + 프롬프트 규칙
└── archive/                    ← 현재도 유효한 결정 근거 보관
```

---

## archive/

현재도 유효한 결정 근거만 보관한다. 현재 제품 스펙은 `pm/prd.md`와 `design/screen-spec.md`를 우선한다.

- `adr-no-product-image.md` — 상품 이미지를 넣지 않는 이유 (2026-04-16)

---

## 배포

https://prototype-sandy-ten.vercel.app
