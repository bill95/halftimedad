"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DashboardState = {
  createdAt: number;
  lastReset: number;
  longestStreak: number;
  lifetimeResets: number;
  totalCompletedDays: number;
  id: string;
};

type ViewMode = "public" | "shared" | "own";

const STORAGE_KEY = "halftimedad-dashboard-v1";
const OWNER_KEY = "halftimedad-dashboard-owner-v1";
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

function publicDemoState(): DashboardState {
  const now = Date.now();
  return {
    createdAt: now - 90 * DAY,
    lastReset: now - 12 * DAY,
    longestStreak: 21,
    lifetimeResets: 3,
    totalCompletedDays: 32,
    id: "DEMO01",
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
  const [viewMode, setViewMode] = useState<ViewMode>("public");

  useEffect(() => {
    const hash = window.location.hash;
    const hashValue = hash.startsWith("#d=")
      ? window.location.hash.slice(3)
      : "";
    const shared = hashValue ? decodeState(hashValue) : null;
    const local = localStorage.getItem(STORAGE_KEY);
    const stored = local ? decodeState(local) : null;
    const ownerId = localStorage.getItem(OWNER_KEY);
    let initial = publicDemoState();
    let mode: ViewMode = "public";

    if (hash === "#mine") {
      initial = stored && ownerId === stored.id ? stored : freshState();
      mode = "own";
      localStorage.setItem(STORAGE_KEY, encodeState(initial));
      localStorage.setItem(OWNER_KEY, initial.id);
    } else if (shared) {
      const belongsToThisBrowser = ownerId === shared.id;
      initial = belongsToThisBrowser && stored?.id === shared.id ? stored : shared;
      mode = belongsToThisBrowser ? "own" : "shared";
    }

    const timer = window.setTimeout(() => {
      setState(initial);
      setViewMode(mode);
      if (mode === "shared") setToast("Shared dashboard loaded — start your own to track your streak");
    }, 0);
    return () => window.clearTimeout(timer);
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
    localStorage.setItem(OWNER_KEY, next.id);
    setViewMode("own");
    if (updateUrl) history.replaceState(null, "", "#mine");
  }

  function reset() {
    if (!state) return;
    if (viewMode !== "own") {
      setShowCreate(true);
      return;
    }
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
    setToast("Your Peace Monitor is ready — bookmark this page");
  }

  if (!state) return <main className="monitor-loading">Calibrating domestic stability...</main>;

  return (
    <main className="monitor-shell">
      <header className="nav">
        <Link className="logo" href="/" aria-label="HalfTimeDad home">
          <span className="signal" />
          <span>HalfTimeDad</span>
        </Link>
        <div className="nav-actions">
          <button className="ghost" onClick={() => setShowCreate(true)}>{viewMode === "own" ? "New dashboard" : "Create your monitor"}</button>
          <button className="light" onClick={share}>Share</button>
        </div>
      </header>

      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">Domestic Peace Monitor™</p>
          <h1>Track the calm.<br />One day at a time.</h1>
          <p className="lede">A completely unofficial incident dashboard built on hope, selective memory, and no reliable scientific evidence.</p>
          <div className="identity">{viewMode === "public" ? "PUBLIC DEMO" : viewMode === "shared" ? "SHARED DASHBOARD" : "YOUR DASHBOARD"} · {state.id}</div>
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
        <div className={`bookmark-note ${viewMode !== "own" ? "shared" : ""}`}>{viewMode !== "own" ? <><strong>Want to track your own streak?</strong><span>Create your own private monitor below. {viewMode === "public" ? "The public demo will stay unchanged." : "This shared dashboard will stay unchanged."}</span></> : <><strong>Keep your monitor handy.</strong><span>It is saved in this browser. Bookmark this page so it is easy to return.</span></>}</div>
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
          <button className={viewMode !== "own" ? "light own-monitor" : "danger"} onClick={reset}>{viewMode !== "own" ? "Create your own Peace Monitor" : "🚨 Record new incident"}</button>
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

      <footer>Built for dads navigating the second half. A lighthearted reflection tool—not a clinical assessment or professional advice.</footer>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Fresh start</p>
            <h2>{viewMode !== "own" ? "Create your own Peace Monitor?" : "Create a new dashboard?"}</h2>
            <p>{viewMode !== "own" ? "This creates a clean, private dashboard saved in your browser. Bookmark it after creating it so you can return easily." : "This creates a clean, anonymous dashboard with a new ID. Your current dashboard remains available through its existing share link."}</p>
            <div className="modal-actions"><button className="ghost" onClick={() => setShowCreate(false)}>Cancel</button><button className="light" onClick={createNew}>Create dashboard</button></div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
