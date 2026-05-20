import { useState, useEffect } from 'react';
import {
  IcCube, IcList, IcHelp, IcInfo, IcBack, IcArrowRight,
  IcPlus, IcLock, IcClock, IcSparkle, IcSnow,
} from './icons.jsx';
import { fmtCountdown, fmtCountdownLong, fmtDate } from './store.js';

export function AppBar({ route, navigate, item }) {
  const isRecords = route.name === 'records';
  const showBackInfo = route.name === 'decide' || route.name === 'summary' || route.name === 'register';

  if (showBackInfo && (item || route.name === 'register')) {
    const name = route.name === 'register' ? '새 물건 등록' : (item?.name || '');
    const sub = route.name === 'register' ? '쿨링오프 시작 전' :
                (route.name === 'summary' ? '결정 요약' :
                 (item?.decideAt ? `결정 가능 · ${fmtDate(item.decideAt)}` : ''));
    return (
      <header className="appbar with-back">
        <div className="appbar-inner">
          <button className="btn btn-back" onClick={() => navigate(route.name === 'summary' ? `decide/${item.id}` : 'home')} aria-label="뒤로">
            <IcBack size={20} />
          </button>
          <div className="appbar-back-info">
            <div className="meta">
              <strong>{name}</strong>
              {sub && <small>{sub}</small>}
            </div>
          </div>
          <span className="appbar-spacer" />
          <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
            <span className="brand-name">쿨링오프</span>
          </a>
        </div>
      </header>
    );
  }

  return (
    <header className="appbar">
      <div className="appbar-inner">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          <span className="brand-mark"><IcCube size={18} /></span>
          <span className="brand-name">쿨링오프</span>
        </a>
        <span className="appbar-spacer" />
        <div className="appbar-actions">
          <button className={`btn btn-records ${isRecords ? 'is-on' : ''}`} onClick={() => navigate('records')} title="기록">
            <IcList size={20} />
            <span className="btn-records-text">기록</span>
          </button>
          <button className="btn btn-icon" onClick={() => navigate('about')} title="소개" aria-label="소개">
            <IcInfo size={20} />
          </button>
          <button className="btn btn-icon" onClick={() => navigate('help')} title="도움말" aria-label="도움말">
            <IcHelp size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

const TODAY_QUOTE = "사기 전에 한 번 더 생각해 보면, 살 때보다 안 살 때가 훨씬 많아요.";

function CoolingCard({ item }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, item.decideAt - now);
  return (
    <div className="cool-card" aria-disabled="true">
      <div className="left">
        <span className="lock-line"><IcLock size={13} /> {item.name}</span>
        <span className="timer">{fmtCountdown(remaining)} 남음</span>
      </div>
      <span className="clock-pill"><IcClock size={20} /></span>
    </div>
  );
}

export function HomePage({ items, navigate, tweaks }) {
  const now = Date.now();
  const ready = items.filter(i => i.decision === 'pending' && i.decideAt <= now);
  const cooling = items.filter(i => i.decision === 'pending' && i.decideAt > now);

  if (items.filter(i => i.decision === 'pending').length === 0) {
    return (
      <main className="page">
        <div className="empty">
          <span className="empty-mark"><IcSnow size={40} /></span>
          <h1>지금 식히는 물건이 없어요</h1>
          <p>사고 싶은 게 떠오르면 일단 등록해 두세요.<br />{tweaks.coolDays}일 동안 식히고 나서 결정하면 됩니다.</p>
          <div style={{ height: 12 }} />
          <button className="btn-primary lg pill" onClick={() => navigate('register')}>
            <IcPlus size={18} /> 새 물건 등록
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="home-grid">
        <div>
          {ready.length > 0 && (
            <>
              <div className="section-hd">
                <span className="dot" />
                <span>오늘 결정할 수 있는 물건</span>
                <span className="count">{ready.length}</span>
              </div>
              <div className="cards-stack">
                {ready.map(it => (
                  <button key={it.id} className="ready-card" onClick={() => navigate('decide', it.id)}>
                    <div className="ready-card-row">
                      <h3>{it.name}</h3>
                      {it.price && <span className="price">{it.price}</span>}
                    </div>
                    <div className="ready-card-row" style={{ marginBottom: 0, alignItems: 'center' }}>
                      <span className="meta">
                        <IcClock size={14} /> {fmtDate(it.addedAt)}부터 {Math.round((Date.now() - it.addedAt) / (24 * 3600 * 1000))}일째 식힘
                      </span>
                      <span className="cta">
                        지금 결정하기 <IcArrowRight size={16} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {cooling.length > 0 && (
            <>
              <div className="section-hd">
                <span className="dot cool" />
                <span>식히는 중</span>
                <span className="count">{cooling.length}</span>
              </div>
              <div className="cards-stack">
                {cooling.map(it => (
                  <CoolingCard key={it.id} item={it} />
                ))}
              </div>
            </>
          )}

          <div style={{ height: 24 }} />
          <button className="btn-primary lg pill" onClick={() => navigate('register')} style={{ width: '100%' }}>
            <IcPlus size={18} /> 새 물건 등록
          </button>
        </div>

        <aside className="aside-stack">
          <div className="aside">
            <h3>오늘의 한마디</h3>
            <p>{TODAY_QUOTE}</p>
          </div>
          <div className="toast">
            <IcSparkle size={18} />
            <span>이번 달 안 산 물건 <strong>2개</strong></span>
            <button onClick={() => navigate('records')}>기록 보기</button>
          </div>
        </aside>
      </div>
    </main>
  );
}

export function RegisterPage({ navigate, addItem, tweaks }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const id = addItem({
      name: name.trim(),
      price: price.trim() || undefined,
      whyNow: reason.trim() || undefined,
      coolDays: tweaks.coolDays,
    });
    navigate('cooling', id);
  };

  return (
    <main className="page">
      <div className="register-form">
        <div>
          <h1>지금 사고 싶은 게<br />뭔가요?</h1>
          <p style={{ fontSize: 15, color: 'var(--mut)', margin: '8px 0 0', lineHeight: 1.6 }}>
            등록하면 {tweaks.coolDays}일 동안 식히는 시간이 시작돼요. 그 사이엔 절대 살 수 없어요.
          </p>
        </div>

        <div className="field">
          <label className="field-lbl" htmlFor="r-name">물건 이름</label>
          <input id="r-name" className="input" placeholder="예) 무선 헤드폰"
                 value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className="field">
          <label className="field-lbl" htmlFor="r-price">가격 <small>선택</small></label>
          <input id="r-price" className="input" placeholder="예) 89,000원"
                 value={price} onChange={e => setPrice(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-lbl" htmlFor="r-reason">왜 사고 싶나요? <small>한 줄</small></label>
          <textarea id="r-reason" className="textarea" placeholder="예) 출퇴근할 때 음악 들으려고. 지금 쓰는 건 너무 답답함."
                    value={reason} onChange={e => setReason(e.target.value)} maxLength={140} />
          <span className="field-hint">{reason.length} / 140자 · 결정할 때 다시 보여줘요</span>
        </div>

        <div className="cooling-info">
          <IcSnow size={20} />
          <span>등록 즉시 {tweaks.coolDays}일간 결정 잠금</span>
        </div>

        <button className="btn-primary lg pill" onClick={submit} disabled={!canSubmit}
                style={{ opacity: canSubmit ? 1 : 0.5, marginTop: 8 }}>
          쿨링오프 시작하기 <IcArrowRight size={18} />
        </button>
      </div>
    </main>
  );
}

export function CoolingPage({ item, navigate }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!item) {
    return <main className="page"><div className="empty"><p>물건을 찾을 수 없어요.</p></div></main>;
  }

  const remaining = Math.max(0, item.decideAt - now);
  return (
    <main className="page">
      <div className="cooling">
        <span className="badge"><IcSnow size={32} /></span>
        <div>
          <div style={{ fontSize: 14, color: 'var(--mut)', marginBottom: 6 }}>{item.name}</div>
          <div className="timer-big">{fmtCountdownLong(remaining)}</div>
          <div className="hint" style={{ marginTop: 8 }}>
            {fmtDate(item.decideAt)}에 결정할 수 있어요
          </div>
        </div>
        <div style={{ maxWidth: 340, fontSize: 14, color: 'var(--mut)', lineHeight: 1.6, marginTop: 8 }}>
          타이머가 0이 될 때까진 결정 화면이 열리지 않아요.<br />
          그동안엔 다른 물건도 등록할 수 있어요.
        </div>
        <div style={{ height: 12 }} />
        <button className="btn-ghost" onClick={() => navigate('home')} style={{ minWidth: 200 }}>
          홈으로 돌아가기
        </button>
      </div>
    </main>
  );
}

export function AboutPage({ navigate, tweaks }) {
  return (
    <main className="page">
      <div className="about">
        <p style={{ color: 'var(--accent-strong)', fontWeight: 700, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase', margin: '0 0 14px' }}>
          쿨링오프란
        </p>
        <h1 className="about-lead">
          사고 싶은 충동을 며칠 식혀 두면, 그 중 절반은 사라집니다.
        </h1>
        <p className="about-sub">
          쿨링오프는 제품을 사기 전에 일정 시간을 강제로 두는 앱입니다.
          그 사이 충동이 가라앉으면 자연스럽게 안 사게 되고,
          그래도 사고 싶으면 그건 진짜 필요한 거예요.
        </p>

        <section className="about-section">
          <h2>어떻게 동작해요?</h2>
          <div className="about-rules">
            <Rule n="1" title="등록한다">
              사고 싶은 물건과 그 이유를 적어 두세요. 가격은 적어도, 안 적어도 돼요.
            </Rule>
            <Rule n="2" title={`${tweaks.coolDays}일 동안 식힌다`}>
              그 사이엔 결정 화면이 열리지 않아요. 등록만 가능해요.
            </Rule>
            <Rule n="3" title="결정한다">
              {tweaks.coolDays}일 뒤, 챗봇이 다시 묻습니다. "지금도 사고 싶나요?"
              그때의 마음으로 결정하면 끝.
            </Rule>
          </div>
        </section>

        <section className="about-section">
          <h2>왜 챗봇과 대화할까요?</h2>
          <p>
            결정 직전, 처음 등록할 때 적었던 "왜 사고 싶었는지"를 다시 들여다보면
            지금의 나와 그때의 나의 마음이 같은지 확인할 수 있어요.
            챗봇은 짧게 몇 가지를 묻고, 마지막에 사실만 정리해서 보여줍니다.
          </p>
          <div className="callout amber">
            <strong>주의</strong>
            <span>이 앱은 "사라"거나 "사지 마라"라고 말하지 않습니다. 결정은 항상 본인이 합니다.</span>
          </div>
        </section>

        <section className="about-section">
          <h2>기록은 어디에 남나요?</h2>
          <p>
            모든 결정은 이 기기에만 저장됩니다. 서버에는 아무것도 보내지 않아요.
            안 산 물건이 쌓이면 한 달, 1년 단위로 돌아볼 수 있어요.
          </p>
        </section>

        <div style={{ height: 24 }} />
        <button className="btn-primary lg pill" onClick={() => navigate('register')}>
          첫 물건 등록하기 <IcArrowRight size={18} />
        </button>
      </div>
    </main>
  );
}

function Rule({ n, title, children }) {
  return (
    <div className="about-rule">
      <span className="num">{n}</span>
      <span className="body"><strong>{title}</strong><span>{children}</span></span>
    </div>
  );
}

export function HelpPage({ tweaks }) {
  const faqs = [
    { q: '쿨링오프 기간은 얼마나 되나요?',
      a: `기본은 ${tweaks.coolDays}일입니다. 더 길게 식히고 싶다면 우측 하단 Tweaks에서 바꿀 수 있어요.` },
    { q: '식히는 중에 그냥 사면 안 되나요?',
      a: '이 앱이 막아주진 않아요. 다만, 결정 화면은 시간이 다 지나야 열립니다. 그게 이 앱의 전부예요.' },
    { q: '내가 등록한 걸 까먹으면요?',
      a: '시간이 다 차면 "오늘 결정할 수 있는 물건"에 자동으로 올라옵니다. 알림은 보내지 않아요.' },
    { q: '결정한 뒤에 마음이 바뀌면요?',
      a: '기록에 그대로 남습니다. 다시 사고 싶다면 새로 등록해서 또 식히면 돼요.' },
    { q: '데이터는 어디에 있어요?',
      a: '이 기기의 브라우저 안에만 있어요. 다른 곳으로는 보내지 않아요.' },
  ];
  return (
    <main className="page">
      <div className="about">
        <h1 className="about-lead">자주 묻는 질문</h1>
        <p className="about-sub">짧게, 솔직하게 답해 둡니다.</p>
        {faqs.map((f, i) => (
          <section key={i} className="about-section">
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
