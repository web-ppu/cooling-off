# 쿨링오프 프로토타입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 쿨링오프 기획 문서의 MVP 핵심 루프(등록 → 대기 → 체크리스트 → 결정 → 기록)를 localStorage 기반 Next.js 프로토타입으로 구현하여, 화면을 손에 잡히는 상태로 만들고 기획을 역방향 보정한다.

**Architecture:** Next.js 16 App Router 단일 레포. 백엔드 없이 React Context + localStorage로 상태 영속화. shadcn/ui 컴포넌트를 DESIGN.md의 Notion 톤으로 커스터마이즈. 실제 타이머 대신 개발용 "냉각 완료 처리" 버튼으로 시뮬레이션.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Sonner, React Hook Form + Zod, Inter (Google Fonts)

**Reference Spec:** `docs/superpowers/specs/2026-04-11-cooling-off-prototype-design.md`

**Working Directory:** `/Users/musinsa/cooling-off/prototype/`

**Testing Policy:** 이 프로토타입은 테스트 코드를 작성하지 않는다 (스펙 Section 10 명시). 대신 각 Task 끝에 **브라우저 수동 검증 스텝**을 포함한다. 본 개발(5월)에서 테스트를 추가한다.

---

## File Structure

프로토타입 루트는 `prototype/`. 모든 경로는 이 루트 기준.

```
prototype/
├── app/
│   ├── layout.tsx                              # Inter, Sonner Toaster, ItemsProvider
│   ├── globals.css                             # Tailwind + DESIGN.md 디자인 토큰
│   ├── page.tsx                                # / 메인
│   ├── new/page.tsx                            # /new 등록
│   ├── items/[id]/checklist/[step]/page.tsx    # 체크리스트 7문항
│   ├── items/[id]/decide/page.tsx              # 결정 화면
│   └── records/page.tsx                        # /records 기록
├── components/
│   ├── ui/                                     # shadcn 컴포넌트 (auto-generated)
│   ├── item-card.tsx                           # 메인 카드
│   ├── empty-state.tsx                         # 빈 상태
│   ├── cooling-timer.tsx                       # 남은 시간 표시
│   ├── dev-complete-button.tsx                 # 개발용 냉각 완료 버튼
│   ├── decide-buttons.tsx                      # 좌우 대칭 [포기]/[구매]
│   └── answers-dialog.tsx                      # 답변 다시 보기 모달
├── lib/
│   ├── types.ts                                # Item, ChecklistAnswer, ItemStatus
│   ├── storage.ts                              # localStorage 추상화
│   ├── cooling.ts                              # 가격 → 냉각기 기간 계산
│   ├── format.ts                               # 원화/시간 포맷 헬퍼
│   └── questions.ts                            # 7개 체크리스트 질문 상수
├── contexts/
│   └── items-context.tsx                       # ItemsProvider + hooks
└── components.json                             # shadcn 설정 (auto-generated)
```

각 파일 책임:
- **lib/types.ts**: 도메인 타입만. Supabase 스키마(tech-design 4-1)와 필드명 일치.
- **lib/storage.ts**: localStorage 읽기/쓰기 + JSON 직렬화. 다른 레이어는 여기만 호출.
- **contexts/items-context.tsx**: React 상태 + storage 동기화. `useItems()`, `useAnswers()` 훅 제공.
- **components/** 하위는 presentational. 비즈니스 로직은 lib/contexts로.

---

## Task 1: shadcn/ui 셋업 및 디자인 토큰 주입

**Files:**
- Create: `prototype/components.json`
- Create: `prototype/components/ui/*` (자동 생성)
- Modify: `prototype/app/globals.css`
- Modify: `prototype/app/layout.tsx`
- Modify: `prototype/package.json` (의존성 추가)

- [ ] **Step 1: shadcn init (New York style, CSS variables)**

```bash
cd /Users/musinsa/cooling-off/prototype
npx shadcn@latest init --yes --defaults
```

Expected: `components.json` 생성, `app/globals.css` 업데이트, `lib/utils.ts` 생성, `tailwind.config` 확장.

- [ ] **Step 2: 필요한 shadcn 컴포넌트 설치**

```bash
npx shadcn@latest add button card dialog input label textarea sonner separator progress form
```

Expected: `components/ui/` 하위에 button.tsx, card.tsx, dialog.tsx, input.tsx, label.tsx, textarea.tsx, sonner.tsx, separator.tsx, progress.tsx, form.tsx 생성.

- [ ] **Step 3: React Hook Form + Zod + uuid 설치**

```bash
npm install react-hook-form @hookform/resolvers zod uuid
npm install -D @types/uuid
```

- [ ] **Step 4: DESIGN.md 색상 토큰 globals.css에 주입**

파일: `prototype/app/globals.css`

shadcn이 기본 생성한 `:root`와 `.dark` 블록에서 쿨링오프용 커스텀 변수만 **추가**한다. 기존 shadcn 변수는 그대로 둔다.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.75rem;

  /* shadcn 기본 변수는 건드리지 않고, 쿨링오프 커스텀 변수를 추가 */
  --co-bg: #ffffff;
  --co-bg-alt: #f6f5f4;
  --co-text: rgba(0, 0, 0, 0.95);
  --co-text-secondary: #615d59;
  --co-text-muted: #a39e98;
  --co-primary: #0075de;
  --co-primary-active: #005bab;
  --co-border: rgba(0, 0, 0, 0.1);
  --co-badge-bg: #f2f9ff;
  --co-badge-text: #097fe8;
  --co-decide-bg: rgba(0, 0, 0, 0.05);

  /* shadcn의 background/foreground를 쿨링오프 팔레트로 오버라이드 */
  --background: #ffffff;
  --foreground: rgba(0, 0, 0, 0.95);
  --muted: #f6f5f4;
  --muted-foreground: #615d59;
  --border: rgba(0, 0, 0, 0.1);
  --primary: #0075de;
  --primary-foreground: #ffffff;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --font-sans: var(--font-inter);
}

body {
  background: var(--co-bg);
  color: var(--co-text);
  font-feature-settings: "lnum", "locl";
}

/* Notion whisper border + 4-layer card shadow */
.co-card {
  background: #ffffff;
  border: 1px solid var(--co-border);
  border-radius: 12px;
  box-shadow:
    rgba(0, 0, 0, 0.04) 0px 4px 18px,
    rgba(0, 0, 0, 0.027) 0px 2.025px 7.84688px,
    rgba(0, 0, 0, 0.02) 0px 0.8px 2.925px,
    rgba(0, 0, 0, 0.01) 0px 0.175px 1.04062px;
}

/* Display 타이포 (절약 금액, 히어로) */
.co-display {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.5px;
}
.co-display-lg {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -2.125px;
}

/* 결정 화면의 좌우 대칭 secondary 버튼 */
.co-decide-btn {
  background: var(--co-decide-bg);
  color: var(--co-text);
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 24px 0;
  font-size: 18px;
  font-weight: 600;
  transition: background 0.15s;
}
.co-decide-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

/* 상태 pill */
.co-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--co-badge-bg);
  color: var(--co-badge-text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.125px;
}
```

- [ ] **Step 5: Inter 폰트 + 메타데이터 layout.tsx에 주입**

파일: `prototype/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "쿨링오프 — 사기 전에 한 번 식히기",
  description: "충동구매를 줄이는 냉각기 + 편향 체크리스트",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: 개발 서버 기동 검증**

```bash
cd /Users/musinsa/cooling-off/prototype
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.
Expected: Next.js 기본 페이지가 흰 배경에 Inter 폰트로 렌더링됨. 콘솔 에러 없음. (스타일은 아직 적용 안 된 기본 Next 페이지 OK)

- [ ] **Step 7: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/
git commit -m "feat(prototype): shadcn/ui + 디자인 토큰 셋업

- shadcn init (New York, CSS variables)
- button/card/dialog/input/label/textarea/sonner/separator/progress/form 설치
- react-hook-form + zod + uuid 설치
- DESIGN.md의 Notion 팔레트를 globals.css 커스텀 변수로 주입
- Inter 폰트 layout.tsx에 연결
- Sonner Toaster 루트 배치

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 도메인 타입 및 상수

**Files:**
- Create: `prototype/lib/types.ts`
- Create: `prototype/lib/questions.ts`
- Create: `prototype/lib/cooling.ts`
- Create: `prototype/lib/format.ts`

- [ ] **Step 1: types.ts 작성**

파일: `prototype/lib/types.ts`

```typescript
export type ItemStatus =
  | "cooling"    // 냉각기 대기 중
  | "ready"      // 냉각 완료, 결정 대기
  | "purchased"  // 구매 결정
  | "passed"     // 포기 결정
  | "deleted";   // 삭제됨 (수동 or 48h 자동)

export interface Item {
  id: string;
  user_id: "local";
  name: string;
  price: number;
  url?: string;
  memo?: string;
  status: ItemStatus;
  cooling_until: string; // ISO timestamp
  created_at: string;    // ISO timestamp
  decided_at?: string;   // ISO timestamp
}

export type QuestionNo = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ChecklistAnswer {
  id: string;
  item_id: string;
  question_no: QuestionNo;
  answer: string;
  answered_at: string; // ISO timestamp
}
```

- [ ] **Step 2: questions.ts 작성**

파일: `prototype/lib/questions.ts`

```typescript
import type { QuestionNo } from "./types";

export interface Question {
  no: QuestionNo;
  text: string;
  bias: string; // 겨냥하는 편향 (표시용)
}

export const QUESTIONS: readonly Question[] = [
  { no: 1, text: "지금 감정 상태가 평소와 같아?", bias: "감정적 구매" },
  { no: 2, text: "이미 가진 것 중에 같은 역할을 하는 게 있어?", bias: "대안 평가 생략" },
  { no: 3, text: "이걸 사지 말아야 할 이유 3가지는?", bias: "확증 편향" },
  { no: 4, text: "친구가 이걸 사겠다고 하면 뭐라고 조언할 건가?", bias: "감정적 몰입 (솔로몬 역설)" },
  { no: 5, text: "이 금액이면 대신 뭘 할 수 있어?", bias: "기회비용 무시" },
  { no: 6, text: "6개월 후에도 이 물건을 쓰고 있을까?", bias: "현재 편향" },
  { no: 7, text: "이번 달 예산에서 이걸 빼도 계획대로 괜찮아?", bias: "mental accounting" },
] as const;

export function getQuestion(no: QuestionNo): Question {
  return QUESTIONS[no - 1];
}
```

- [ ] **Step 3: cooling.ts 작성**

파일: `prototype/lib/cooling.ts`

```typescript
// PRD 5. 가격별 냉각기 기본값
export interface CoolingRule {
  maxPrice: number;
  hours: number;
  label: string;
}

const RULES: CoolingRule[] = [
  { maxPrice: 50_000, hours: 24, label: "24시간" },
  { maxPrice: 100_000, hours: 48, label: "48시간" },
  { maxPrice: 300_000, hours: 24 * 7, label: "7일" },
  { maxPrice: 1_000_000, hours: 24 * 14, label: "14일" },
  { maxPrice: Infinity, hours: 24 * 30, label: "30일" },
];

export function calculateCooling(price: number): CoolingRule {
  return RULES.find((r) => price <= r.maxPrice) ?? RULES[RULES.length - 1];
}

export function coolingUntilFromNow(price: number, now: Date = new Date()): string {
  const rule = calculateCooling(price);
  const until = new Date(now.getTime() + rule.hours * 60 * 60 * 1000);
  return until.toISOString();
}
```

- [ ] **Step 4: format.ts 작성**

파일: `prototype/lib/format.ts`

```typescript
export function formatKRW(price: number): string {
  return `₩${price.toLocaleString("ko-KR")}`;
}

/**
 * 남은 시간 렌더링 규칙 (Story Map 2.1):
 *   - 1일 이상: "N일 N시간"
 *   - 1일 미만: "N시간 N분"
 *   - 완료: "냉각 완료"
 */
export function formatRemaining(coolingUntilISO: string, now: Date = new Date()): string {
  const until = new Date(coolingUntilISO).getTime();
  const diffMs = until - now.getTime();
  if (diffMs <= 0) return "냉각 완료";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 1) return `${days}일 ${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

/**
 * "N일 기다렸어" — 체크리스트 상단 카피용
 */
export function formatWaitedDuration(createdAtISO: string, coolingUntilISO: string): string {
  const created = new Date(createdAtISO).getTime();
  const until = new Date(coolingUntilISO).getTime();
  const diffHours = Math.round((until - created) / (60 * 60 * 1000));
  if (diffHours >= 24) return `${Math.round(diffHours / 24)}일 기다렸어`;
  return `${diffHours}시간 기다렸어`;
}
```

- [ ] **Step 5: 타입 체크**

```bash
cd /Users/musinsa/cooling-off/prototype
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/lib/
git commit -m "feat(prototype): 도메인 타입 · 질문 · 냉각기 계산 · 포맷 유틸

- types: Item, ChecklistAnswer, ItemStatus (tech-design 4-1 스키마와 동일)
- questions: 7개 체크리스트 질문 상수 (편향 정보 포함)
- cooling: 가격 5구간별 냉각기 계산
- format: 원화, 남은 시간, 기다린 시간 포맷 헬퍼

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Storage 추상화

**Files:**
- Create: `prototype/lib/storage.ts`

- [ ] **Step 1: storage.ts 작성**

파일: `prototype/lib/storage.ts`

```typescript
import type { Item, ChecklistAnswer } from "./types";

const ITEMS_KEY = "cooling-off:items";
const ANSWERS_KEY = "cooling-off:checklist_answers";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadItems(): Item[] {
  return readJSON<Item[]>(ITEMS_KEY, []);
}

export function saveItems(items: Item[]): void {
  writeJSON(ITEMS_KEY, items);
}

export function loadAnswers(): ChecklistAnswer[] {
  return readJSON<ChecklistAnswer[]>(ANSWERS_KEY, []);
}

export function saveAnswers(answers: ChecklistAnswer[]): void {
  writeJSON(ANSWERS_KEY, answers);
}

/** 전체 초기화 (개발용) */
export function resetAll(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ITEMS_KEY);
  localStorage.removeItem(ANSWERS_KEY);
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /Users/musinsa/cooling-off/prototype && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/lib/storage.ts
git commit -m "feat(prototype): localStorage 추상화 레이어

- loadItems/saveItems, loadAnswers/saveAnswers
- SSR-safe (window 체크)
- JSON 파싱 실패 시 fallback
- resetAll 개발용 유틸

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ItemsContext — 상태 관리 레이어

**Files:**
- Create: `prototype/contexts/items-context.tsx`
- Modify: `prototype/app/layout.tsx`

- [ ] **Step 1: ItemsContext 작성**

파일: `prototype/contexts/items-context.tsx`

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import type { Item, ItemStatus, ChecklistAnswer, QuestionNo } from "@/lib/types";
import {
  loadItems,
  saveItems,
  loadAnswers,
  saveAnswers,
} from "@/lib/storage";
import { coolingUntilFromNow } from "@/lib/cooling";

interface ItemsContextValue {
  items: Item[];
  answers: ChecklistAnswer[];
  addItem: (input: {
    name: string;
    price: number;
    url?: string;
    memo?: string;
  }) => Item;
  deleteItem: (id: string) => void;
  /** 개발용: 냉각기를 즉시 완료시킴 */
  markReady: (id: string) => void;
  decideItem: (id: string, decision: "purchased" | "passed") => void;
  upsertAnswer: (
    itemId: string,
    questionNo: QuestionNo,
    answer: string
  ) => void;
  getAnswersForItem: (itemId: string) => ChecklistAnswer[];
  getItem: (id: string) => Item | undefined;
}

const ItemsContext = createContext<ItemsContextValue | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<ChecklistAnswer[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 최초 마운트 시 localStorage 로드
  useEffect(() => {
    setItems(loadItems());
    setAnswers(loadAnswers());
    setHydrated(true);
  }, []);

  // 상태 변경 시 localStorage 동기화 (hydrate 이후만)
  useEffect(() => {
    if (hydrated) saveItems(items);
  }, [items, hydrated]);
  useEffect(() => {
    if (hydrated) saveAnswers(answers);
  }, [answers, hydrated]);

  // 남은 시간 자동 상태 전이 (cooling → ready)
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => {
      const now = Date.now();
      setItems((prev) =>
        prev.map((it) =>
          it.status === "cooling" &&
          new Date(it.cooling_until).getTime() <= now
            ? { ...it, status: "ready" }
            : it
        )
      );
    };
    tick();
    const id = setInterval(tick, 30_000); // 30초마다 체크
    return () => clearInterval(id);
  }, [hydrated]);

  const addItem = useCallback<ItemsContextValue["addItem"]>((input) => {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: uuid(),
      user_id: "local",
      name: input.name,
      price: input.price,
      url: input.url,
      memo: input.memo,
      status: "cooling",
      cooling_until: coolingUntilFromNow(input.price),
      created_at: now,
    };
    setItems((prev) => [...prev, newItem]);
    return newItem;
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "deleted" } : it))
    );
  }, []);

  const markReady = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: "ready", cooling_until: new Date().toISOString() }
          : it
      )
    );
  }, []);

  const decideItem = useCallback<ItemsContextValue["decideItem"]>(
    (id, decision) => {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: decision, decided_at: now } : it
        )
      );
    },
    []
  );

  const upsertAnswer = useCallback<ItemsContextValue["upsertAnswer"]>(
    (itemId, questionNo, answer) => {
      setAnswers((prev) => {
        const existing = prev.find(
          (a) => a.item_id === itemId && a.question_no === questionNo
        );
        const now = new Date().toISOString();
        if (existing) {
          return prev.map((a) =>
            a.id === existing.id ? { ...a, answer, answered_at: now } : a
          );
        }
        return [
          ...prev,
          {
            id: uuid(),
            item_id: itemId,
            question_no: questionNo,
            answer,
            answered_at: now,
          },
        ];
      });
    },
    []
  );

  const getAnswersForItem = useCallback(
    (itemId: string) =>
      answers
        .filter((a) => a.item_id === itemId)
        .sort((a, b) => a.question_no - b.question_no),
    [answers]
  );

  const getItem = useCallback(
    (id: string) => items.find((it) => it.id === id),
    [items]
  );

  const value = useMemo<ItemsContextValue>(
    () => ({
      items,
      answers,
      addItem,
      deleteItem,
      markReady,
      decideItem,
      upsertAnswer,
      getAnswersForItem,
      getItem,
    }),
    [
      items,
      answers,
      addItem,
      deleteItem,
      markReady,
      decideItem,
      upsertAnswer,
      getAnswersForItem,
      getItem,
    ]
  );

  return (
    <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
  );
}

export function useItems(): ItemsContextValue {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used within ItemsProvider");
  return ctx;
}
```

- [ ] **Step 2: layout.tsx에 Provider 장착**

파일: `prototype/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ItemsProvider } from "@/contexts/items-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "쿨링오프 — 사기 전에 한 번 식히기",
  description: "충동구매를 줄이는 냉각기 + 편향 체크리스트",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ItemsProvider>{children}</ItemsProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
cd /Users/musinsa/cooling-off/prototype && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/contexts/ prototype/app/layout.tsx
git commit -m "feat(prototype): ItemsContext + Provider

- CRUD (addItem/deleteItem/markReady/decideItem)
- 답변 upsert
- 마운트 시 localStorage hydrate, 변경 시 동기화
- 30초마다 cooling→ready 자동 전이
- layout.tsx에 Provider 장착

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 메인 화면 (`/`)

**Files:**
- Create: `prototype/components/item-card.tsx`
- Create: `prototype/components/empty-state.tsx`
- Create: `prototype/components/cooling-timer.tsx`
- Create: `prototype/components/dev-complete-button.tsx`
- Modify: `prototype/app/page.tsx`

- [ ] **Step 1: cooling-timer.tsx**

파일: `prototype/components/cooling-timer.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/format";

export function CoolingTimer({ coolingUntil }: { coolingUntil: string }) {
  const [label, setLabel] = useState(() => formatRemaining(coolingUntil));
  useEffect(() => {
    const id = setInterval(() => setLabel(formatRemaining(coolingUntil)), 60_000);
    return () => clearInterval(id);
  }, [coolingUntil]);
  return <span className="text-sm text-[color:var(--co-text-secondary)]">{label}</span>;
}
```

- [ ] **Step 2: dev-complete-button.tsx**

파일: `prototype/components/dev-complete-button.tsx`

```tsx
"use client";
import { useItems } from "@/contexts/items-context";
import { Button } from "@/components/ui/button";

export function DevCompleteButton({ itemId }: { itemId: string }) {
  const { markReady } = useItems();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => markReady(itemId)}
      className="text-xs"
      title="프로토타입 전용: 냉각기를 즉시 완료 처리"
    >
      [개발] 냉각 완료 처리
    </Button>
  );
}
```

- [ ] **Step 3: item-card.tsx**

파일: `prototype/components/item-card.tsx`

```tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import type { Item } from "@/lib/types";
import { formatKRW } from "@/lib/format";
import { CoolingTimer } from "./cooling-timer";
import { DevCompleteButton } from "./dev-complete-button";
import { useItems } from "@/contexts/items-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ItemCard({ item }: { item: Item }) {
  const { deleteItem } = useItems();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isReady = item.status === "ready";

  return (
    <div className="co-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[22px] font-bold tracking-[-0.25px] leading-tight truncate">
            {item.name}
          </h3>
          <p className="text-base font-medium mt-1">{formatKRW(item.price)}</p>
        </div>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="메뉴">⋯</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>정말 삭제할까요?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[color:var(--co-text-secondary)]">
              &ldquo;{item.name}&rdquo;을(를) 삭제합니다. 기록 페이지에서는 &ldquo;삭제됨&rdquo;으로 남아요.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteItem(item.id);
                  setConfirmOpen(false);
                }}
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        {isReady ? (
          <span className="co-pill">결정 대기</span>
        ) : (
          <CoolingTimer coolingUntil={item.cooling_until} />
        )}
        {isReady ? (
          <Link
            href={`/items/${item.id}/checklist/1`}
            className="text-[15px] font-semibold text-[color:var(--co-primary)] hover:underline"
          >
            결정하기 →
          </Link>
        ) : (
          <DevCompleteButton itemId={item.id} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: empty-state.tsx**

파일: `prototype/components/empty-state.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="co-card p-12 flex flex-col items-center text-center gap-4">
      <h2 className="text-[26px] font-bold tracking-[-0.625px] leading-tight">
        첫 상품을 등록해보세요
      </h2>
      <p className="text-[color:var(--co-text-secondary)] max-w-sm">
        사고 싶은 걸 일단 여기 넣어. 가격에 맞춰 자동으로 기다린 다음, 7개 질문 거치고 결정해.
      </p>
      <Button asChild className="mt-2">
        <Link href="/new">+ 등록하기</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: app/page.tsx (메인)**

파일: `prototype/app/page.tsx`

```tsx
"use client";
import Link from "next/link";
import { useItems } from "@/contexts/items-context";
import { ItemCard } from "@/components/item-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { items } = useItems();
  const cooling = items.filter((it) => it.status === "cooling");
  const ready = items.filter((it) => it.status === "ready");
  const isEmpty = cooling.length === 0 && ready.length === 0;

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-5 pt-12 pb-32">
      <header className="mb-10">
        <h1 className="co-display tracking-[-1.5px]">쿨링오프</h1>
        <p className="mt-2 text-[color:var(--co-text-secondary)] text-lg">
          사기 전에 한 번 식히기
        </p>
      </header>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-10">
          {cooling.length > 0 && (
            <section>
              <h2 className="text-[22px] font-bold tracking-[-0.25px] mb-4">
                🧊 냉각 중 ({cooling.length}건)
              </h2>
              <div className="flex flex-col gap-4">
                {cooling.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            </section>
          )}
          {ready.length > 0 && (
            <section>
              <h2 className="text-[22px] font-bold tracking-[-0.25px] mb-4">
                ✅ 결정 대기 ({ready.length}건)
              </h2>
              <div className="flex flex-col gap-4">
                {ready.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:static md:mt-10 md:translate-x-0">
        <Button asChild size="lg" className="shadow-lg md:shadow-none">
          <Link href="/new">+ 등록하기</Link>
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: 브라우저 수동 검증**

```bash
cd /Users/musinsa/cooling-off/prototype && npm run dev
```

브라우저 `http://localhost:3000`:
- [ ] 빈 상태로 시작 → "첫 상품을 등록해보세요" 큰 문구 + [+ 등록하기] CTA가 카드 안에 렌더링
- [ ] 상단 "쿨링오프" 48px display + 서브카피 렌더링
- [ ] 하단 FAB [+ 등록하기] 고정 (모바일), 768px 이상에서는 in-flow
- [ ] 콘솔 에러 없음

(아이템이 없어서 카드 자체는 아직 안 보임. Task 6에서 /new 만든 뒤 돌아와서 재검증)

- [ ] **Step 7: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/components/ prototype/app/page.tsx
git commit -m "feat(prototype): 메인 화면 + ItemCard + EmptyState

- /: 냉각 중 / 결정 대기 그룹 카드 리스트
- ItemCard: 상품명·가격·남은 시간·[개발] 냉각 완료 버튼·삭제 다이얼로그
- EmptyState: '첫 상품을 등록해보세요' 초대형 카드
- CoolingTimer: 1분마다 남은 시간 갱신
- FAB [+ 등록하기] (모바일 고정, PC in-flow)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 등록 화면 (`/new`)

**Files:**
- Create: `prototype/app/new/page.tsx`

- [ ] **Step 1: 등록 폼 구현**

파일: `prototype/app/new/page.tsx`

```tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useItems } from "@/contexts/items-context";
import { calculateCooling } from "@/lib/cooling";
import { formatKRW } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1, "상품명을 입력해주세요"),
  price: z
    .number({ invalid_type_error: "숫자를 입력해주세요" })
    .int()
    .positive("0보다 큰 금액을 입력해주세요"),
  url: z.string().url("유효한 URL").optional().or(z.literal("")),
  memo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewItemPage() {
  const router = useRouter();
  const { addItem } = useItems();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0, url: "", memo: "" },
  });

  const price = watch("price");
  const coolingRule =
    typeof price === "number" && price > 0 ? calculateCooling(price) : null;

  const onSubmit = async (values: FormValues) => {
    addItem({
      name: values.name,
      price: values.price,
      url: values.url || undefined,
      memo: values.memo || undefined,
    });
    toast("등록됐어요");
    router.push("/");
  };

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 pt-10 pb-24">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-[color:var(--co-text-secondary)] hover:underline"
        >
          ← 돌아가기
        </Link>
      </div>

      <h1 className="text-[32px] font-bold tracking-[-1px] leading-tight mb-8">
        사고 싶은 걸 넣어보자
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">상품명</Label>
          <Input id="name" placeholder="예: 운동화" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="price">가격 (원)</Label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            placeholder="129000"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price.message}</p>
          )}
          {coolingRule && (
            <p className="text-sm text-[color:var(--co-primary)] font-medium">
              → 냉각기: {coolingRule.label} ({formatKRW(price)})
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="url">
            URL <span className="text-[color:var(--co-text-muted)]">(선택)</span>
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            {...register("url")}
          />
          {errors.url && (
            <p className="text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="memo">
            메모 <span className="text-[color:var(--co-text-muted)]">(선택)</span>
          </Label>
          <Textarea
            id="memo"
            rows={3}
            placeholder="왜 사고 싶은지 적어둬도 좋아"
            {...register("memo")}
          />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-4">
          냉각 시작하기
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: 브라우저 수동 검증**

개발 서버가 돌고 있는지 확인 (`npm run dev`).

`http://localhost:3000/new`:
- [ ] 폼 렌더링 OK
- [ ] 상품명 비우고 제출 → "상품명을 입력해주세요" 에러
- [ ] 가격 30000 입력 → "→ 냉각기: 24시간 (₩30,000)"
- [ ] 가격 150000 입력 → "→ 냉각기: 7일 (₩150,000)"
- [ ] 가격 1500000 입력 → "→ 냉각기: 30일"
- [ ] 정상 제출 → "등록됐어요" 토스트 + `/`로 이동
- [ ] 메인에 새 아이템이 "🧊 냉각 중" 섹션에 렌더링됨

- [ ] **Step 3: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/app/new/
git commit -m "feat(prototype): 상품 등록 화면 (/new)

- React Hook Form + Zod validation
- 가격 입력 시 실시간 냉각기 기간 계산 표시
- 제출 시 ItemsContext.addItem → '/' 리다이렉트
- 중립적 토스트 '등록됐어요'

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 체크리스트 화면 (`/items/[id]/checklist/[step]`)

**Files:**
- Create: `prototype/app/items/[id]/checklist/[step]/page.tsx`

- [ ] **Step 1: 체크리스트 페이지 구현**

파일: `prototype/app/items/[id]/checklist/[step]/page.tsx`

```tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useItems } from "@/contexts/items-context";
import { getQuestion, QUESTIONS } from "@/lib/questions";
import type { QuestionNo } from "@/lib/types";
import { formatKRW, formatWaitedDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export default function ChecklistStepPage() {
  const params = useParams<{ id: string; step: string }>();
  const router = useRouter();
  const { getItem, getAnswersForItem, upsertAnswer } = useItems();

  const item = getItem(params.id);
  const stepNum = Number(params.step);
  const isValidStep =
    Number.isInteger(stepNum) && stepNum >= 1 && stepNum <= 7;

  const [draft, setDraft] = useState("");

  // 기존 답변 로드
  useEffect(() => {
    if (!item || !isValidStep) return;
    const existing = getAnswersForItem(item.id).find(
      (a) => a.question_no === (stepNum as QuestionNo)
    );
    setDraft(existing?.answer ?? "");
  }, [item?.id, stepNum, isValidStep, getAnswersForItem, item]);

  if (!item) {
    return (
      <main className="min-h-screen max-w-xl mx-auto px-5 pt-16 text-center">
        <p className="text-[color:var(--co-text-secondary)]">
          아이템을 찾을 수 없어요.
        </p>
        <Button variant="link" onClick={() => router.push("/")}>
          메인으로
        </Button>
      </main>
    );
  }

  if (!isValidStep) {
    return (
      <main className="min-h-screen max-w-xl mx-auto px-5 pt-16 text-center">
        <p className="text-[color:var(--co-text-secondary)]">
          잘못된 질문 번호입니다.
        </p>
      </main>
    );
  }

  const question = getQuestion(stepNum as QuestionNo);
  const total = QUESTIONS.length;
  const progress = (stepNum / total) * 100;

  const saveDraft = () => {
    upsertAnswer(item.id, stepNum as QuestionNo, draft);
  };

  const goNext = () => {
    saveDraft();
    if (stepNum === total) {
      router.push(`/items/${item.id}/decide`);
    } else {
      router.push(`/items/${item.id}/checklist/${stepNum + 1}`);
    }
  };

  const goPrev = () => {
    saveDraft();
    if (stepNum > 1) {
      router.push(`/items/${item.id}/checklist/${stepNum - 1}`);
    }
  };

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 pt-10 pb-16 flex flex-col">
      <header className="mb-8">
        <h2 className="text-[22px] font-bold tracking-[-0.25px]">
          {item.name} · {formatKRW(item.price)}
        </h2>
        <p className="mt-1 text-[color:var(--co-text-secondary)]">
          {formatWaitedDuration(item.created_at, item.cooling_until)}. 아직도 원해?
        </p>
      </header>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-[color:var(--co-text-secondary)] mb-2">
          <span>
            {stepNum}/{total}
          </span>
          <span>{question.bias}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="co-card p-6 flex-1 flex flex-col">
        <h3 className="text-[20px] font-semibold leading-snug mb-4">
          {question.text}
        </h3>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveDraft}
          rows={6}
          placeholder="떠오르는 대로 적어봐"
          className="flex-1 resize-none"
        />
      </div>

      <div className="flex gap-3 mt-6">
        {stepNum > 1 ? (
          <Button type="button" variant="outline" onClick={goPrev} className="flex-1">
            ← 이전
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        <Button type="button" onClick={goNext} className="flex-1">
          {stepNum === total ? "결정하기 →" : "다음 →"}
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 브라우저 수동 검증**

메인에서 아이템 하나에 "[개발] 냉각 완료 처리" 클릭 → "결정 대기"로 이동 → "결정하기 →" 클릭.

`http://localhost:3000/items/<id>/checklist/1`:
- [ ] 상단 "{상품명} · ₩XXX,XXX" + "N일 기다렸어. 아직도 원해?" 렌더링
- [ ] 1/7 progress + 첫 질문 "지금 감정 상태가 평소와 같아?" 표시
- [ ] Textarea에 입력 후 [다음 →] → step 2로 이동
- [ ] 브라우저 새로고침 → 답변 그대로 (localStorage 복원)
- [ ] [← 이전] → step 1로 이동, 이전 답변 그대로
- [ ] step 7에서 [결정하기 →] → `/items/<id>/decide`로 이동

- [ ] **Step 3: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/app/items/
git commit -m "feat(prototype): 체크리스트 화면 (7문항 독립 라우트)

- /items/[id]/checklist/[step]: step별 URL 분리 (새로고침 견딤)
- 진행도 Progress 바 + 편향 레이블
- 답변 onBlur + 페이지 이동 시 저장
- 기존 답변 자동 로드
- step 7 완료 시 /decide로 이동

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 결정 화면 (`/items/[id]/decide`)

**Files:**
- Create: `prototype/components/decide-buttons.tsx`
- Create: `prototype/app/items/[id]/decide/page.tsx`

- [ ] **Step 1: decide-buttons.tsx — 좌우 대칭**

파일: `prototype/components/decide-buttons.tsx`

```tsx
"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useItems } from "@/contexts/items-context";

/**
 * 톤 원칙: [포기]와 [구매] 버튼은 완벽 좌우 대칭.
 * 둘 다 동일한 secondary gray 스타일. 어느 쪽도 Primary Blue가 아님.
 */
export function DecideButtons({ itemId }: { itemId: string }) {
  const { decideItem } = useItems();
  const router = useRouter();

  const handleDecide = (decision: "passed" | "purchased") => {
    decideItem(itemId, decision);
    router.push("/");
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <button
        type="button"
        className="co-decide-btn"
        onClick={() => handleDecide("passed")}
      >
        포기
      </button>
      <button
        type="button"
        className="co-decide-btn"
        onClick={() => handleDecide("purchased")}
      >
        구매
      </button>
    </div>
  );
}
```

- [ ] **Step 2: decide 페이지**

파일: `prototype/app/items/[id]/decide/page.tsx`

```tsx
"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/contexts/items-context";
import { formatKRW, formatWaitedDuration } from "@/lib/format";
import { getQuestion } from "@/lib/questions";
import type { QuestionNo } from "@/lib/types";
import { DecideButtons } from "@/components/decide-buttons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function DecidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getItem, getAnswersForItem } = useItems();
  const item = getItem(params.id);

  if (!item) {
    return (
      <main className="min-h-screen max-w-xl mx-auto px-5 pt-16 text-center">
        <p className="text-[color:var(--co-text-secondary)]">
          아이템을 찾을 수 없어요.
        </p>
        <Button variant="link" onClick={() => router.push("/")}>
          메인으로
        </Button>
      </main>
    );
  }

  const answers = getAnswersForItem(item.id);

  return (
    <main className="min-h-screen max-w-xl mx-auto px-5 pt-10 pb-16 flex flex-col">
      <header className="mb-8">
        <h1 className="text-[26px] font-bold tracking-[-0.625px] leading-tight">
          {item.name}
        </h1>
        <p className="mt-1 text-[color:var(--co-text-secondary)] text-lg">
          {formatKRW(item.price)} ·{" "}
          {formatWaitedDuration(item.created_at, item.cooling_until)}
        </p>
      </header>

      {answers.length > 0 && (
        <Accordion type="single" collapsible className="mb-10">
          <AccordionItem value="answers">
            <AccordionTrigger>
              기록된 답변 {answers.length}개
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                {answers.map((a) => {
                  const q = getQuestion(a.question_no as QuestionNo);
                  return (
                    <div key={a.id} className="co-card p-4">
                      <p className="text-sm font-semibold text-[color:var(--co-text-secondary)] mb-1">
                        {a.question_no}. {q.text}
                      </p>
                      <p className="text-base whitespace-pre-wrap">
                        {a.answer || <em className="text-[color:var(--co-text-muted)]">답변 없음</em>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="mt-auto">
        <p className="text-center text-[color:var(--co-text-secondary)] mb-6">
          이제 결정해볼까?
        </p>
        <DecideButtons itemId={item.id} />
        <div className="text-center mt-4">
          <Link
            href={`/items/${item.id}/checklist/7`}
            className="text-sm text-[color:var(--co-text-muted)] hover:underline"
          >
            체크리스트로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Accordion 컴포넌트 설치 (누락)**

```bash
cd /Users/musinsa/cooling-off/prototype
npx shadcn@latest add accordion
```

- [ ] **Step 4: 브라우저 수동 검증**

`http://localhost:3000/items/<id>/decide`:
- [ ] 상단에 상품명·가격·기다린 시간 렌더링
- [ ] "기록된 답변 N개" accordion 클릭 → 체크리스트 답변 나열
- [ ] [포기] / [구매] 버튼이 **동일 크기·색**으로 좌우 대칭 렌더링 (Notion Blue 아님)
- [ ] [포기] 클릭 → `/`로 이동, 메인에서 해당 아이템 안 보임 (status='passed')
- [ ] 다시 test: [구매] 클릭 → `/`로 이동, 메인에서 해당 아이템 안 보임 (status='purchased')

- [ ] **Step 5: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/
git commit -m "feat(prototype): 결정 화면 + 좌우 대칭 [포기]/[구매]

- /items/[id]/decide
- DecideButtons: 완벽 좌우 대칭 secondary gray (톤 원칙 시각 구현)
- 기록된 답변 accordion으로 다시 보기
- 결정 후 메인 이동
- shadcn accordion 추가

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 기록 화면 (`/records`)

**Files:**
- Create: `prototype/components/answers-dialog.tsx`
- Create: `prototype/app/records/page.tsx`
- Modify: `prototype/app/page.tsx` (기록 페이지 링크 추가)

- [ ] **Step 1: answers-dialog.tsx — 답변 다시 보기 모달**

파일: `prototype/components/answers-dialog.tsx`

```tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useItems } from "@/contexts/items-context";
import { getQuestion } from "@/lib/questions";
import { formatKRW } from "@/lib/format";
import type { Item, QuestionNo } from "@/lib/types";

export function AnswersDialog({
  item,
  trigger,
}: {
  item: Item;
  trigger: React.ReactNode;
}) {
  const { getAnswersForItem } = useItems();
  const answers = getAnswersForItem(item.id);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item.name} · {formatKRW(item.price)}
          </DialogTitle>
        </DialogHeader>
        {answers.length === 0 ? (
          <p className="text-sm text-[color:var(--co-text-muted)]">
            체크리스트 답변이 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {answers.map((a) => {
              const q = getQuestion(a.question_no as QuestionNo);
              return (
                <div key={a.id}>
                  <p className="text-sm font-semibold text-[color:var(--co-text-secondary)] mb-1">
                    {a.question_no}. {q.text}
                  </p>
                  <p className="text-base whitespace-pre-wrap">
                    {a.answer || (
                      <em className="text-[color:var(--co-text-muted)]">
                        답변 없음
                      </em>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: records 페이지**

파일: `prototype/app/records/page.tsx`

```tsx
"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useItems } from "@/contexts/items-context";
import { formatKRW } from "@/lib/format";
import { AnswersDialog } from "@/components/answers-dialog";
import { Button } from "@/components/ui/button";

export default function RecordsPage() {
  const { items } = useItems();

  const thisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const decided = items.filter((it) => {
      if (!it.decided_at && it.status !== "deleted") return false;
      const date = new Date(it.decided_at ?? it.created_at);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const saved = decided
      .filter((it) => it.status === "passed" || it.status === "deleted")
      .reduce((sum, it) => sum + it.price, 0);

    const total = decided.length;
    const passedCount = decided.filter(
      (it) => it.status === "passed" || it.status === "deleted"
    ).length;
    const passRate =
      total === 0 ? 0 : Math.round((passedCount / total) * 100);

    return { saved, total, passRate };
  }, [items]);

  const history = useMemo(
    () =>
      items
        .filter((it) =>
          ["passed", "purchased", "deleted"].includes(it.status)
        )
        .sort((a, b) => {
          const ad = new Date(a.decided_at ?? a.created_at).getTime();
          const bd = new Date(b.decided_at ?? b.created_at).getTime();
          return bd - ad;
        }),
    [items]
  );

  const statusLabel: Record<string, string> = {
    passed: "포기",
    purchased: "구매",
    deleted: "삭제",
  };

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-5 pt-12 pb-32">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-[color:var(--co-text-secondary)] hover:underline"
        >
          ← 메인
        </Link>
      </div>

      <header className="mb-10">
        <p className="text-[color:var(--co-text-secondary)] text-sm mb-2">
          이번 달 절약 금액
        </p>
        <h1 className="co-display">{formatKRW(thisMonth.saved)}</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="co-card p-5">
          <p className="text-sm text-[color:var(--co-text-secondary)]">
            완료 건수
          </p>
          <p className="text-[32px] font-bold tracking-[-0.625px] mt-1">
            {thisMonth.total}
          </p>
        </div>
        <div className="co-card p-5">
          <p className="text-sm text-[color:var(--co-text-secondary)]">포기율</p>
          <p className="text-[32px] font-bold tracking-[-0.625px] mt-1">
            {thisMonth.passRate}%
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-[22px] font-bold tracking-[-0.25px] mb-4">
          최근 기록
        </h2>
        {history.length === 0 ? (
          <p className="text-[color:var(--co-text-muted)] text-sm">
            아직 결정한 아이템이 없어요.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((it) => (
              <AnswersDialog
                key={it.id}
                item={it}
                trigger={
                  <button
                    type="button"
                    className="co-card p-4 text-left hover:bg-[color:var(--co-bg-alt)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{it.name}</p>
                        <p className="text-sm text-[color:var(--co-text-secondary)]">
                          {formatKRW(it.price)} ·{" "}
                          {new Date(
                            it.decided_at ?? it.created_at
                          ).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <span className="co-pill">
                        {statusLabel[it.status] ?? it.status}
                      </span>
                    </div>
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 메인 페이지에서 /records 링크 추가**

파일: `prototype/app/page.tsx` — header 섹션만 수정.

기존:
```tsx
      <header className="mb-10">
        <h1 className="co-display tracking-[-1.5px]">쿨링오프</h1>
        <p className="mt-2 text-[color:var(--co-text-secondary)] text-lg">
          사기 전에 한 번 식히기
        </p>
      </header>
```

변경:
```tsx
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="co-display tracking-[-1.5px]">쿨링오프</h1>
          <p className="mt-2 text-[color:var(--co-text-secondary)] text-lg">
            사기 전에 한 번 식히기
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/records">기록</Link>
        </Button>
      </header>
```

- [ ] **Step 4: 브라우저 수동 검증**

메인 → [기록] → `http://localhost:3000/records`:
- [ ] 히어로 "이번 달 절약 금액" 큰 숫자 렌더링 (초기엔 ₩0)
- [ ] 이번 달 완료 건수 / 포기율 카드 2개 렌더링
- [ ] 결정한 아이템이 없으면 "아직 결정한 아이템이 없어요"
- [ ] 결정 후 재방문 → 해당 아이템이 "최근 기록"에 표시, 상태 pill 정확
- [ ] 아이템 클릭 → 답변 모달 (체크리스트 답변 나열) 렌더링

- [ ] **Step 5: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/
git commit -m "feat(prototype): 기록 화면 + 답변 다시 보기 모달

- /records: 이번 달 절약 금액 히어로 + 완료 건수 + 포기율
- passed/deleted/purchased 히스토리 목록
- AnswersDialog: 체크리스트 답변 모달 (기획-배경 6-2 '답변 자체가 가치')
- 메인 header에 [기록] 버튼 추가

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 반응형 폴리싱 + README

**Files:**
- Modify: `prototype/app/page.tsx` (768px 이상에서 2칸 그리드 시도)
- Create: `prototype/README.md` (기존 덮어쓰기)

- [ ] **Step 1: 메인 섹션 카드 리스트를 PC에서 2칸 그리드로**

파일: `prototype/app/page.tsx` — 각 섹션의 카드 wrapper 수정.

기존:
```tsx
              <div className="flex flex-col gap-4">
                {cooling.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
```

변경:
```tsx
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cooling.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
```

동일하게 `ready` 섹션도 `grid grid-cols-1 md:grid-cols-2 gap-4`로 변경.

- [ ] **Step 2: README 작성**

파일: `prototype/README.md`

```markdown
# 쿨링오프 프로토타입

[`docs/superpowers/specs/2026-04-11-cooling-off-prototype-design.md`](../docs/superpowers/specs/2026-04-11-cooling-off-prototype-design.md) 스펙의 구현체.

> ⚠️ 이건 **본 개발이 아니다.** 기획 역방향 보정용 프로토타입. 5월 W5~W7 본 개발에서 Supabase/Auth/PWA/Push를 추가한다.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`

## 기술 스택

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (New York)
- React Hook Form + Zod
- Sonner (토스트)
- Inter 폰트 (NotionInter 대체)
- 데이터: localStorage (single-user)

## 화면

| 경로 | 설명 |
|---|---|
| `/` | 메인 — 🧊 냉각 중 / ✅ 결정 대기 그룹 |
| `/new` | 상품 등록 폼 |
| `/items/[id]/checklist/[step]` | 체크리스트 7문항 (독립 라우트) |
| `/items/[id]/decide` | 결정 화면 (좌우 대칭 [포기]/[구매]) |
| `/records` | 기록 & 이번 달 절약 금액 |

## 개발용 트릭

- 카드마다 **[개발] 냉각 완료 처리** 버튼이 노출된다. 실제 타이머를 기다리지 않고 즉시 `ready` 상태로 전이시킨다. 본 개발에서는 Edge Function으로 교체된다.
- localStorage 초기화가 필요하면 DevTools → Application → Local Storage → `cooling-off:*` 키 삭제.

## 데이터 모델

`lib/types.ts` 참고. tech-design.md 4-1의 PostgreSQL 스키마와 필드명이 동일 — 5월 Supabase 이관 시 변환 비용 없음.

## 스펙 역방향 보정 루프

프로토타입을 돌리면서 발견한 스펙 허점은 [`docs/prd.md`](../docs/prd.md)와 [`docs/user-story-map.md`](../docs/user-story-map.md)에 즉시 반영한다. 의심 지점은 [spec 문서 Section 8](../docs/superpowers/specs/2026-04-11-cooling-off-prototype-design.md#8-스펙-보정-루프-의심-지점) 참고.
```

- [ ] **Step 3: 반응형 + 전체 플로우 최종 검증**

```bash
cd /Users/musinsa/cooling-off/prototype
npm run dev
```

**모바일 (375px 폭)**:
- [ ] 메인: 빈 상태 → 등록 → 냉각 중 카드 1칸 세로 스택
- [ ] FAB이 화면 하단 중앙 고정
- [ ] 등록 폼 입력 편집 가능
- [ ] 체크리스트 질문 1개씩 풀스크린에 가까운 레이아웃
- [ ] 결정 화면 [포기]/[구매] 좌우 대칭, 탭 영역 충분

**PC (≥768px 폭)**:
- [ ] 메인: 카드 2칸 그리드
- [ ] FAB 위치가 auto로 풀려서 body 흐름 안에 위치 (md:static md:mt-10 md:translate-x-0)
- [ ] 기록 페이지 히어로 + 보조 카드 2개 가로 그리드

**End-to-end 플로우**:
- [ ] 메인 → 등록 → 가격 입력 시 냉각기 실시간 표시 → 저장 → 메인에 냉각 중 카드
- [ ] 카드의 [개발] 냉각 완료 → 결정 대기로 이동
- [ ] "결정하기 →" → 체크리스트 1/7 → 7/7 → 결정 화면
- [ ] [포기] → 메인 이동
- [ ] 메인 header [기록] → 이번 달 절약 금액에 합산됨
- [ ] 아이템 클릭 → 답변 모달 표시

- [ ] **Step 4: 타입체크 + lint**

```bash
cd /Users/musinsa/cooling-off/prototype
npx tsc --noEmit
npm run lint
```

Expected: 에러 없음 (경고는 OK).

- [ ] **Step 5: 커밋**

```bash
cd /Users/musinsa/cooling-off
git add prototype/
git commit -m "feat(prototype): 반응형 그리드 + README

- 메인 섹션 리스트를 md: 이상에서 2칸 그리드
- README 재작성: 스펙 링크, 개발용 트릭, 이관 가이드

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review 결과

**1. Spec coverage (docs/superpowers/specs/2026-04-11-cooling-off-prototype-design.md)**

| 스펙 섹션 | 해당 Task |
|---|---|
| §2 5개 화면 | Task 5 (메인), 6 (등록), 7 (체크리스트), 8 (결정), 9 (기록) |
| §2 US-1 상품 등록 | Task 6 |
| §2 US-2 위시리스트 조회 + 빈 상태 | Task 5 |
| §2 US-4 체크리스트 7문항 | Task 7 |
| §2 US-5 결정 | Task 8 |
| §2 US-7 기록 + 답변 다시 보기 | Task 9 |
| §2 US-8 반응형 | Task 10 |
| §2 US-10 냉각 중 삭제 | Task 5 (ItemCard 내 Dialog) |
| §2 타이머 시뮬레이션 버튼 | Task 5 (DevCompleteButton) |
| §3 기술 스택 | Task 1 |
| §4 디자인 토큰 | Task 1 Step 4 (globals.css) |
| §4 결정 버튼 대칭 | Task 8 Step 1 (co-decide-btn) |
| §4 중립 토스트 | Task 8 Step 1 ("기록됐어요") |
| §4 빈 상태 | Task 5 (EmptyState) |
| §5-1 메인 두 섹션 구조 | Task 5 |
| §5-2 가격 실시간 냉각기 표시 | Task 6 Step 1 |
| §5-3 step별 독립 라우트 | Task 7 |
| §5-4 결정 후 이동 | Task 8 |
| §5-5 히어로 + 보조 카드 + 답변 모달 | Task 9 |
| §6 데이터 모델 | Task 2 (types), Task 3 (storage), Task 4 (context) |
| §7 프로젝트 구조 | 전체 |
| §8 스펙 보정 의심 지점 | Task 10 README에 링크, 구현 과정에서 발견 시 반영 |
| §10 범위 밖 (테스트 등) | 전체에서 준수 (테스트 없음) |

**갭**: 없음.

**2. Placeholder scan**: "TBD/TODO/fill in" 없음. 모든 Step에 실제 코드/명령어 포함. ✅

**3. Type consistency**:
- `Item`, `ChecklistAnswer`, `ItemStatus`, `QuestionNo` — Task 2에서 정의, 이후 일관되게 사용 ✅
- `addItem`, `deleteItem`, `markReady`, `decideItem`, `upsertAnswer`, `getItem`, `getAnswersForItem` — Task 4에서 정의, Task 5~9에서 동일한 시그니처로 호출 ✅
- `calculateCooling`, `coolingUntilFromNow`, `formatKRW`, `formatRemaining`, `formatWaitedDuration` — Task 2에서 정의, 이후 동일한 호출 ✅
- shadcn 컴포넌트 import 경로 `@/components/ui/*` — Task 1 shadcn init이 tsconfig alias 설정함 ✅

**이슈 없음. 계획 승인 대기.**
