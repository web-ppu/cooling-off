# 쿨링오프 캡처 구현 메모

> 이 문서는 [`../pm/capture-prd.md`](../pm/capture-prd.md)의 구현 참고 문서다.
> PRD는 제품 판단과 사용자 흐름을 다루고, 이 문서는 구현자가 바로 확인해야 할 기술 메모만 담는다.

Status: DRAFT
Generated: 2026-05-27

---

## 1. 구현 원칙

- 네이티브 iOS/Android 앱, 네이티브 Share Extension, 앱스토어 배포는 사용하지 않는다.
- iPhone 캡처는 iOS Shortcuts가 웹 URL을 여는 방식으로 처리한다.
- Android/Chromium 캡처는 PWA `share_target`을 사용한다.
- 모든 환경에서 URL 붙여넣기 fallback을 제공한다.
- 단축어에는 API key, 사용자 토큰, Supabase 정보 등을 넣지 않는다.
- URL 파싱과 등록은 웹에서 처리한다.

---

## 2. 캡처 화면 구현

PRD에서는 설명 편의상 캡처 흐름을 `/capture`라고 부른다. 실제 구현은 개발자가 선택한다.

가능한 선택지:

- 별도 `/capture` 라우트 생성
- 기존 `/register`에 capture mode 추가
- 공통 폼 컴포넌트를 분리하고 `/register`와 캡처 화면에서 재사용

필수 조건:

- 캡처 진입 사용자가 빈 수동 등록 폼을 먼저 보지 않아야 한다.
- `?url=` 쿼리가 있으면 URL 입력값에 즉시 반영한다.
- URL 파싱 중/성공/부분 실패/전체 실패 상태를 구분한다.
- 상품명과 가격이 있더라도 바로 등록하지 않고 짧은 확인 화면을 보여준다.
- 가격이 없으면 사용자가 직접 입력해야 한다.
- 같은 URL의 기존 항목이 있으면 soft warning을 보여준다.

---

## 3. PWA `share_target`

Android/Chromium에서는 설치된 PWA가 공유 대상에 뜨도록 Web App Manifest를 설정한다.

예상 manifest 형태:

```json
{
  "name": "쿨링오프",
  "short_name": "쿨링오프",
  "start_url": "/",
  "display": "standalone",
  "icons": [],
  "share_target": {
    "action": "/capture/share-target",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

구현 메모:

- `/capture/share-target`은 예시다. 실제 라우트명은 개발자가 정해도 된다.
- GET 방식이면 query parameter로 받는다.
- POST 방식이면 `multipart/form-data` 처리가 필요하다.
- MVP는 URL/text 공유만 대상으로 한다. 파일 공유는 제외한다.
- Android/Chromium 실기기 또는 에뮬레이터에서 공유 대상 노출을 확인한다.

---

## 4. iOS Shortcuts

iPhone에서는 PWA `share_target`을 기대하지 않는다. 단축어를 배포해서 공유 URL을 쿨링오프 웹으로 넘긴다.

단축어 요구사항:

- 이름: `쿨링오프에 담기`
- 공유시트에서 실행 가능해야 한다.
- 입력 타입은 URL, Safari Web Page, Text를 받을 수 있게 한다.
- 입력에서 URL을 추출한다.
- URL 추출 성공 시 캡처 화면을 `?url=` 포함 상태로 연다.
- URL 추출 실패 시 캡처 화면을 직접 붙여넣기 상태로 연다.
- iCloud Shortcuts 링크로 배포한다.

보안 기준:

- 단축어에는 API key, 사용자 토큰, Supabase 정보 등을 넣지 않는다.
- 단축어는 URL을 웹으로 넘기는 역할만 한다.
- 로그인, 파싱, 등록, 오류 처리는 모두 웹에서 한다.

---

## 5. URL 파싱

MVP는 완벽한 상품 파싱을 목표로 하지 않는다. 자동 파싱은 지원 쇼핑몰 allowlist부터 시작한다.

1차 allowlist:

- `coupang.com`
- `naver.com` / `shopping.naver.com`
- `musinsa.com`

처리 우선순위:

1. URL 정규화
2. 도메인 allowlist 확인
3. OG title/image 파싱
4. 가격 후보 파싱
5. 실패 시 수동 입력

가격 파싱은 실패할 수 있다. 실패를 오류로 보지 말고 사용자가 직접 보완하게 한다.

---

## 6. URL fetch 보안

사용자가 넘긴 URL은 신뢰하지 않는다. 서버에서 fetch할 때는 SSRF 방지 기준을 둔다.

필수 기준:

- `http:` / `https:`만 허용한다.
- `localhost`, private IP, link-local IP, `file:` URL은 차단한다.
- redirect를 무제한으로 따라가지 않는다.
- fetch timeout을 둔다.
- 응답 크기 제한을 둔다.
- 서버 측 validation을 반드시 수행한다.
- allowlist 밖 URL은 자동 fetch하지 않는다.

allowlist 밖 URL 처리:

```text
URL은 저장한다.
상품명/가격/이미지는 자동으로 가져오지 않는다.
사용자에게 직접 입력을 요청한다.
```

---

## 7. 등록 저장

캡처 등록은 기존 등록과 같은 데이터 모델을 사용한다.

| 필드 | 정책 |
|------|------|
| `name` | 파싱 성공 시 자동 입력, 실패 시 사용자 입력 |
| `price` | 파싱 성공 시 자동 입력, 실패 시 사용자 입력 |
| `url` | 공유/붙여넣기로 받은 원본 URL 저장 |
| `reason` | 선택값. 비워도 등록 가능 |
| `status` | 등록 시 `cooling` |
| `cooling_ends_at` | `src/lib/cooling.ts` 기준으로 계산 |

중복 URL 정책:

- 같은 사용자 계정에 같은 URL의 미삭제 항목이 있으면 soft warning을 보여준다.
- 기본 선택은 기존 항목 보기다.
- 사용자가 명시적으로 선택하면 새로 담을 수 있다.

---

## 8. 개발 작업 분해

### 8.1 공통 캡처 화면

- 캡처 등록 화면 구현
- URL 입력 UI
- `?url=` query 처리
- 파싱 요청 상태
- 파싱 실패 fallback
- 이름/가격 보완 폼
- 짧은 확인 화면
- 중복 URL soft warning
- 기존 `/register` 저장 액션 또는 공통 등록 로직과 연결
- 캡처 진입 사용자가 빈 수동 등록 폼을 마주하지 않게 함

### 8.2 공유 수신

- PWA `share_target` action 라우트 생성
- Web App Manifest에 `share_target` 추가
- PWA 설치 조건 확인
- Android/Chromium에서 공유 대상 노출 확인

### 8.3 iOS 단축어

- 단축어 제작
- 공유시트 입력 타입 검증
- URL 추출 실패 케이스 처리
- iCloud 공유 링크 확보
- 단축어 설치 안내 화면 작성

### 8.4 URL 파싱

- URL 정규화 함수
- 도메인 allowlist
- SSRF 방지 validation
- OG title/image 파싱
- 사이트별 가격 후보 파싱
- 실패 시 수동 입력으로 연결
- 서버 측 validation

---

## 9. QA 체크리스트

- iPhone Safari -> 공유 -> 단축어 -> 캡처 등록 화면
- iPhone 쇼핑앱 -> 공유 -> 단축어 -> 캡처 등록 화면
- Android Chrome -> 공유 -> PWA share target
- 미지원 브라우저 -> URL 붙여넣기
- 로그인 전 캡처 진입
- 파싱 실패
- 가격 없음
- 이미 등록한 URL
- allowlist 밖 URL
- private IP / localhost URL 차단

---

## 10. Sources

- Apple Shortcuts 공유: https://support.apple.com/guide/shortcuts/share-shortcuts-apdf01f8c054/ios
- Apple Shortcuts Share Sheet 입력: https://support.apple.com/guide/shortcuts/apd7644168e1/ios
- Apple Shortcuts URL 열기: https://support.apple.com/guide/shortcuts/apdaf74d75a5/ios
- Web Share Target API (MDN): https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
- Web Share Target API (Chrome Developers): https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
- WebKit Web Share Target 이슈: https://bugs.webkit.org/show_bug.cgi?id=194593
- PWA 설치 UX (web.dev): https://web.dev/learn/pwa/installation-prompt
- Open Graph Protocol: https://ogp.me/
- SSRF 방지 기준 (OWASP): https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
