# 운영 환경 성능 조사 — 느림 원인 분석

`https://cooling-off-main.vercel.app/` 사이트의 클릭 반응 지연·체감 느림 원인을 조사한 결과입니다.
팀 논의를 거쳐 해결 방향을 정한 뒤 별도 PR 로 최적화 작업을 진행할 예정입니다.

- 조사 시점: 2026-05-29
- 조사 대상 commit: `main` 최신 (조사 시점 기준)
- 조사자: 엔지니어링

---

## 요약

`vercel.json` / `vercel.ts` 가 없어 Vercel 함수 region 이 기본값(보통 미국 동부 `iad1`) 인 상태에서, Supabase 가 다른 region 이라면 사용자가 클릭할 때마다 태평양을 왕복하는 round trip 이 누적된다. 모든 페이지가 `force-dynamic` 이라 매 navigation 이 서버 함수를 다시 호출하므로 영향이 곱셈으로 누적된다.

이 외에도 render-blocking CDN 폰트 import, 매 진입 시 실행되는 `transitionExpiredItems` UPDATE, Link 자동 prefetch + force-dynamic 충돌 등 여러 누적 요인이 함께 작용한다.

가장 큰 단일 의심 원인은 **함수 region 미설정**이며, 단순히 `vercel.json` 한 줄 추가만으로 체감이 크게 좋아질 수 있다.

---

## 1. 의심 1순위 — Vercel function region ↔ Supabase region 매치 안 됨

### 현상

- 프로젝트 루트에 `vercel.json` / `vercel.ts` 가 **없음** → 함수가 기본 region 에 배포됨
- Supabase URL: `https://oxsjhpzsczdtfsrmlutw.supabase.co` — Supabase 프로젝트가 어느 region 인지 별도 확인 필요
- 모든 페이지가 `dynamic = 'force-dynamic'` → 매 navigation 마다 서버 함수 호출

### 영향

함수가 US East 이고 Supabase 가 아시아라고 가정하면:

```
사용자(한국) → Vercel(미국)  → Supabase(아시아) → Vercel(미국) → 사용자(한국)
        ~100ms         ~150ms          ~150ms          ~100ms
                        = 페이지 진입 한 번에 ~500ms+ 가 baseline
```

매 클릭마다 이 round trip 이 반복된다.

### 확인 방법

1. Supabase 대시보드 → Project Settings → General → **Region**
2. 배포된 사이트에서 DevTools Network 탭 → 첫 응답 헤더의 **`x-vercel-id`** 확인
   - `iad1` = US East (Virginia)
   - `icn1` = Seoul
   - `hnd1` = Tokyo
   - `sin1` = Singapore

### 해결 방향 (참고)

- `vercel.json` 또는 `vercel.ts` 에 Supabase region 과 가까운 곳으로 함수 region 지정
- 예: Supabase 가 서울이면 `regions: ["icn1"]`

---

## 2. 의심 2순위 — Pretendard 폰트 CDN @import (render-blocking)

### 현상

`src/app/globals.css` 첫 줄:

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
```

### 영향

- CSS 안의 `@import` 는 **render-blocking** — 외부 CDN(jsdelivr) 응답을 받기 전까지 페이지 렌더 차단
- `cdn.jsdelivr.net/gh/...` 는 GitHub raw 트래픽 한도가 있어 일시적으로 느려지는 경우 잦음
- Pretendard 본체가 여러 weight 전체일 경우 수 MB 단위
- 모든 페이지 첫 진입 + 새 도메인 첫 캐시 미스 시 직접 체감

### 해결 방향 (참고)

- `next/font/local` 또는 `next/font/google` 로 self-host
  - 빌드 타임에 subset / preload / font-display 까지 최적화됨
  - 외부 의존 제거 → 안정성·일관성 확보

---

## 3. 의심 3순위 — `transitionExpiredItems` UPDATE 매 진입 호출

### 현상

`src/app/page.tsx`, `src/app/cooling/[id]/page.tsx`, `src/app/chat/[itemId]/page.tsx` 진입 시 매번 호출됨:

```ts
await transitionExpiredItems(supabase)
```

내부적으로 항상 다음 쿼리 발사:

```sql
UPDATE items
SET status = 'ready'
WHERE status = 'cooling'
  AND cooling_ends_at <= now()
  AND deleted_at IS NULL
```

### 영향

- 만료 항목이 0건이어도 UPDATE 쿼리는 항상 발사 (조건에 안 맞을 뿐, 발사는 됨)
- 같은 사용자가 5초 안에 홈 → 냉각 상세 → 홈 이동 → 3번 DB UPDATE
- 백그라운드 동기화여야 할 작업이 매 critical path 에 await 되어 있음
- Vercel ↔ Supabase 거리가 멀수록 충격이 그대로 누적

### 해결 방향 (참고)

- **단기**: 캐싱 — 마지막 호출 시각을 기록해 일정 시간 안에 또 들어오면 skip
- **중기**: 클라이언트 mount 후 비동기 호출 (critical path 에서 제거)
- **장기**: cron 또는 Supabase Edge Function 의 스케줄러로 이관 (별도 PR 권장)

---

## 4. 의심 4순위 — Next.js Link 자동 prefetch + force-dynamic 충돌

### 현상

- Next.js `Link` 는 viewport 안의 모든 Link 를 기본적으로 자동 prefetch
- 홈에 item 카드가 5개 있으면 5개 카드의 `/chat/{id}` 또는 `/cooling/{id}` 모두 prefetch 시도
- 그런데 그 페이지들이 `force-dynamic` → prefetch 가 **실제 서버 함수 호출 + 실제 DB 쿼리** 를 트리거

### 영향

- 사용자가 클릭한 페이지뿐 아니라 안 클릭한 페이지도 모두 쿼리됨
- 홈에 항목이 많을수록 무거워짐
- Vercel ↔ Supabase round trip 이 prefetch 만큼 곱해짐

### 해결 방향 (참고)

- `<Link prefetch={false}>` 로 명시
- 또는 IntersectionObserver 기반 lazy prefetch 로 viewport 진입 시점 한정
- 또는 페이지의 `force-dynamic` 을 일부 풀어 캐싱 가능하게 설계 (RSC 캐싱 정책 재검토)

---

## 5. 의심 5순위 — Sticky header 의 `backdrop-blur-sm`

### 현상

`src/components/app-header.tsx`:

```tsx
<header className="sticky top-0 z-30 border-b-2 ... bg-white/90 backdrop-blur-sm">
```

### 영향

- backdrop-filter + sticky 조합은 모바일 GPU 부담
- 스크롤 매 프레임마다 blur 재계산
- 모바일 저성능 기기·구형 안드로이드에서 체감 큼

### 해결 방향 (참고)

- 모바일에서만 backdrop-blur 제거 (`md:backdrop-blur-sm`)
- 또는 `bg-white` 로 불투명 처리 (blur 없이 가독성 충분)

---

## 6. 의심 6순위 — 큰 클라이언트 번들

### 현상

빌드 결과 큰 청크 (gzip 전):

```
238 KB
232 KB
119 KB
112 KB
 54 KB
```

### 영향

- AI SDK (`ai`), Gemini SDK (`@ai-sdk/google`), Supabase JS, React 19, Tailwind 합쳐서 크기 자체는 비정상은 아님
- 다만 `/chat/page.tsx` (stub, 실사용 안 함) 가 `'use client'` 라 ChatScreen 번들이 함께 포함됨
- 첫 방문 다운로드 시간에 영향

### 해결 방향 (참고)

- 사용 안 하는 stub `/chat/page.tsx` 정리 (별도 PR 권장)
- `@next/bundle-analyzer` 로 큰 청크 내용 확인 후 dynamic import 적용 검토

---

## 7. 의심 7순위 — Google Identity Services 동적 로드

### 현상

`src/app/login/page.tsx` 가 외부 스크립트 동적 로드:

```ts
script.src = 'https://accounts.google.com/gsi/client'
```

### 영향

- `/login` 진입 시 외부 스크립트 로드 await
- 대부분 환경에서 100~300ms 정도. 큰 원인은 아니지만 누적 영향
- 차단된 환경(VPN·기업망 등) 에서는 timeout 가능성

### 해결 방향 (참고)

- 우선순위 낮음. 다른 항목 처리 후 검토.
- `<link rel="preconnect" href="https://accounts.google.com">` 정도로 완화 가능

---

## 8. 보조 — 외부 진단으로 정량화

본격 수정 전에 정량 측정을 권장:

- **Vercel Speed Insights** 활성화 → 실제 사용자 LCP / TTFB / INP 분포 확인
- **Lighthouse** (`/`, `/register`, `/chat/[itemId]`, `/history`) → 페이지별 점수
- **`@next/bundle-analyzer`** → 큰 청크 내용 시각화
- **WebPageTest** 또는 Chrome DevTools 의 Performance 탭으로 critical path 측정

---

## 9. 종합 우선순위

| 순위 | 의심 항목 | 예상 영향도 | 해결 난이도 |
|---|---|---|---|
| 🔴 1 | Vercel function region 미설정 | **매우 큼** (모든 클릭에 누적) | **낮음** (`vercel.json` 한 줄) |
| 🔴 2 | Pretendard CDN @import render-blocking | **큼** (첫 진입 차단) | **낮음** (`next/font` 도입) |
| 🟡 3 | `transitionExpiredItems` 매 진입 호출 | 중간 (DB 왕복 누적) | 중간 (캐싱 / 이관) |
| 🟡 4 | Link 자동 prefetch + force-dynamic | 중간 (숨겨진 쿼리 폭증) | 낮음 (`prefetch={false}`) |
| 🟢 5 | Sticky header backdrop-blur | 낮음 (스크롤 한정) | 낮음 (미디어 쿼리) |
| 🟢 6 | 큰 클라이언트 번들 | 낮음 (첫 방문 한정) | 중간 (분석 + 분할) |
| 🟢 7 | Google Identity Services 동적 로드 | 매우 낮음 | 낮음 (preconnect) |

---

## 10. 결정 필요한 사항 (팀 논의)

1. **Vercel function region 지정 여부와 region 선택**
   - 가장 영향이 클 가능성. Supabase region 확인 후 거기에 맞춰 결정
2. **폰트 self-host 전환 여부**
   - `next/font/local` 로 Pretendard self-host 할지, 기본 시스템 폰트로 갈지
3. **`transitionExpiredItems` 의 처리 방식**
   - 캐싱 / 클라이언트 이동 / cron 이관 중 선택
4. **`force-dynamic` 정책 재검토**
   - 각 페이지의 캐싱 가능성을 다시 평가
   - RSC 캐싱 + `revalidatePath` 조합으로 옮길지

---

## 11. 다음 단계

본 문서를 베이스로 팀 논의 후 다음 중 선택:

- **옵션 A**: 의심 1·2번만 먼저 처리 (한 PR, 영향 큼, 위험 낮음)
- **옵션 B**: 1~4번 전부 한 PR
- **옵션 C**: 의심별로 개별 PR 분리 (회귀 영향 확인 쉬움, PR 수 많아짐)

논의 결과는 본 문서 § 12 변경 이력에 기록.

---

## 12. 변경 이력

| 일자 | 변경 내용 |
|---|---|
| 2026-05-29 | 최초 작성. 7개 의심 항목 정리, 우선순위 표 추가 |
