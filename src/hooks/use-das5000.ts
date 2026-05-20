import { useState, useEffect, useCallback, useRef } from "react";

export type DSport = "basketball" | "football" | "hockey" | "soccer" | "baseball" | "volleyball" | "wrestling";

export interface PlayerFoul {
  number: string;
  fouls: number;
  points: number;
  inGame: boolean;
}

export interface DAS5000State {
  sport: DSport;
  layout: "indoor-bball" | "indoor-bball-fouls" | "outdoor-football" | "hockey" | "soccer" | "baseball" | "minimal";
  homeName: string;
  guestName: string;
  homeScore: number;
  guestScore: number;
  period: number;
  clockMs: number;
  clockRunning: boolean;
  countUp: boolean;
  showTenthsUnder60: boolean;
  // Basketball
  homeFouls: number;
  guestFouls: number;
  homeTOL: number;
  guestTOL: number;
  bonus: "none" | "home" | "guest";
  doubleBonus: "none" | "home" | "guest";
  possession: "home" | "guest" | null;
  shotClockMs: number;
  shotClockRunning: boolean;
  showShotClock: boolean;
  homePlayers: PlayerFoul[];
  guestPlayers: PlayerFoul[];
  // Football
  down: number;
  distance: number;
  ballOn: number;
  // Hockey
  homeSOG: number;
  guestSOG: number;
  homePenaltyMs: number;
  guestPenaltyMs: number;
  // Baseball
  inning: number;
  inningHalf: "T" | "B";
  outs: number;
  balls: number;
  strikes: number;
  // Horn
  hornAt: number;
}

const CHANNEL = "das5000-sync";
const STORAGE = "das5000-state";

function makePlayers(): PlayerFoul[] {
  return [];
}

export function defaultState(sport: DSport = "basketball"): DAS5000State {
  const clockMs = sport === "basketball" ? 8 * 60 * 1000
    : sport === "football" ? 12 * 60 * 1000
    : sport === "hockey" ? 20 * 60 * 1000
    : sport === "soccer" ? 0
    : 0;
  return {
    sport,
    layout: sport === "basketball" ? "indoor-bball-fouls" : sport === "football" ? "outdoor-football" : sport === "hockey" ? "hockey" : sport === "soccer" ? "soccer" : sport === "baseball" ? "baseball" : "minimal",
    homeName: "HOME",
    guestName: "GUEST",
    homeScore: 0,
    guestScore: 0,
    period: 1,
    clockMs,
    clockRunning: false,
    countUp: sport === "soccer",
    showTenthsUnder60: true,
    homeFouls: 0,
    guestFouls: 0,
    homeTOL: 5,
    guestTOL: 5,
    bonus: "none",
    doubleBonus: "none",
    possession: null,
    shotClockMs: 30000,
    shotClockRunning: false,
    showShotClock: sport === "basketball",
    homePlayers: makePlayers(),
    guestPlayers: makePlayers(),
    down: 1,
    distance: 10,
    ballOn: 50,
    homeSOG: 0,
    guestSOG: 0,
    homePenaltyMs: 0,
    guestPenaltyMs: 0,
    inning: 1,
    inningHalf: "T",
    outs: 0,
    balls: 0,
    strikes: 0,
    hornAt: 0,
  };
}

export function formatClock(ms: number, tenthsUnder60 = true): string {
  const m = Math.max(0, ms);
  const totalSec = m / 1000;
  if (totalSec < 60 && tenthsUnder60) {
    const s = Math.floor(totalSec);
    const t = Math.floor((m % 1000) / 100);
    return `${String(s).padStart(2, "0")}.${t}`;
  }
  const tSec = Math.ceil(totalSec); // scoreboard convention: show next second
  const mm = Math.floor(tSec / 60);
  const ss = tSec % 60;
  return `${String(mm).padStart(1, "0")}:${String(ss).padStart(2, "0")}`;
}

export function useDAS5000(isController: boolean) {
  const [state, setState] = useState<DAS5000State>(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
    } catch {}
    return defaultState();
  });
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL);
    channelRef.current = ch;
    if (!isController) {
      ch.onmessage = (e) => setState(e.data);
    }
    return () => ch.close();
  }, [isController]);

  const broadcast = useCallback((s: DAS5000State) => {
    localStorage.setItem(STORAGE, JSON.stringify(s));
    channelRef.current?.postMessage(s);
  }, []);

  const update = useCallback((patch: Partial<DAS5000State> | ((p: DAS5000State) => Partial<DAS5000State>)) => {
    setState(prev => {
      const p = typeof patch === "function" ? patch(prev) : patch;
      const next = { ...prev, ...p };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!isController) return;
    if (!state.clockRunning && !state.shotClockRunning && state.homePenaltyMs <= 0 && state.guestPenaltyMs <= 0) return;
    lastTickRef.current = performance.now();
    tickRef.current = setInterval(() => {
      setState(prev => {
        const now = performance.now();
        const dt = now - lastTickRef.current;
        lastTickRef.current = now;
        let next = { ...prev };
        if (prev.clockRunning) {
          next.clockMs = prev.countUp ? prev.clockMs + dt : Math.max(0, prev.clockMs - dt);
          if (!prev.countUp && next.clockMs <= 0) {
            next.clockMs = 0;
            next.clockRunning = false;
            next.hornAt = Date.now();
          }
        }
        if (prev.shotClockRunning) {
          next.shotClockMs = Math.max(0, prev.shotClockMs - dt);
          if (next.shotClockMs <= 0) {
            next.shotClockRunning = false;
            next.hornAt = Date.now();
          }
        }
        if (prev.homePenaltyMs > 0) next.homePenaltyMs = Math.max(0, prev.homePenaltyMs - dt);
        if (prev.guestPenaltyMs > 0) next.guestPenaltyMs = Math.max(0, prev.guestPenaltyMs - dt);
        broadcast(next);
        return next;
      });
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [state.clockRunning, state.shotClockRunning, state.homePenaltyMs > 0, state.guestPenaltyMs > 0, state.countUp, isController, broadcast]);

  return { state, update };
}
