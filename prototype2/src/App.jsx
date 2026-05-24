import { useState, useEffect, useCallback } from 'react';
import { loadItems, saveItems, uid } from './store.js';
import { AppBar, HomePage, RegisterPage, CoolingPage, AboutPage, HelpPage } from './screens-home.jsx';
import { DecidePage, SummaryPage, RecordsPage, RecordModal } from './screens-decide.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakSlider } from './tweaks-panel.jsx';

const TWEAK_DEFAULTS = {
  accentColor: '#3D5A80',
  coolDays: 7,
};

function useRoute() {
  const parse = () => {
    const h = window.location.hash.replace('#', '') || 'home';
    const parts = h.split('/');
    return { name: parts[0], id: parts[1] || null };
  };
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const handler = () => setRoute(parse());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const navigate = useCallback((name, id) => {
    window.location.hash = id ? `${name}/${id}` : name;
  }, []);
  return { route, navigate };
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { route, navigate } = useRoute();
  const [items, setItems] = useState(() => loadItems());

  const addItem = useCallback((fields) => {
    const id = uid();
    const now = Date.now();
    const coolMs = (t.coolDays || 7) * 24 * 60 * 60 * 1000;
    const newItem = {
      id,
      name: fields.name,
      price: fields.price,
      whyNow: fields.whyNow,
      addedAt: now,
      decideAt: now + coolMs,
      decision: 'pending',
      reasons: [],
    };
    setItems(prev => {
      const next = [newItem, ...prev];
      saveItems(next);
      return next;
    });
    return id;
  }, [t.coolDays]);

  const updateItem = useCallback((id, changes) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...changes } : it);
      saveItems(next);
      return next;
    });
  }, []);

  // Inject accent CSS variables
  useEffect(() => {
    const hex = t.accentColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    document.documentElement.style.setProperty('--accent', t.accentColor);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.1)`);
    document.documentElement.style.setProperty('--accent-shadow', `rgba(${r},${g},${b},0.18)`);
    document.documentElement.style.setProperty('--accent-strong', `rgb(${Math.max(0, r - 24)},${Math.max(0, g - 24)},${Math.max(0, b - 24)})`);
  }, [t.accentColor]);

  const currentItem = route.id ? items.find(i => i.id === route.id) || null : null;

  const renderPage = () => {
    switch (route.name) {
      case 'home':
        return <HomePage items={items} navigate={navigate} tweaks={t} />;
      case 'register':
        return <RegisterPage navigate={(name, id) => {
          if (name === 'cooling') navigate('cooling', id);
          else navigate(name);
        }} addItem={addItem} tweaks={t} />;
      case 'cooling':
        return <CoolingPage item={currentItem} navigate={navigate} />;
      case 'decide':
        if (currentItem && currentItem.decision !== 'pending') {
          navigate('summary', currentItem.id);
          return null;
        }
        return <DecidePage item={currentItem} navigate={navigate} updateItem={updateItem} />;
      case 'summary':
        return <SummaryPage item={currentItem} navigate={(name, id) => {
          if (name === 'record') {
            navigate('records');
            setTimeout(() => navigate('record', id), 50);
          } else navigate(name, id);
        }} updateItem={updateItem} />;
      case 'records':
        return <RecordsPage items={items} navigate={navigate} />;
      case 'record': {
        const recItem = currentItem || items.find(i => i.id === route.id);
        return (
          <>
            <RecordsPage items={items} navigate={navigate} />
            {recItem && <RecordModal item={recItem} onClose={() => navigate('records')} />}
          </>
        );
      }
      case 'about':
        return <AboutPage navigate={navigate} tweaks={t} />;
      case 'help':
        return <HelpPage tweaks={t} />;
      default:
        return <HomePage items={items} navigate={navigate} tweaks={t} />;
    }
  };

  return (
    <div className="app">
      <AppBar route={route} navigate={navigate} item={currentItem} />
      {renderPage()}

      <TweaksPanel>
        <TweakSection label="냉각 기간" />
        <TweakSlider label="일수" value={t.coolDays} min={1} max={30} step={1} unit="일"
                     onChange={v => setTweak('coolDays', v)} />
      </TweaksPanel>
    </div>
  );
}
