import { useState, useEffect } from "react";
import { coolingDays } from "./utils.jsx";
import { SIM_PRO3, HISTORY_SEED, SAMPLE_COOLING, SAMPLE_READY } from "./data.js";
import {
  StatusBar, NonAuthHome, LoginScreen, AboutScreen, HomeScreen,
  CoolingScreen, RegisterScreen, ChatScreen, HistoryScreen,
  RecordDetailScreen, CoolingStartSplash, DecisionResult,
} from "./components/MobileScreens.jsx";
import {
  PcNav, PcNonAuthHome, PcLoginScreen, PcAboutScreen, PcHomeScreen,
  PcCoolingScreen, PcRegisterScreen, PcChatScreen, PcHistoryScreen,
  PcRecordDetailScreen, PcCoolingStartSplash, PcDecisionResult,
} from "./components/PcScreens.jsx";

function useViewport() {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return { w, isPc: w >= 1024 };
}

function seedItems() {
  return [...SAMPLE_READY, ...SAMPLE_COOLING];
}

export default function App() {
  const { isPc } = useViewport();

  const [auth, setAuth] = useState("logged-in");
  const [route, setRoute] = useState({ name: "home" });
  const [now, setNow] = useState(Date.now());
  const [items, setItems] = useState(() => seedItems());
  const [records, setRecords] = useState(() => [...HISTORY_SEED]);
  const [splash, setSplash] = useState(null);

  useEffect(() => {
    const i = setInterval(() => setNow((n) => n + 1000), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if ((route.name === "cooling" || route.name === "chat") && !items.find((i) => i.id === route.id)) {
      setRoute({ name: "home" });
    } else if (route.name === "record" && !records.find((r) => r.id === route.id)) {
      setRoute({ name: "history" });
    }
  }, [route, items, records]);

  useEffect(() => {
    if (auth === "logged-out") {
      if (route.name !== "non-auth-home" && route.name !== "login" && route.name !== "about") {
        setRoute({ name: "non-auth-home" });
      }
    } else {
      if (route.name === "non-auth-home" || route.name === "login") {
        setRoute({ name: "home" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const goHome = () => setRoute({ name: "home" });

  const onRegister = (data) => {
    const id = "n" + Math.random().toString(36).slice(2, 8);
    const item = {
      id, name: data.name, price: data.price, url: data.url, reason: data.reason,
      addedAt: Date.now(), days: coolingDays(data.price),
    };
    setItems((arr) => [item, ...arr]);
    setSplash({ kind: "cooling-start", item });
  };

  const onDelete = (id) => setItems((arr) => arr.filter((i) => i.id !== id));
  const onDeleteRecord = (id) => setRecords((arr) => arr.filter((i) => i.id !== id));

  const onDecide = (id, decision, facts) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const turns = SIM_PRO3.turns;
    const newRecord = {
      id: "r" + Math.random().toString(36).slice(2, 7),
      name: item.name, price: item.price, decision,
      decidedAt: Date.now(), facts, turns,
    };
    setRecords((arr) => [newRecord, ...arr]);
    setItems((arr) => arr.filter((i) => i.id !== id));
    setSplash({ kind: "decided", decision, item });
  };

  // ── PC layout ─────────────────────────────────────────────
  if (isPc) {
    let pcContent;
    if (splash?.kind === "cooling-start") {
      pcContent = <PcCoolingStartSplash item={splash.item} onContinue={() => { setSplash(null); goHome(); }} />;
    } else if (splash?.kind === "decided") {
      pcContent = <PcDecisionResult item={splash.item} decision={splash.decision} onContinue={() => { setSplash(null); goHome(); }} />;
    } else if (auth === "logged-out" || route.name === "non-auth-home") {
      pcContent = <PcNonAuthHome
        onLogin={() => setRoute({ name: "login" })}
        onAbout={() => setRoute({ name: "about", from: "non-auth-home" })} />;
    } else if (route.name === "login") {
      pcContent = <PcLoginScreen
        onBack={() => setRoute({ name: "non-auth-home" })}
        onLogin={() => { setAuth("logged-in"); setRoute({ name: "home" }); }} />;
    } else if (route.name === "about") {
      pcContent = <PcAboutScreen onBack={() => {
        if (route.from === "non-auth-home") setRoute({ name: "non-auth-home" });
        else goHome();
      }} />;
    } else if (route.name === "home") {
      pcContent = <PcHomeScreen items={items} now={now}
        onOpenCooling={(id) => setRoute({ name: "cooling", id })}
        onOpenChat={(id) => setRoute({ name: "chat", id })}
        onDelete={onDelete}
        onRegister={() => setRoute({ name: "register" })} />;
    } else if (route.name === "register") {
      pcContent = <PcRegisterScreen onBack={goHome} onSubmit={onRegister} />;
    } else if (route.name === "cooling") {
      const item = items.find((i) => i.id === route.id);
      pcContent = item ? <PcCoolingScreen item={item} now={now} onBack={goHome} onDelete={onDelete} /> : null;
    } else if (route.name === "chat") {
      const item = items.find((i) => i.id === route.id);
      pcContent = item ? <PcChatScreen item={item} sim={SIM_PRO3}
        onBack={goHome} onDelete={onDelete} onDecide={onDecide} /> : null;
    } else if (route.name === "history") {
      pcContent = <PcHistoryScreen records={records}
        onOpenRecord={(id) => setRoute({ name: "record", id })} />;
    } else if (route.name === "record") {
      const rec = records.find((r) => r.id === route.id);
      pcContent = rec ? <PcRecordDetailScreen record={rec}
        onBack={() => setRoute({ name: "history" })}
        onDelete={onDeleteRecord} /> : null;
    }

    return (
      <div className="pc-app" data-accent="blue">
        <PcNav
          route={route} setRoute={setRoute} auth={auth}
          onLogin={() => setRoute({ name: "login" })}
          onLogout={() => setAuth("logged-out")}
        />
        {pcContent}
      </div>
    );
  }

  // ── Mobile layout ────────────────────────────────────────
  let content;
  if (splash?.kind === "cooling-start") {
    content = <CoolingStartSplash item={splash.item} onContinue={() => { setSplash(null); goHome(); }} />;
  } else if (splash?.kind === "decided") {
    content = <DecisionResult item={splash.item} decision={splash.decision} onContinue={() => { setSplash(null); goHome(); }} />;
  } else {
    content = renderRoute();
  }

  function renderRoute() {
    if (auth === "logged-out" || route.name === "non-auth-home") {
      return <NonAuthHome
        onLogin={() => setRoute({ name: "login" })}
        onAbout={() => setRoute({ name: "about", from: "non-auth-home" })} />;
    }
    switch (route.name) {
      case "login":
        return <LoginScreen
          onBack={() => setRoute({ name: "non-auth-home" })}
          onLogin={() => { setAuth("logged-in"); setRoute({ name: "home" }); }} />;
      case "about":
        return <AboutScreen onBack={() => {
          if (route.from === "non-auth-home") setRoute({ name: "non-auth-home" });
          else goHome();
        }} />;
      case "home":
        return <HomeScreen items={items} now={now}
          onOpenCooling={(id) => setRoute({ name: "cooling", id })}
          onOpenChat={(id) => setRoute({ name: "chat", id })}
          onDelete={onDelete}
          onRegister={() => setRoute({ name: "register" })}
          onHistory={() => setRoute({ name: "history" })}
          onAbout={() => setRoute({ name: "about", from: "home" })} />;
      case "register":
        return <RegisterScreen onBack={goHome} onSubmit={onRegister} />;
      case "cooling": {
        const item = items.find((i) => i.id === route.id);
        if (!item) return null;
        return <CoolingScreen item={item} now={now} onBack={goHome} onDelete={onDelete} />;
      }
      case "chat": {
        const item = items.find((i) => i.id === route.id);
        if (!item) return null;
        return <ChatScreen item={item} sim={SIM_PRO3}
          onBack={goHome} onDelete={onDelete} onDecide={onDecide} />;
      }
      case "history":
        return <HistoryScreen records={records}
          onBack={goHome}
          onOpenRecord={(id) => setRoute({ name: "record", id })} />;
      case "record": {
        const rec = records.find((r) => r.id === route.id);
        if (!rec) return null;
        return <RecordDetailScreen record={rec}
          onBack={() => setRoute({ name: "history" })}
          onDelete={onDeleteRecord} />;
      }
      default:
        return null;
    }
  }

  return (
    <div className="phone-stage" data-accent="blue">
      <div className="phone">
        <StatusBar />
        {content}
      </div>
    </div>
  );
}
