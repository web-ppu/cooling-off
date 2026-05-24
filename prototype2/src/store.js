const STORE_KEY = 'kuling.items.v1';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function seedDemo() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const items = [
    {
      id: uid(),
      name: '르세라핌 사쿠라 인형',
      price: '38,000원',
      addedAt: now - 4 * day,
      decideAt: now - 1 * day,
      decision: 'pending',
      reasons: [],
    },
    {
      id: uid(),
      name: '미니멀 데스크 램프',
      price: '64,000원',
      addedAt: now - 3.5 * day,
      decideAt: now - 0.5 * day,
      decision: 'pending',
      reasons: [],
    },
    {
      id: uid(),
      name: '에어팟 프로 케이스',
      price: '24,000원',
      addedAt: now - 1 * day,
      decideAt: now + 2 * day,
      decision: 'pending',
      reasons: [],
    },
    {
      id: uid(),
      name: '캠핑용 접이식 의자',
      price: '129,000원',
      addedAt: now - 12 * day,
      decideAt: now - 9 * day,
      decision: 'skipped',
      decidedAt: now - 9 * day,
      reasons: ['이번 달 이미 비슷한 의자를 샀다', '실제로 캠핑 가는 건 일년에 두세 번'],
    },
    {
      id: uid(),
      name: '레트로 필름 카메라',
      price: '210,000원',
      addedAt: now - 18 * day,
      decideAt: now - 15 * day,
      decision: 'bought',
      decidedAt: now - 15 * day,
      reasons: ['오래 갖고 싶었고, 실제로 한 달에 한 번 이상 쓸 것 같다'],
    },
    {
      id: uid(),
      name: '한정판 운동화',
      price: '189,000원',
      addedAt: now - 32 * day,
      decideAt: now - 29 * day,
      decision: 'skipped',
      decidedAt: now - 29 * day,
      reasons: ['리셀 욕심이었음 인정', '비슷한 운동화 이미 4족'],
    },
  ];
  saveItems(items);
  return items;
}

export function loadItems() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedDemo();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveItems(items) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  } catch {}
}

export { uid };

export function fmtCountdown(ms) {
  if (ms <= 0) return '0시간 0분';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}일 ${rh}시간`;
  }
  return `${h}시간 ${m}분`;
}

export function fmtCountdownLong(ms) {
  if (ms <= 0) return '0시간 0분 0초';
  let s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return `${h}시간 ${m}분 ${s}초`;
}

export function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}
