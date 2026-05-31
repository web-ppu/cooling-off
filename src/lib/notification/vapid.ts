/**
 * VAPID public key (URL-safe base64) 를 PushManager.subscribe 가 요구하는
 * ArrayBuffer 로 변환한다.
 *
 * PushManager 의 applicationServerKey 는 BufferSource(= ArrayBuffer | ArrayBufferView)
 * 를 받는데, Uint8Array 를 그대로 넘기면 TypeScript 의 generic 추론 때문에
 * SharedArrayBuffer 가능성으로 좁혀지지 않아 타입 에러가 난다.
 * 명시적으로 ArrayBuffer 를 만들어 반환한다.
 *
 * 클라이언트 전용 (window.atob 사용).
 */
export function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i += 1) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}
