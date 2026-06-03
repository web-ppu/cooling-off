# 유입 캡처 — 외부 설정 가이드

캡처 기능 코드는 배포되어 있지만, 아래 3가지는 **코드 밖 설정/검증**이라 사람이 직접 해야 한다.
순서대로 따라 하면 된다.

전제: 아래 예시 도메인은 `https://cooling.live` 로 적는다. 실제로는
`NEXT_PUBLIC_APP_URL` 에 설정한 프로덕션 도메인으로 바꿔서 읽으면 된다.

---

## 1. iOS 단축어 제작 + 링크 등록

iPhone은 PWA `share_target` 을 지원하지 않으므로, **iOS 단축어**로 공유 메뉴에서
쿨링오프 캡처 화면을 여는 방식을 쓴다. 단축어는 **공유된 URL만** 웹으로 넘긴다 —
로그인 정보·토큰·API key는 단축어에 절대 넣지 않는다(스펙 요구사항).

### 1-A. 단축어 만들기 (iPhone 단축어 앱)

1. **단축어** 앱 → 우상단 **+** → 새 단축어 생성.
2. 상단의 단축어 이름(예: `쿨링오프에 담기`)을 정한다. 이 이름이 공유 시트에 뜬다.
3. 우상단 **ⓘ(정보)** → **"공유 시트에 표시"** 를 켠다.
   - **공유 시트 유형**에서 **URL**, **Safari 웹페이지**, **텍스트** 만 체크
     (이미지·파일 등은 꺼서 불필요한 앱에서 안 뜨게 한다).
4. 액션을 아래 순서로 추가한다:

   | # | 액션 | 설정 |
   |---|------|------|
   | 1 | **입력에서 URL 가져오기** (Get URLs from Input) | 입력: `단축어 입력` |
   | 2 | **텍스트 인코딩** (URL Encode) | 입력: 위 1번의 `URL`, 방식: `인코딩` |
   | 3 | **텍스트** (Text) | 아래 한 줄을 적고, `[인코딩된 텍스트]` 자리에 2번 변수 삽입 |
   | 4 | **URL 열기** (Open URLs) | 입력: 위 3번 `텍스트` |

   3번 텍스트 액션에 넣을 내용:

   ```
   https://cooling.live/capture?source=ios-shortcut&url=[인코딩된 텍스트]
   ```

   - `[인코딩된 텍스트]` 는 직접 타이핑하는 게 아니라, 2번 **텍스트 인코딩**의
     출력 변수를 끼워 넣는 것이다.
   - `source=ios-shortcut` 은 캡처 화면이 진입 경로를 구분하는 데 쓴다(스펙).

5. 저장한다.

### 1-B. 동작 확인

1. Safari나 쇼핑 앱(쿠팡/네이버/무신사)에서 상품 페이지를 연다.
2. **공유** 버튼 → 액션 목록에서 방금 만든 `쿨링오프에 담기` 선택.
3. Safari가 `https://cooling.live/capture?source=ios-shortcut&url=...` 를 연다.
4. 비로그인 상태면 로그인 화면으로 갔다가 **로그인 후 다시 같은 캡처 URL로 복귀**하는지
   확인한다(이번에 고친 `next` 복귀 경로).
5. 캡처 화면에서 상품명·가격이 자동으로 채워지는지(지원 사이트), 또는 URL만
   채워지고 직접 입력 안내가 뜨는지(지원 밖 사이트) 확인한다.

### 1-C. iCloud 링크를 앱에 등록 (다른 사용자에게 배포)

위 단축어를 내 폰에만 두면 나만 쓴다. 다른 사용자도 받게 하려면:

1. 단축어 앱에서 만든 단축어 → **공유** → **iCloud 링크 복사**.
   - `https://www.icloud.com/shortcuts/xxxxxxxx...` 형태의 링크가 나온다.
2. 이 링크를 배포 환경의 환경변수에 넣는다:

   ```bash
   NEXT_PUBLIC_IOS_SHORTCUT_URL=https://www.icloud.com/shortcuts/여기에-실제-ID
   ```

   - 로컬: `.env.local`
   - 프로덕션(Vercel): **Project → Settings → Environment Variables** 에 추가 후 재배포.
3. 등록되면 `/capture/shortcut` 페이지의 안내 문구가 **[단축어 추가하기 →]** 버튼으로
   바뀐다. 비워 두면 안내 문구 + URL 직접 붙여넣기로 동작한다(앱이 깨지지 않음).

> ⚠️ 단축어 내용을 수정하면 iCloud 링크가 **새로 발급**된다. 수정 후에는 환경변수도
> 새 링크로 갱신해야 한다.

---

## 2. Android / Chromium — PWA 설치 + 공유 타깃 검증

Android Chrome(및 Chromium 계열)에서는 **PWA를 홈 화면에 설치**하면, OS 공유 시트에
쿨링오프가 공유 대상으로 뜬다. `app/manifest.ts` 의 `share_target` 설정이
`/capture/share-target` 으로 GET 요청을 보내고, 그 라우트가 `/capture?...&source=pwa-share`
로 리다이렉트한다. 코드는 이미 들어가 있고, 아래는 **실기기 검증** 절차다.

### 2-A. 설치

1. Android Chrome에서 `https://cooling.live` 접속(로컬 검증 시엔 HTTPS 필요 — 아래 참고).
2. 주소창 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**.
   - 메뉴가 안 보이면 manifest가 제대로 서빙되는지 확인:
     `https://cooling.live/manifest.webmanifest` 가 200으로 열려야 한다.
3. 홈 화면 아이콘으로 한 번 실행해 standalone(주소창 없는) 모드로 뜨는지 확인.

### 2-B. 공유 타깃 검증

1. Chrome이나 쇼핑 앱에서 상품 페이지의 **공유** 버튼을 누른다.
2. 공유 시트 앱 목록에 **쿨링오프** 가 보이는지 확인(설치 직후 한두 번 새로고침이
   필요할 수 있다).
3. 쿨링오프를 선택하면 `/capture/share-target` → `/capture?...&source=pwa-share` 로
   넘어가 캡처 화면에 URL이 채워지는지 확인한다.
4. 비로그인 → 로그인 후 캡처로 복귀하는지 확인.

### 2-C. 검증 시 주의

- **HTTPS 필수**: PWA 설치·share_target은 보안 컨텍스트에서만 동작한다.
  `localhost` 는 예외로 허용되지만, 실기기에서 로컬 서버를 테스트하려면
  `ngrok` 같은 터널로 HTTPS URL을 만들어야 한다.
- **manifest 캐시**: manifest를 바꾼 뒤에는 앱을 **제거 후 재설치**해야 공유 타깃
  변경이 반영된다.
- iOS Safari는 `share_target` 을 지원하지 않는다 → iPhone은 1번 단축어 경로를 쓴다.

---

## 3. 배포 환경변수 체크리스트

캡처 기능이 의존하는 환경변수. 프로덕션(Vercel 등)에 누락되면 동작이 깨진다.

| 변수 | 필수 | 캡처에서 쓰이는 곳 |
|------|------|--------------------|
| `NEXT_PUBLIC_APP_URL` | ✅ | OAuth 콜백·절대 URL 기준 도메인 |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 인증·items 저장 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서버 액션의 저장/중복 조회 |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | 로그인(공유/단축어 진입 후 복귀) |
| `NEXT_PUBLIC_IOS_SHORTCUT_URL` | ⬜ 선택 | `/capture/shortcut` 의 [추가] 버튼 노출. 비우면 안내 문구로 대체 |

설정 후 **반드시 재배포**해야 `NEXT_PUBLIC_*` 값이 클라이언트 번들에 반영된다.

---

## 부록 — 단축어가 여는 URL 형식

캡처 화면(`/capture`)이 받는 쿼리 파라미터:

- `url` — 상품 URL (단축어/직접 붙여넣기)
- `text`, `title` — PWA share_target이 분리해 넘기는 값(캡처 화면이 URL을 추출)
- `source` — `ios-shortcut` | `pwa-share` (진입 경로 표시용)

즉 단축어는 최소한 아래만 열면 된다:

```
https://cooling.live/capture?source=ios-shortcut&url=<URL-encoded 상품링크>
```
