"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardState = {
  createdAt: number;
  lastReset: number;
  longestStreak: number;
  lifetimeResets: number;
  totalCompletedDays: number;
  id: string;
};

const STORAGE_KEY = "halftimedad-dashboard-v1";
const DAY = 86_400_000;

function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function freshState(): DashboardState {
  const now = Date.now();
  return {
    createdAt: now,
    lastReset: now,
    longestStreak: 0,
    lifetimeResets: 0,
    totalCompletedDays: 0,
    id: randomId(),
  };
}

function encodeState(state: DashboardState) {
  return btoa(JSON.stringify(state));
}

function decodeState(value: string): DashboardState | null {
  try {
    const parsed = JSON.parse(atob(value)) as DashboardState;
    if (!parsed.lastReset || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function daysSince(timestamp: number) {
  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY));
}

function threat(days: number) {
  if (days >= 90) return { label: "Extremely Low", icon: "🟢", outlook: "Suspiciously peaceful" };
  if (days >= 30) return { label: "Low", icon: "🟢", outlook: "Unprecedented calm" };
  if (days >= 7) return { label: "Guarded", icon: "🟡", outlook: "Cautiously optimistic" };
  if (days >= 2) return { label: "Elevated", icon: "🟠", outlook: "Enjoy it while it lasts" };
  return { label: "Severe", icon: "🔴", outlook: "Active recovery period" };
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [toast, setToast] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const hashValue = window.location.hash.startsWith("#d=")
      ? window.location.hash.slice(3)
      : "";
    const shared = hashValue ? decodeState(hashValue) : null;
    const local = localStorage.getItem(STORAGE_KEY);
    const stored = local ? decodeState(local) : null;
    const initial = shared ?? stored ?? freshState();
    setState(initial);
    localStorage.setItem(STORAGE_KEY, encodeState(initial));
    if (shared) setToast("Shared dashboard loaded");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentDays = state ? daysSince(state.lastReset) : 0;
  const status = threat(currentDays);
  const longest = state ? Math.max(state.longestStreak, currentDays) : 0;
  const average = state?.lifetimeResets
    ? (state.totalCompletedDays / state.lifetimeResets).toFixed(1)
    : currentDays.toFixed(1);
  const probability = Math.max(4, Math.min(92, Math.round(68 - currentDays * 1.7)));

  const quote = useMemo(() => {
    const quotes = [
      "No news is good news.",
      "Stay humble. Stay off Reply All.",
      "Remember: screenshots last forever.",
      "May your texts be brief and your weekends remain unchanged.",
      "Things are quiet. Do not do anything stupid.",
    ];
    return quotes[new Date().getDate() % quotes.length];
  }, []);

  function persist(next: DashboardState, updateUrl = false) {
    setState(next);
    const encoded = encodeState(next);
    localStorage.setItem(STORAGE_KEY, encoded);
    if (updateUrl) history.replaceState(null, "", `#d=${encoded}`);
  }

  function reset() {
    if (!state) return;
    const ok = window.confirm(
      "Confirm new incident?\n\nThis resets the counter and enters the event into the completely unofficial permanent record."
    );
    if (!ok) return;
    const completed = daysSince(state.lastReset);
    persist(
      {
        ...state,
        lastReset: Date.now(),
        longestStreak: Math.max(state.longestStreak, completed),
        lifetimeResets: state.lifetimeResets + 1,
        totalCompletedDays: state.totalCompletedDays + completed,
      },
      true
    );
    setToast("Incident recorded. Recovery clock restarted.");
  }

  async function share() {
    if (!state) return;
    const encoded = encodeState({ ...state, longestStreak: longest });
    const url = `${window.location.origin}${window.location.pathname}#d=${encoded}`;
    history.replaceState(null, "", `#d=${encoded}`);
    const data = {
      title: "Domestic Peace Monitor",
      text: `${currentDays} days incident free. Threat level: ${status.label}.`,
      url,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setToast("Share link copied");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setToast("Could not share link");
    }
  }

  function createNew() {
    const next = freshState();
    persist(next, true);
    setShowCreate(false);
    setToast("New dashboard created");
  }

  if (!state) return <main className="loading">Calibrating domestic stability...</main>;

  return (
    <main className="shell">
      <header className="nav">
        <a className="logo" href="/" aria-label="Half Time Dad home">
          <span className="signal" />
          <span>Half Time Dad</span>
        </a>
        <div className="nav-actions">
          <button className="ghost" onClick={() => setShowCreate(true)}>New dashboard</button>
          <button className="light" onClick={share}>Share</button>
        </div>
      </header>

      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">Domestic Peace Monitor™</p>
          <h1>Track the calm.<br />One day at a time.</h1>
          <p className="lede">A completely unofficial incident dashboard built on hope, selective memory, and no reliable scientific evidence.</p>
          <div className="identity">DASHBOARD ID · {state.id}</div>
        </div>
        <div className="counter-wrap">
          <div className="counter">
            <div className="number">{currentDays}</div>
            <div className="counter-label">Days incident free</div>
          </div>
        </div>
        <div className="status-grid">
          <div><span>Threat level</span><strong>{status.icon} {status.label}</strong></div>
          <div><span>Current outlook</span><strong>{status.outlook}</strong></div>
          <div><span>Last incident</span><strong>{currentDays === 0 ? "Today" : `${currentDays} day${currentDays === 1 ? "" : "s"} ago`}</strong></div>
          <div><span>System status</span><strong>Monitoring texts</strong></div>
        </div>
      </section>

      <section className="grid">
        <article className="card panel wide">
          <div className="panel-head"><div><p className="eyebrow">Performance metrics</p><h2>The official unofficial record</h2></div></div>
          <div className="metrics">
            <div className="metric"><strong>{currentDays}</strong><span>Current streak</span></div>
            <div className="metric"><strong>{longest}</strong><span>Longest streak</span></div>
            <div className="metric"><strong>{state.lifetimeResets}</strong><span>Lifetime incidents</span></div>
            <div className="metric"><strong>{average}</strong><span>Average peaceful days</span></div>
          </div>
          <button className="danger" onClick={reset}>🚨 Record new incident</button>
          <p className="fine">Last reset: {new Date(state.lastReset).toLocaleString()}</p>
        </article>

        <article className="card panel">
          <p className="eyebrow">Incident prediction</p>
          <h2>{probability}% chance of unnecessary communication</h2>
          <div className="meter"><span style={{ width: `${probability}%` }} /></div>
          <p className="fine">Calculated using absolutely no reliable data and at least one bad assumption.</p>
          <blockquote>“{quote}”</blockquote>
        </article>

        <article className="card panel">
          <p className="eyebrow">Achievement cabinet</p>
          <div className="badges">
            {[
              [7, "🥉", "Enjoying the Silence"],
              [30, "🥈", "Unprecedented"],
              [90, "🥇", "Historical Record"],
              [365, "💎", "Scientific Anomaly"],
            ].map(([days, emoji, title]) => (
              <div className={`badge ${currentDays >= Number(days) ? "unlocked" : ""}`} key={String(days)}>
                <span>{emoji}</span><div><strong>{days} days · {title}</strong><small>{currentDays >= Number(days) ? "Unlocked" : "Keep the peace"}</small></div>
              </div>
            ))}
          </div>
        </article>

        <article className="card panel wide">
          <p className="eyebrow">Incident classification</p>
          <div className="levels">
            <div><span>🟢 Level 1</span><p>Minor complaint. A thumbs-up reaction may be sufficient.</p></div>
            <div><span>🟡 Level 2</span><p>Multi-paragraph text. Read twice before replying once.</p></div>
            <div><span>🟠 Level 3</span><p>Message begins with “We need to discuss...”</p></div>
            <div><span>🔴 Level 4</span><p>Multiple texts received within ten minutes.</p></div>
            <div><span>☢️ Level 5</span><p>Lawyer copied. Counter resets automatically in spirit.</p></div>
          </div>
        </article>
      </section>

      <footer>Built for dads navigating the second half. No actual emotional stability should be inferred from this dashboard.</footer>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Fresh start</p>
            <h2>Create a new dashboard?</h2>
            <p>This creates a clean, anonymous dashboard with a new ID. Your current dashboard remains available through its existing share link.</p>
            <div className="modal-actions"><button className="ghost" onClick={() => setShowCreate(false)}>Cancel</button><button className="light" onClick={createNew}>Create dashboard</button></div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
