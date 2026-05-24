import { useState, useEffect, useRef } from 'react';
import { IcSend, IcSparkle, IcX } from './icons.jsx';
import { fmtDate, fmtMonth } from './store.js';

const DECIDE_SCRIPT = [
  {
    bot: (item) =>
      `${item.name}, ${Math.round((Date.now() - item.addedAt) / (24 * 3600 * 1000))}일 전에 등록했네요.\n` +
      `그때는 "${item.whyNow || '특별한 이유는 안 적었어요'}"라고 적었어요.\n` +
      `지금도 사고 싶나요?`,
    placeholder: '솔직하게 한 줄로 적어 주세요',
  },
  {
    bot: () => '그 사이에 비슷한 걸로 대신 쓴 게 있나요? 또는 마음이 식은 적이 있었나요?',
    placeholder: '있으면 한두 줄, 없으면 "없음"',
  },
  {
    bot: () => '사고 나서 한 달 동안 몇 번이나 쓸 것 같나요?',
    placeholder: '예) 일주일에 두세 번',
  },
  {
    bot: () => '안 사면 가장 아쉬울 것 같은 점 한 가지만 적어 주세요.',
    placeholder: '진짜로 아쉬울 것만',
  },
];

export function DecidePage({ item, navigate, updateItem }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState([]);
  const [typing, setTyping] = useState(true);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 700);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  if (!item) {
    return <main className="page"><div className="empty"><p>물건을 찾을 수 없어요.</p></div></main>;
  }

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const next = [...answers, text];
    setAnswers(next);
    setDraft('');
    if (step + 1 < DECIDE_SCRIPT.length) {
      setStep(step + 1);
      setTyping(true);
    } else {
      updateItem(item.id, { decideAnswers: next });
      setTimeout(() => navigate('summary', item.id), 250);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const visibleSteps = step + 1;
  const ready = step + 1 >= DECIDE_SCRIPT.length && answers.length === DECIDE_SCRIPT.length;

  return (
    <main className="page" style={{ paddingBottom: 24, paddingTop: 0 }}>
      <div className="chat-shell">
        <div className="chat-stream" ref={streamRef}>
          {DECIDE_SCRIPT.slice(0, visibleSteps).map((s, i) => (
            <div key={i}>
              {i === step && typing ? (
                <div className="bubble typing"><span /><span /><span /></div>
              ) : (
                <div className="bubble assistant">{typeof s.bot === 'function' ? s.bot(item) : s.bot}</div>
              )}
              {answers[i] && <div className="bubble user">{answers[i]}</div>}
            </div>
          ))}
        </div>

        <div className="chat-foot">
          {ready ? (
            <button className="chat-cta" onClick={() => {
              updateItem(item.id, { decideAnswers: answers });
              navigate('summary', item.id);
            }}>
              <IcSparkle size={18} /> 사실만 정리해서 보기
            </button>
          ) : (
            <div className="chat-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={DECIDE_SCRIPT[step]?.placeholder || ''}
                rows={1}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKey}
                disabled={typing}
              />
              <button className="btn-icon-circle" onClick={send} disabled={!draft.trim() || typing} aria-label="보내기"
                      style={{ opacity: !draft.trim() || typing ? 0.4 : 1 }}>
                <IcSend size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export function SummaryPage({ item, navigate, updateItem }) {
  if (!item) return <main className="page"><div className="empty"><p>물건을 찾을 수 없어요.</p></div></main>;

  const ans = item.decideAnswers || [];
  const facts = [
    `이 물건은 ${Math.round((Date.now() - item.addedAt) / (24 * 3600 * 1000))}일 전에 등록했고, 그동안 한 번도 결제할 수 없었어요.`,
    `등록할 때 적은 이유: "${item.whyNow || '적지 않음'}"`,
    `지금의 마음: "${ans[0] || '대답 안 함'}"`,
    ans[1] && `그 사이의 변화: "${ans[1]}"`,
    ans[2] && `예상 사용 빈도: "${ans[2]}"`,
    ans[3] && `안 사면 아쉬운 점: "${ans[3]}"`,
    item.price && `가격: ${item.price}`,
  ].filter(Boolean);

  const decide = (decision) => {
    updateItem(item.id, { decision, decidedAt: Date.now(), reasons: ans.filter(Boolean) });
    navigate('record', item.id);
  };

  return (
    <main className="page">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <p style={{ color: 'var(--mut-2)', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          정리된 사실
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 22px', letterSpacing: '-.01em', lineHeight: 1.35 }}>
          이 정보를 보고,<br />지금 마음으로 결정해 주세요.
        </h1>

        <div className="fact-card">
          <div className="kicker">대화 요약</div>
          <ul>
            {facts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>

        <p style={{ fontSize: 13, color: 'var(--mut-2)', textAlign: 'center', margin: '20px 0 8px' }}>
          이 결정은 기록에 남고, 다시 식히기는 할 수 없어요.
        </p>

        <div className="choice-row">
          <button className="btn-ghost" onClick={() => decide('skipped')}>
            안 살래요
          </button>
          <button className="btn-accent" style={{ height: 56, fontSize: 16, borderRadius: 12 }}
                  onClick={() => decide('bought')}>
            그래도 살래요
          </button>
        </div>
      </div>
    </main>
  );
}

export function RecordsPage({ items, navigate }) {
  const decided = items.filter(i => i.decision !== 'pending')
    .sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0));
  const skippedCount = decided.filter(i => i.decision === 'skipped').length;

  const groups = {};
  decided.forEach(it => {
    const k = fmtMonth(it.decidedAt || it.addedAt);
    (groups[k] = groups[k] || []).push(it);
  });

  if (decided.length === 0) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-mark" style={{ fontSize: 36 }}>📋</span>
          <h1>아직 결정한 게 없어요</h1>
          <p>식힌 다음 결정한 물건이 여기 쌓입니다.<br />안 산 것도, 산 것도 다 남아요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="records-hd">
          <div className="num">
            {skippedCount}
            <span style={{ fontSize: 18, color: 'var(--mut-2)', fontWeight: 500, marginLeft: 6 }}>/ {decided.length}</span>
          </div>
          <div className="label">지금까지 식혀서 안 산 물건</div>
        </div>

        {Object.entries(groups).map(([month, list]) => (
          <div key={month}>
            <div className="records-month">{month}</div>
            <div className="records-list">
              {list.map(it => (
                <button key={it.id} className="record" onClick={() => navigate('record', it.id)}>
                  <div className="info">
                    <div className="name">{it.name}</div>
                    <div className="sub">
                      <span>{fmtDate(it.decidedAt || it.addedAt)}</span>
                      {it.price && <><span className="dot">·</span><span>{it.price}</span></>}
                    </div>
                  </div>
                  <span className={`tag ${it.decision === 'skipped' ? 'no' : 'yes'}`}>
                    {it.decision === 'skipped' ? '안 샀음' : '샀음'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export function RecordModal({ item, onClose }) {
  if (!item) return null;
  const isSkipped = item.decision === 'skipped';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-hd">
          <div className="meta">
            <strong>{item.name}</strong>
            <small>
              {fmtDate(item.decidedAt || item.addedAt)} ·
              <span style={{ color: isSkipped ? 'var(--ink-3)' : 'var(--accent-strong)', fontWeight: 700, marginLeft: 4 }}>
                {isSkipped ? '안 샀음' : '샀음'}
              </span>
            </small>
          </div>
          <button className="x" onClick={onClose} aria-label="닫기"><IcX size={18} /></button>
        </div>
        <div className="modal-body">
          {item.price && (
            <div style={{ display: 'flex', gap: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--mut)' }}>가격</span>
              <span style={{ fontWeight: 700 }}>{item.price}</span>
            </div>
          )}
          {item.whyNow && (
            <div className="fact-card" style={{ margin: 0, boxShadow: 'none' }}>
              <div className="kicker">처음 적은 이유</div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>"{item.whyNow}"</p>
            </div>
          )}
          {item.reasons && item.reasons.length > 0 && (
            <div className="fact-card" style={{ margin: 0, boxShadow: 'none' }}>
              <div className="kicker">결정할 때 한 말</div>
              <ul>
                {item.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          <div className={`callout ${isSkipped ? 'amber' : 'red'}`} style={{ marginTop: 4 }}>
            <strong>{isSkipped ? '안 사기로 한 결정' : '사기로 한 결정'}</strong>
            <span>
              {isSkipped
                ? '오늘의 자신에게 잘했다고 말해 주세요. 충동은 식으면 대부분 사라져요.'
                : '식히고 나서도 사고 싶었던 물건입니다. 잘 쓰는 게 다음 일이에요.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
