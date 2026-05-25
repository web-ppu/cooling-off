# E2E 테스트 (Playwright)

## 구조

```
tests/
├── auth.setup.ts        # 매직링크 로그인 → storageState 저장
├── unauth.spec.ts       # 비로그인 흐름 (홈/로그인/about)
├── core-flow.spec.ts    # 로그인 후 핵심 흐름 (등록·냉각·결정·기록)
├── helpers/
│   └── admin.ts         # Supabase service-role 클라이언트 + 시드 유틸
└── README.md
```

Playwright 프로젝트:
- `setup` → 인증 후 `.auth/user.json` 저장 (gitignored)
- `unauth` → 비로그인 스펙
- `e2e` → `setup` 의존, storageState 재사용

## 사전 준비

### 1) 환경변수 (`.env.test.local`)

```bash
# 앱과 동일
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 테스트 전용
SUPABASE_SERVICE_ROLE_KEY=...        # Supabase 대시보드 → Settings → API → service_role
E2E_TEST_USER_EMAIL=e2e@example.com  # 테스트 전용 이메일 (실사용자와 분리 권장)
```

`SUPABASE_SERVICE_ROLE_KEY` 는 **절대 클라이언트 코드에서 사용 금지**.
`.env.test.local` 은 `.gitignore` 에 의해 커밋되지 않는다.

### 2) Supabase 콘솔 설정

- **Auth → URL Configuration → Site URL**: `http://localhost:3000`
- **Auth → URL Configuration → Redirect URLs**: `http://localhost:3000/**` 추가
  (매직링크 redirect 가 통과되어야 한다.)

## 실행

```bash
# 전체 (setup → unauth → e2e)
npx playwright test

# 단일 프로젝트
npx playwright test --project=unauth
npx playwright test --project=e2e

# UI 모드 (디버깅)
npx playwright test --ui

# 리포트
npx playwright show-report
```

dev 서버가 이미 실행 중이면 그대로 재사용한다(`reuseExistingServer: true`).
실행 중이 아니면 Playwright 가 `npm run dev` 를 띄운다.

## 현재 알려진 실패/스킵 항목

| 테스트 | 상태 | 사유 |
|---|---|---|
| `core-flow ④ /chat/[id] 진입` | `test.fixme` | main 에 `/chat/[itemId]` 동적 라우트가 아직 없음 → 404. `feat/ai-chat-ui` 머지 후 활성화. |
| `core-flow ⑤ 기록 페이지` | `test.fixme` | `feat/history` 미머지 — main 의 `/history` 는 쉘만 존재. |

`test.fixme` 는 실행 시 "expected to fail" 로 표기되며, 통과해 버리면 빨간색으로 알려준다 → 기능 머지 시점에 자연스럽게 활성화 신호가 된다.

## 트러블슈팅

- `SUPABASE_SERVICE_ROLE_KEY 가 필요합니다` → `.env.test.local` 누락. Playwright 는 `dotenv` 를 자동 로드하지 않으므로 `npx dotenv -e .env.test.local -- playwright test` 또는 셸에서 export 후 실행.
- 매직링크 직후 `/auth/error` 로 이동 → Supabase Redirect URLs 화이트리스트 확인.
- `webServer timeout` → `npm run dev` 가 60초 안에 안 뜨는 경우. 미리 `npm run dev` 띄우고 다시 실행.
