/**
 * Admin 화이트리스트 (테스트/QA 용도, issue 외 자체 task).
 *
 * 환경변수 `ADMIN_EMAILS` 에서 콤마로 구분된 이메일 목록을 읽는다.
 * 예: `ADMIN_EMAILS=eounjee@gmail.com,mmin05@example.com`
 *
 * 용도:
 * - 냉각이 끝나지 않은 본인 item 으로도 채팅에 진입할 수 있게 한다
 *   (정상 사용자에게는 status='ready' 만 진입 허용).
 * - `/admin` 페이지 접근 권한 게이트.
 *
 * Production 사용자 정책 (PRD/screen-spec) 은 변경 없음 —
 * admin 화이트리스트에 등록되지 않은 사용자는 기존 정책 그대로 따른다.
 *
 * 권한 관리:
 * - Vercel 대시보드에서 환경변수 추가/제거로 즉시 반영 (재배포 1회 필요).
 * - 코드 PR 없이 멤버 추가 가능.
 */

function loadAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return loadAdminEmails().includes(email.toLowerCase());
}
