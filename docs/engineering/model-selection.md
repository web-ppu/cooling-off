---
date: 2026-05-12
type: model-selection
status: active
version: 1.0
related:
  - model-comparison.md
  - ai-prompt-v1.md
  - tech-spec.md
---

# 사용할 AI 모델 선정

> [model-comparison.md](model-comparison.md)의 5축 비교 결과를 바탕으로 MVP에서 사용할 AI 모델과 호출 방식을 확정한다.

---

## 1. 선정 결과

### ✅ 선택 모델: **Claude Haiku 4.5**

| 항목 | 값 |
|---|---|
| 벤더 | Anthropic |
| 모델 ID (API) | `claude-haiku-4-5` |
| 입력 가격 | $1.00 / 1M tokens |
| 출력 가격 | $5.00 / 1M tokens |
| 캐싱 | ✅ 명시적 (cache read 90% 할인) |
| 컨텍스트 윈도우 | 200K tokens |
| 추정 운영비 (100 MAU) | ~$2/월 (캐싱 적용) |
| 추정 운영비 (1000 MAU) | ~$20/월 |
| SDK | `anthropic` (Python·JavaScript) |
| 응답 지연 | 80~120 TPS, 500단어 응답 ~2~3초 |

### 차순위 (선택 모델이 운용 중 문제 발생 시 마이그레이션 후보)

1. **GPT-4o-mini** — 가장 저렴·안정적. 통합 가장 쉬움.
2. **Gemini 3.1 Flash-Lite** — 최저가·최고속. 단정 경향 위험.

---

## 2. 선택 이유

### 결정 기준 (우선순위)

1. **한국어 톤·반말 자연스러움** — 쿨링오프의 핵심 UX. AI 채팅만 반말로 외부 관찰자 톤을 유지해야 하는 PRD 원칙 8.
2. **운영 안정성** — MVP 단계, 실패 케이스 최소화 필요.
3. **운영비 부담 없음** — 100~1000 MAU 기준 월 운영비가 무시할 수준이어야 함.
4. **통합 단순성** — 비개발자 환경에서도 운영 가능한 인증·SDK 구조.

### Claude Haiku 4.5를 선택한 근거 4가지

1. **한국어 반말·외부 관찰자 톤이 가장 자연스러움**
   - 라운드 1에서 Claude Opus 4.7이 한국어 반말·짧고 직설적 톤·모순 추적에서 가장 강한 성능.
   - 챗봇 등급에서도 Claude 라인의 톤 특성은 유지되는 경향 (벤더 공통 모델 패밀리 특성).
   - Gemini는 빠르지만 단정 표현 위험, GPT는 안정적이지만 한국어 반말 톤이 다소 어색해질 수 있음.

2. **운영비가 충분히 저렴**
   - 100 MAU 기준 월 $2, 1000 MAU 기준 월 $20.
   - GPT-4o-mini와 Gemini Flash-Lite 대비 4~6배 비싸지만 절대 금액이 미미함.
   - 비용 차이가 의사결정 1순위가 될 만큼 크지 않음.

3. **통합이 단순**
   - API 키 1개로 SDK 호출 가능 (Python·JavaScript 모두 공식 SDK).
   - Vertex AI 같은 클라우드 인프라 학습곡선 없음 (Gemini 대비 장점).
   - 공식 문서·예제·커뮤니티 자료 충분.

4. **응답 지연 챗봇용 적합**
   - 80~120 TPS, 500단어 응답이 2~3초 안에 완료.
   - 사고 모델(Opus 4.7) 대비 5~10배 빠름.
   - 쿨링오프 채팅 UX에 적합한 즉시성.

### 채택하지 않은 옵션의 이유

- **GPT-4o-mini**: 운영 안정성·가성비 매우 우수. 다만 라운드 1에서 GPT 라인이 요약에 등록 정보를 자동 삽입하는 패턴이 강했고, 한국어 반말 톤이 Claude 대비 약간 어색해질 가능성. **차순위 후보로 보관**.
- **Gemini 3.1 Flash-Lite**: 가장 저렴·빠르지만 사용자 모호한 답변을 단정으로 바꾸는 경향이 라운드 1에서 관찰됨. v0 규칙(빈도 외삽 금지)과 충돌 위험. **차순위 후보로 보관**.

### 위험 인지 및 완화 (Claude Haiku 4.5 선택의 알려진 한계)

| 위험 | 완화 방안 |
|---|---|
| Haiku 4.5 직접 실측 미실시 (라운드 1은 Opus) | Week 3 출시 전 짧은 실측 라운드로 검증 |
| 사고 등급 대비 모순 추적·복잡 규칙 준수 약화 가능 | v1 프롬프트에서 6가지 관점·금지 항목 명시 강화 (완료) |
| 메타 태그 출력 실패 위험 | 서버 사이드 후처리로 [결정하기] 버튼 제어 이관 (구현 시 적용) |

---

## 3. API 키 보안 호출 방식 (브라우저 노출 방지)

### ❌ 절대 하면 안 되는 방식

```
[브라우저]
  ↓ API key 포함된 요청
[Anthropic API]
```

브라우저에 API 키가 노출되면 누구나 개발자 도구로 추출해 도용 가능. 절대 금지.

### ✅ 권장 방식 — 백엔드 프록시 (BFF 패턴)

```
[브라우저(쿨링오프 웹)]
  ↓ 일반 API 호출 (API key 없음)
[우리 백엔드 서버]
  ↓ Authorization 헤더에 API key 포함
[Anthropic API]
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
| 로컬 개발 | `.env.local` (gitignore 포함) | `ANTHROPIC_API_KEY=sk-ant-...` |
| Vercel 배포 | Vercel 대시보드 → Environment Variables | 동일 키 이름으로 등록 |
| GitHub | **절대 커밋 금지** | `.gitignore`에 `.env*` 포함 |

### 백엔드 코드 패턴 (참고용, 비개발자는 개발자에게 전달)

```typescript
// Next.js API Route 예시: app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // 서버 사이드 환경변수
});

export async function POST(request: Request) {
  const { messages, systemPrompt } = await request.json();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  return Response.json({ content: response.content });
}
```

→ 프론트엔드는 `/api/chat`에 fetch만 하면 됨. API 키는 절대 프론트에 안 보임.

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
   b. 시스템 프롬프트 + 등록 정보를 messages 앞에 합침
   c. Anthropic API 호출 (claude-haiku-4-5)
   d. 응답 받아서 메타 태그 후처리 (서버 사이드)
   e. [결정하기] 버튼 표시 여부 판단
4. 백엔드 → 브라우저: { aiResponse: "...", showDecideButton: true/false }
5. 브라우저: AI 응답을 채팅창에 표시, 필요 시 [결정하기] 버튼 표시
```

→ 은지가 채팅창에 메시지를 보내면 위 2~5 흐름이 일어나면서 AI 응답이 화면에 나타남. API 키는 어디에도 노출되지 않음.

---

## 5. 변경 가능성 (마이그레이션 대비)

선택 모델을 운영 중 다른 모델로 바꿀 필요가 생기면:

| 변경 시나리오 | 영향 범위 | 예상 작업량 |
|---|---|---|
| Haiku 4.5 → Sonnet 4.6 (Claude 내 상향) | API 호출의 model 파라미터만 변경 | 5분 |
| Haiku 4.5 → GPT-4o-mini (벤더 변경) | SDK 교체, 메시지 포맷 변환 로직 추가 | 1~2시간 |
| Haiku 4.5 → Gemini Flash-Lite | SDK 교체, 인증 방식 추가 (Vertex 경로면 더 복잡) | 2~4시간 |

→ MVP 후 운용 데이터 보고 필요 시 비교적 짧은 시간 안에 마이그레이션 가능.

---

## 6. 완료 조건 체크

| 완료 조건 | 충족 여부 |
|---|:-:|
| 사용할 모델과 선택 이유가 정해져 있다 | ✅ Claude Haiku 4.5, 근거 4가지 명시 |
| 은지가 AI 응답을 받아올 수 있는 방식이 정리되어 있다 | ✅ §3·§4에 백엔드 프록시 패턴·구현 옵션·흐름 정리 |
| API 키를 브라우저에 노출하지 않는 호출 방식이 정리되어 있다 | ✅ §3에 BFF 패턴 + 4가지 구현 옵션 + 코드 예시 |
