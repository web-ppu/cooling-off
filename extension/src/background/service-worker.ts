// MV3 service worker (tech-spec §3): Supabase 세션 유지 + 메시지 라우팅 + 등록 호출.
// 현재는 골격 — 인증/라우팅 실제 구현은 Spike 2(OAuth) 이후.

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[쿨링오프] service worker installed:', details.reason)
})
