// Shared icons + helpers — strokeWidth unified to 2.25 for brutalist tone
export const Icon = {
  Help: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h.01" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  Send: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Plus: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  History: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  Snowflake: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" />
    </svg>
  ),
  Check: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
};

export function formatKRW(price) {
  const n = Number(price) || 0;
  return "₩" + n.toLocaleString("ko-KR");
}

export function coolingDays(price) {
  const p = Number(price) || 0;
  if (p < 30000) return 1;
  if (p < 100000) return 3;
  if (p < 300000) return 7;
  if (p < 1000000) return 14;
  return 30;
}

export function coolingDaysLabel(price) {
  return `${coolingDays(price)}일`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatRemainingShort(ms) {
  if (ms <= 0) return "완료";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}일 ${pad2(h)}:${pad2(m)}`;
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function formatTimerBig(ms) {
  if (ms <= 0) return "00 : 00 : 00 : 00";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(d)} : ${pad2(h)} : ${pad2(m)} : ${pad2(s)}`;
}

export function timerParts(ms) {
  if (ms <= 0) {
    return { d: "00", h: "00", m: "00", s: "00" };
  }
  const totalSec = Math.floor(ms / 1000);
  return {
    d: pad2(Math.floor(totalSec / 86400)),
    h: pad2(Math.floor((totalSec % 86400) / 3600)),
    m: pad2(Math.floor((totalSec % 3600) / 60)),
    s: pad2(totalSec % 60),
  };
}

export function formatReadyAt(ts) {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatReadyAtKorean(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function formatDateOnly(ts) {
  const d = new Date(ts);
  return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}
