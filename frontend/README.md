# Cooling off — Frontend

Cooling off 서비스의 프론트엔드 애플리케이션입니다. Next.js (App Router) 기반에 shadcn/ui 컴포넌트, TanStack Query, Tailwind CSS v4를 얹어 구성했습니다.

이 문서는 처음 합류한 개발자가 **5분 안에 로컬에서 dev 서버를 띄울 수 있도록** 작성했습니다.

---

## 1. 기술 스택

| 영역 | 사용 기술 | 버전 |
| --- | --- | --- |
| 프레임워크 | [Next.js](https://nextjs.org/) (App Router, React Compiler) | `16.x` |
| 런타임 | React | `19.x` |
| 언어 | TypeScript | `5.x` |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com/) | `v4` |
| UI 컴포넌트 | [shadcn/ui](https://ui.shadcn.com/) (`radix-nova` 스타일) | `4.x` |
| 아이콘 | [lucide-react](https://lucide.dev/) | `1.x` |
| 서버 상태 관리 | [TanStack Query](https://tanstack.com/query) (+ Devtools) | `v5` |
| 패키지 매니저 | **pnpm** | `>= 10` |
| Lint | ESLint (`eslint-config-next`) | `9.x` |

> Tailwind는 v4 기반이므로 별도의 `tailwind.config.js`가 없습니다. 디자인 토큰은 `src/app/globals.css` 안에서 `@theme` / CSS 변수로 정의합니다.

---

## 2. 사전 준비물

| 도구 | 권장 버전 | 비고 |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | `>= 20.x` (LTS) | `nvm` 사용 권장 |
| [pnpm](https://pnpm.io/) | `>= 10.x` | `corepack enable` 또는 `npm i -g pnpm` |
| Git | 최신 | — |

> **npm/yarn은 사용하지 마세요.** 락파일이 `pnpm-lock.yaml`이며, 빌드 스크립트 허용 정책도 pnpm 워크스페이스 설정(`pnpm-workspace.yaml`)에 묶여 있습니다.

---

## 3. 빠른 시작

```bash
# 1) 레포 클론
git clone <repo-url>
cd cooling-off/frontend

# 2) 의존성 설치
pnpm install

# 3) 개발 서버 실행
pnpm dev
```

서버가 뜨면 [http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 사용 가능한 스크립트

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 (HMR + React Query Devtools) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드된 산출물로 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 실행 |

---

## 4. 디렉토리 구조

```
frontend/
├── public/                 # 정적 에셋 (이미지, 아이콘 등)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # 루트 레이아웃 (Provider, 폰트, 메타데이터)
│   │   ├── page.tsx        # 인덱스 페이지 (`/`)
│   │   ├── provider.tsx    # TanStack Query Provider
│   │   ├── globals.css     # Tailwind + shadcn 테마 토큰 (CSS 변수)
│   │   └── favicon.ico
│   ├── components/
│   │   └── ui/             # shadcn 컴포넌트 설치 위치 (`button.tsx` 등)
│   └── lib/
│       └── utils.ts        # `cn()` 유틸 (clsx + tailwind-merge)
├── components.json         # shadcn CLI 설정
├── next.config.ts          # Next.js 설정 (React Compiler ON)
├── postcss.config.mjs      # Tailwind v4 PostCSS 플러그인
├── pnpm-workspace.yaml     # pnpm 빌드 스크립트 허용 목록
├── tsconfig.json           # `@/*` → `./src/*` 경로 alias
└── package.json
```

### 경로 별칭(Path alias)

`tsconfig.json`과 `components.json`에 다음 alias가 등록되어 있습니다.

| Alias | 실제 경로 |
| --- | --- |
| `@/*` | `src/*` |
| `@/components` | `src/components` |
| `@/components/ui` | `src/components/ui` |
| `@/lib` | `src/lib` |
| `@/lib/utils` | `src/lib/utils.ts` |
| `@/hooks` | `src/hooks` *(필요 시 생성)* |

---

## 5. shadcn/ui 컴포넌트 추가하기

`components.json`이 이미 `radix-nova` 스타일, `lucide` 아이콘, `neutral` 베이스 컬러로 설정되어 있습니다. 컴포넌트는 CLI로 추가합니다.

```bash
# 예: input, card 추가
pnpm dlx shadcn@latest add input card
```

추가된 파일은 `src/components/ui/` 아래에 생성됩니다. **직접 수정해도 무방합니다** (shadcn은 라이브러리가 아닌 코드 복사 방식이므로).

기본으로 설치된 `Button` 컴포넌트는 `src/components/ui/button.tsx` 에서 확인할 수 있고, `class-variance-authority` 기반의 `variant`/`size` 시스템을 사용합니다.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="outline" size="sm">클릭</Button>
```

---

## 6. TanStack Query 사용법

`src/app/layout.tsx`가 `TanstackProvider`로 전체 앱을 감싸고 있고, 개발 모드에서는 ReactQueryDevtools가 자동으로 마운트됩니다.

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  if (isLoading) return <p>로딩 중…</p>;
  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

> 클라이언트에서만 동작하는 hook이므로 `"use client"` 지시어가 필요한 컴포넌트에서 사용하세요.

---

## 7. 스타일링 (Tailwind v4 + 테마)

- **모든 디자인 토큰은 `src/app/globals.css` 의 `:root` / `.dark` 블록과 `@theme inline` 블록에 정의되어 있습니다.**
- 색상은 `oklch()` 기반이며, `--primary`, `--muted`, `--destructive` 등 shadcn 표준 토큰을 그대로 사용합니다.
- 다크 모드는 `.dark` 클래스 토글 방식 (`@custom-variant dark (&:is(.dark *))`).
- 클래스 합성에는 `cn()` 유틸을 사용하세요.

```tsx
import { cn } from "@/lib/utils";

<div className={cn("rounded-lg p-4", isActive && "bg-primary text-primary-foreground")} />
```

---

## 8. 자주 만나는 이슈

### `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: …`

pnpm 10+ 부터 보안상 패키지의 postinstall 빌드 스크립트가 기본 차단됩니다. 이 레포에서는 이미 `pnpm-workspace.yaml` 에서 `sharp`, `unrs-resolver`, `msw` 의 빌드를 허용하도록 등록해두었습니다.

새로운 패키지가 빌드 스크립트를 요구해서 같은 에러를 만난다면:

1. 패키지 신뢰 여부를 확인하고,
2. `pnpm-workspace.yaml` 의 `allowBuilds:` 항목에 추가한 뒤,
3. `pnpm install` 을 다시 실행하세요.

또는 `pnpm approve-builds` 를 인터랙티브로 실행해도 됩니다.

### `pnpm install` 후에도 변경사항이 적용 안 될 때

`.next/` 캐시를 삭제하고 다시 시도하세요.

```bash
rm -rf .next
pnpm dev
```

### IDE에서 `@/*` import가 빨간 줄로 표시될 때

TypeScript 서버를 재시작하세요. (VS Code: `Cmd+Shift+P` → `TypeScript: Restart TS Server`)

---

## 9. 코드 컨벤션 한 줄 요약

- 클라이언트 컴포넌트에만 `"use client"` 를 명시한다 (기본은 서버 컴포넌트).
- UI 컴포넌트는 `src/components/ui/` 아래, 도메인 컴포넌트는 `src/components/<도메인>/` 아래에 둔다.
- 클래스 결합은 항상 `cn()` 유틸을 거친다.
- 새 shadcn 컴포넌트는 손으로 만들지 말고 `pnpm dlx shadcn@latest add <name>` 로 추가한다.
- 서버 상태는 TanStack Query, 클라이언트 상태는 React 내장 hook으로 처리한다 (별도 글로벌 store는 도입 전).

---

## 10. 더 읽어보기

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [shadcn/ui 컴포넌트 카탈로그](https://ui.shadcn.com/docs/components)
- [TanStack Query 가이드](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Tailwind CSS v4 마이그레이션 노트](https://tailwindcss.com/docs/v4-beta)

프로젝트 전반의 기획/디자인 문서는 레포 루트의 `docs/` 디렉토리를 참고하세요.
