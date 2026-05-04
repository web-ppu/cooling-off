# 쿨링오프 -- Tech Spec

> 엔지니어용 기술 명세. "어떻게 만드나"에 집중한다.
> 요구사항, 원칙, 성공 메트릭 등 PM 영역은 별도 문서 참조.
>
> **Owner:** 개발자
> **상태:** draft. PM 문서는 사용자 요구사항만 정의하고, 인증/DB/저장소 구현 선택은 이 문서에서 개발자가 확정한다.
>
> **관련 문서**
> - 요구사항: [`../pm/prd.md`](../pm/prd.md)
> - AI 프롬프트 상세: [`./ai-prompt-v1.md`](./ai-prompt-v1.md)
> - 화면 스펙: [`../design/screen-spec.md`](../design/screen-spec.md)
> - 인터랙션: [`../design/screen-spec.md`](../design/screen-spec.md)

---

## 1. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프레임워크 | Next.js 16 (App Router) | React 19 + TypeScript |
| 스타일링 | Tailwind v4 + shadcn/ui | motion/react (애니메이션) |
| 폼/검증 | React Hook Form + Zod | |
| 토스트 | sonner | |
| Auth | TBD | MVP는 최소 로그인 방식 1개 |
| 데이터 | TBD | 계정 기반 영구 저장, 사용자별 데이터 분리 |
| AI (현재) | Mock multi-turn chat | `lib/ai/mock-chat.ts` |
| AI (다음) | Anthropic SDK (Claude API) | streaming + prompt caching |
| 배포 | Vercel | https://prototype-sandy-ten.vercel.app |

---

## 2. 아키텍처 개요

```
prototype/
├── app/                    # Next.js App Router 페이지
│   └── api/chat/route.ts   # (다음) Claude API server action
├── components/
│   ├── home/               # 홈 화면 컴포넌트
│   ├── records/            # 기록 화면 컴포넌트
│   ├── chat/               # AI 대화 컴포넌트 (신규)
│   │   ├── ChatScreen.tsx
│   │   ├── ChatMessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── ui/                 # shadcn/ui 공통 컴포넌트
├── lib/
│   ├── ai/
│   │   └── mock-chat.ts    # Rule-based 5가지 시나리오 + 스트리밍 시뮬레이터
│   └── cooling.ts          # 냉각기 상태 전이 로직
└── package.json
```

**데이터 흐름 (현재 MVP)**
1. 사용자 로그인 -> 세션 생성
2. 사용자 입력 -> React Hook Form + Zod 검증
3. 검증 통과 -> 계정 기반 영구 저장소에 Item 저장
4. 냉각기 타이머 -> 30초 주기로 상태 자동 전이 후 저장소에 반영
5. AI 대화 -> mock-chat.ts에서 rule-based 응답 생성 (스트리밍 시뮬레이션)
6. 대화/결정 -> 대화 기록, 결정 상태, 결정 시각 저장

**데이터 흐름 (다음: Claude API 연결 후)**
1. 사용자 입력 -> `app/api/chat/route.ts` server action
2. Server action -> 현재 사용자 item/history 조회
3. Server action -> Anthropic SDK (streaming + prompt caching)
4. 스트리밍 응답 -> 클라이언트에 실시간 전달 + 저장소에 저장

---

## 3. 데이터 모델

### Items 스키마

```ts
type ItemStatus =
  | "cooling"    // 냉각기 대기 중
  | "ready"      // 냉각 완료, 결정 대기
  | "purchased"  // 구매 결정
  | "passed"     // 포기 결정
  | "deleted";   // 삭제됨

interface Item {
  id: string;
  user_id: string;            // 로그인 사용자 식별자
  name: string;
  price: number;
  url?: string;
  reason?: string;
  status: ItemStatus;
  cooling_until: string;      // ISO 8601
  created_at: string;         // ISO 8601
  decided_at?: string;        // ISO 8601
}
```

### Chat 스키마

```ts
type ChatRole = "user" | "ai";

interface ChatMessage {
  id: string;
  user_id: string;            // 로그인 사용자 식별자
  item_id: string;            // Item.id 참조
  role: ChatRole;
  content: string;
  created_at: string;
}
```

**저장소**: TBD (개발자 확정)

MVP 테이블:
- `items`
- `chat_messages`

기본 요구사항:
- 사용자별 데이터가 분리되어야 한다.
- 다른 사용자의 item/chat에 접근할 수 없어야 한다.
- 결정 기록은 브라우저 삭제로 유실되지 않아야 한다.
- `chat_messages.item_id`는 같은 사용자의 `items.id`만 참조해야 한다.

localStorage는 영구 데이터 저장에 사용하지 않는다. 허용 범위는 폼 draft, 토스트 표시 같은 임시 UI 상태뿐이다.

---

## 4. 현재 구현 상태

작동하는 것:
- 7개 화면 전부 (계정 기반 영구 저장 + mock chat 기반)
- AI 대화 + 팩트 요약 + 대칭 결정 버튼의 4단계 Decide 플로우
- 단일 폼 등록 + 봉인 애니메이션
- 냉각기 30초 주기 자동 상태 전이
- 기록 월별 그룹핑 + 대화 transcript 다시 보기

폐기 예정 코드 (9개):
- checklist 관련 전부, wizard, mock-probes 등

유지되는 코드:
- `home/*`, `records/*`, `ui/*`, `lib/cooling.ts` 등

---

## 5. 다음 할 것 (순서)

| # | 작업 | 상세 |
|---|------|------|
| 1 | Auth/DB 구현 방식 확정 | 최소 로그인 방식 1개, 영구 저장소, 사용자별 데이터 분리 |
| 2 | Claude API 실제 연결 | `app/api/chat/route.ts` server action + Anthropic SDK (streaming, prompt caching) |
| 3 | 프롬프트 품질 반복 개선 | `ai-prompt-v1.md` 기반, 응답 품질 평가 + 반복 |
| 4 | 접근성 | WCAG 기본 준수 |
| 5 | 발표 자료 | 데모 시나리오 + 슬라이드 |

---

## 6. Phase 2 기술 계획

### Auth/Data 확장
- 이메일/비밀번호 로그인, 비밀번호 찾기, 계정 설정은 MVP 범위 밖
- 탈퇴/데이터 삭제 플로우는 Phase 2에서 설계
- 여러 OAuth provider 추가는 Phase 2에서 검토
- `chat_sessions` 테이블은 대화 세션 단위 분석이 필요해질 때 추가

### PWA
- `manifest.json` + Service Worker
- Web Push 알림 (냉각기 종료 알림)
- 오프라인 캐싱 전략 수립

---

## 7. 로컬 실행법

```bash
cd prototype
npm install
npm run dev
```

`http://localhost:3000`에서 확인.
