---
date: 2026-05-19
type: model-selection
status: active
version: 1.2
related:
  - model-comparison.md
  - ai-prompt-v1.md
  - tech-spec.md
  - ../archive/adr-vercel-ai-sdk.md
changelog:
  - "v1.2 (2026-05-19): AI 통합 라이브러리를 Vercel AI SDK로 명시 (코드 리뷰 반영, PR #100 ADR 채택). 벤더 SDK 직접 호출 예시·마이그레이션 작업량 갱신."
  - "v1.1 (2026-05-12): 선정 모델을 Claude Haiku 4.5 → Gemini 3.1 Flash-Lite로 변경 (가성비·속도 우선 정책)"
  - "v1.0 (2026-05-12): 최초 선정 (Claude Haiku 4.5)"
---

# 사용할 AI 모델 선정

> [model-comparison.md](model-comparison.md)의 5축 비교 결과를 바탕으로 MVP에서 사용할 AI 모델과 호출 방식을 확정한다.

---

## 1. 선정 결과

### ✅ 선택 모델: **Gemini 3.1 Flash-Lite**

| 항목 | 값 |
|---|---|
| 벤더 | Google |
| 모델 ID (API) | `gemini-3.1-flash-lite` (또는 카탈로그 기준 최신 Flash-Lite 변형) |
| 입력 가격 | $0.25 / 1M tokens |
| 출력 가격 | $1.50 / 1M tokens |
| 캐싱 | ✅ 명시적 캐싱 지원 |
| 컨텍스트 윈도우 | 1M tokens |
| 추정 운영비 (100 MAU) | ~$0.5/월 (캐싱 적용) |
| 추정 운영비 (1000 MAU) | ~$5/월 |
| 통합 라이브러리 | **Vercel AI SDK** (`ai` + `@ai-sdk/google`). 벤더 SDK 직접 호출 X — [ADR](../archive/adr-vercel-ai-sdk.md) 참고 |
| 응답 지연 | Flash 대비 TTFT 2.5배 빠름. 챗봇 UX에 가장 적합 |

### 차순위 (선택 모델이 운용 중 문제 발생 시 마이그레이션 후보)

1. **Claude Haiku 4.5** — 한국어 톤·반말 자연스러움이 가장 강함. 단가 ~$2/월(100MAU).
2. **GPT-4o-mini** — 가장 안정적·통합 가장 쉬움. 단가 ~$0.3/월(100MAU).

---

## 2. 선택 이유

### 결정 기준 (우선순위)

1. **속도** — 챗봇 UX의 핵심. 사용자가 메시지 보내고 빠르게 응답을 받아야 자연스러움.
2. **운영비 최소화** — MVP에서 1000 MAU까지 확장해도 월 $5 수준 유지.
3. **통합 단순성** — 비개발자 환경에서도 운영 가능한 인증·SDK 구조.
4. **한국어 응답 품질** — 한국어 반말 톤이 자연스러우면 OK (완벽함보다 충분히 좋음).

### Gemini 3.1 Flash-Lite를 선택한 근거 4가지

1. **최저가 + 최저지연 조합**
   - 입력 $0.25 / 출력 $1.50 — 챗봇 등급 라인업 중 가장 저렴.
   - Flash 대비 TTFT(첫 토큰까지 시간) 2.5배 빠름 — 채팅 UX에 가장 자연스러움.
   - 1000 MAU 운영 시에도 월 $5 수준. 비용을 사실상 고려 대상에서 제외할 수 있음.

2. **컨텍스트 윈도우가 매우 큼**
   - 1M tokens — 멀티턴 대화가 길어져도 문제없음.
   - 라운드 1 측정 대화(8턴, 약 1.6K tokens)는 윈도우의 0.2% 수준.

3. **통합 단순 + 벤더 락인 회피**
   - Google AI Studio 경로면 API 키 1개로 시작 가능.
   - **Vercel AI SDK** 추상화로 한 줄 호출 (provider만 import 바꾸면 OpenAI·Anthropic·Gemini 모두 동일 코드). 자세한 결정 근거는 [`../archive/adr-vercel-ai-sdk.md`](../archive/adr-vercel-ai-sdk.md) 참고.
   - 무료 티어가 넉넉해서 개발·테스트 단계에서 결제 없이 진행 가능.

4. **챗봇 UX 강점**
   - 라운드 1에서 Gemini 라인의 빠른 통과·간결한 요약(Case C)이 가장 깔끔했음.
   - 챗봇 등급에서도 라인 특성 유지될 가능성 큼.

### 채택하지 않은 옵션의 이유

- **Claude Haiku 4.5**: 라운드 1에서 한국어 반말·외부 관찰자 톤이 가장 자연스러웠음. 다만 가격이 Flash-Lite의 4배($1/$5 vs $0.25/$1.50). 한국어 톤이 결정적이면 차선책으로 즉시 마이그레이션 가능. **차순위 1번**.
- **GPT-4o-mini**: 라운드 1에서 GPT 라인이 가장 중립적이고 안정적이었음. 다만 라운드 1에서 요약에 등록 정보를 자동 삽입하는 패턴이 강했고, v1 프롬프트가 챗봇 등급에서도 해당 패턴을 잡아낼지 검증 미실시. **차순위 2번**.

### 위험 인지 및 완화 (Gemini 3.1 Flash-Lite 선택의 알려진 한계)

| 위험 | 완화 방안 |
|---|---|
| 챗봇 등급 직접 실측 미실시 (라운드 1은 사고 등급 Gemini 3.1 Pro) | Week 3 출시 전 Google AI Studio에서 짧은 실측 라운드로 검증 |
| Gemini 3.1 Pro에서 관찰된 "사용자 모호함을 단정으로 바꾸는 경향"이 Flash-Lite에서 더 강해질 수 있음 | v1 프롬프트 §5 "사용 빈도 현실화" 항목의 "명시하지 않은 빈도를 추정·확장하지 않는다" 조항으로 차단 |
| 빈도 외삽 위험 ("주 1회" → "월 4번" 단정) | v1 §5 #2 주의 항목 + 서버 사이드 후처리에서 키워드 기반 보강 |
| 한국어 반말 톤이 Claude 라인보다 미세하게 어색할 가능성 | 출시 전 사용자 베타 검증 + 톤 이슈 발견 시 Haiku 4.5로 즉시 마이그레이션 (1~2시간 작업) |
| 메타 태그 출력 실패 위험 (라운드 1에서 모든 모델 실패) | 서버 사이드 후처리로 [결정하기] 버튼 제어 이관 (ai-prompt-v1.md §8) |

---

## 3. API 키 보안 호출 방식 (브라우저 노출 방지)

### ❌ 절대 하면 안 되는 방식

```
[브라우저]
  ↓ API key 포함된 요청
[Google AI API]
```

브라우저에 API 키가 노출되면 누구나 개발자 도구로 추출해 도용 가능. 절대 금지.

### ✅ 권장 방식 — 백엔드 프록시 (BFF 패턴)

```
[브라우저(쿨링오프 웹)]
  ↓ 일반 API 호출 (API key 없음)
[우리 백엔드 서버]
  ↓ API key를 헤더 또는 쿼리에 포함
[Google AI API]
  ↑ AI 응답
[우리 백엔드 서버]
  ↑ AI 응답 (가공 후 반환)
[브라우저]
```

브라우저는 **우리 백엔드 서버 주소**만 알면 됨. API 키는 백엔드 서버에 환경변수로만 존재.

### 구현 옵션 (개발자가 선택)

| 옵션 | 설명 | 적합 시나리오 |
|---|---|---|
| **Next.js API Routes** (또는 Server Actions) | 프론트엔드 프레임워크 안에 백엔드 엔드포인트 내장 | Next.js로 풀스택 만들 때 가장 단순 |
| **Vercel / Netlify Serverless Functions** | 별도 서버 없이 함수 단위로 백엔드 호스팅 | 백엔드 인프라 최소화 |
| **Cloudflare Workers** | 엣지에서 실행되는 경량 서버 | 빠른 응답·전세계 분산 |
| **별도 Node.js / Python 서버** | Express, Fastify, FastAPI 등으로 별도 구축 | 백엔드 로직 복잡한 경우 |

→ **MVP 단계에서는 Next.js API Routes 권장** (프론트와 한 코드베이스, 별도 인프라 불필요).

### API 키 저장 위치 (환경변수)

| 환경 | 위치 | 예시 |
|---|---|---|
| 로컬 개발 | `.env.local` (gitignore 포함) | `GEMINI_API_KEY=AIza...` |
| Vercel 배포 | Vercel 대시보드 → Environment Variables | 동일 키 이름으로 등록 |
| GitHub | **절대 커밋 금지** | `.gitignore`에 `.env*` 포함 |

### 백엔드 코드 패턴 — Vercel AI SDK (채택)

```typescript
// Next.js API Route 예시: app/api/chat/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
// 벤더 변경 시 위 두 줄만 교체:
// import { openai } from "@ai-sdk/openai";
// import { anthropic } from "@ai-sdk/anthropic";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

export async function POST(request: Request) {
  const { systemPrompt, messages } = await request.json();

  const { text } = await generateText({
    model: google(MODEL),
    system: systemPrompt,
    messages, // [{ role: "user" | "assistant", content: "..." }]
  });

  return Response.json({ content: text });
}
```

→ 프론트엔드는 `/api/chat`에 fetch만 하면 됨. API 키(`GOOGLE_GENERATIVE_AI_API_KEY`)는 절대 프론트에 안 보임. provider 함수와 환경변수만 바꾸면 OpenAI·Anthropic 등으로 즉시 전환 가능 — [`ADR`](../archive/adr-vercel-ai-sdk.md) §결정 사항 참고.

### 추가 보안 권장 사항

1. **요청 검증**: 백엔드 엔드포인트에 인증 추가 (로그인 사용자만 호출 가능)
2. **요청 제한 (Rate limiting)**: 사용자당 분당·일간 호출 횟수 제한 (악용 방지)
3. **로그·모니터링**: 비정상 호출 패턴(폭발적 증가) 알림
4. **시스템 프롬프트 노출 금지**: 시스템 프롬프트는 백엔드에서 추가, 프론트에서 전달 X
5. **에러 메시지 단순화**: API 에러 그대로 노출하지 말고 일반 메시지로 변환

---

## 4. AI 응답을 받아오는 흐름 (은지 관점)

쿨링오프 채팅 화면에서 사용자가 메시지를 보낼 때 시스템이 하는 일:

```
1. 사용자가 채팅창에 메시지 입력 → 전송
2. 브라우저(웹) → 우리 백엔드 /api/chat 호출
   요청 본문: { messages: [...이전 대화], userMessage: "..." }
3. 백엔드:
   a. 사용자 인증·요청 제한 확인
   b. 시스템 프롬프트 + 등록 정보를 systemInstruction에 합침
   c. Vercel AI SDK (`generateText`)로 Gemini 호출
   d. 응답 받아서 메타 태그 후처리 (서버 사이드)
   e. [결정하기] 버튼 표시 여부 판단
4. 백엔드 → 브라우저: { aiResponse: "...", showDecideButton: true/false }
5. 브라우저: AI 응답을 채팅창에 표시, 필요 시 [결정하기] 버튼 표시
```

→ 은지가 채팅창에 메시지를 보내면 위 2~5 흐름이 일어나면서 AI 응답이 화면에 나타남. API 키는 어디에도 노출되지 않음.

---

## 5. 변경 가능성 (마이그레이션 대비)

선택 모델을 운영 중 다른 모델로 바꿀 필요가 생기면 — Vercel AI SDK 채택 덕에 작업량이 매우 작다:

| 변경 시나리오 | 영향 범위 | 예상 작업량 |
|---|---|---|
| Flash-Lite → Flash (Google 내 상향) | `GEMINI_MODEL` 환경변수만 변경 | 1분 |
| Flash-Lite → Claude Haiku 4.5 (벤더 변경, 톤 우선) | provider import 1줄 (`@ai-sdk/google` → `@ai-sdk/anthropic`) + API 키 환경변수 추가 | 10분 |
| Flash-Lite → GPT-4o-mini (벤더 변경, 안정성 우선) | provider import 1줄 (`@ai-sdk/google` → `@ai-sdk/openai`) + API 키 환경변수 추가 | 10분 |

→ MVP 후 운용 데이터 보고 즉시 마이그레이션 가능. 메시지 포맷 변환·재인증 로직은 Vercel AI SDK가 추상화하므로 추가 작업 불필요.

---

## 6. 완료 조건 체크

| 완료 조건 | 충족 여부 |
|---|:-:|
| 사용할 모델과 선택 이유가 정해져 있다 | ✅ Gemini 3.1 Flash-Lite, 근거 4가지 명시 |
| 은지가 AI 응답을 받아올 수 있는 방식이 정리되어 있다 | ✅ §3·§4에 백엔드 프록시 패턴·구현 옵션·흐름 정리 |
| API 키를 브라우저에 노출하지 않는 호출 방식이 정리되어 있다 | ✅ §3에 BFF 패턴 + 4가지 구현 옵션 + 코드 예시 |
