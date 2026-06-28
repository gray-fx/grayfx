import { useState, useEffect, useCallback, useRef } from "react";

export type SportType = "football" | "basketball" | "baseball" | "hockey" | "soccer";

export interface StatEntry {
  id: string;
  team: "home" | "away";
  player: string;
  action: string;
  period: number;
  clock: string;
  timestamp: number;
}

export interface DisplayOptions {
  showPeriod: boolean;
  showClock: boolean;
  showPossession: boolean;
  showTimeouts: boolean;
  showFouls: boolean;
  showPlayerFouls: boolean;
  showDownDistance: boolean;
  showSOG: boolean;
  showPIM: boolean;
  showStoppage: boolean;
  showStats: boolean;
  showTenthsAlways: boolean;   // always show .t
  showTenthsUnderMinute: boolean; // show .t when < 60s
}

export interface PlayerFoul {
  player: string;
  fouls: number;
}

export interface ScoreboardState {
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: number;
  // Clock: ms is source of truth, clock string is editable display
  clockMs: number;
  clock: string;
  clockRunning: boolean;
  homeTimeouts: number;
  awayTimeouts: number;
  possession: "home" | "away" | null;
  // Football
  down: number;
  yardsToGo: number;
  ballOn: string;
  flagOnPlay: boolean;
  challengeTeam: "home" | "away" | null;
  timeoutTeam: "home" | "away" | null;
  // Basketball
  homeFouls: number;
  awayFouls: number;
  homePlayerFouls: PlayerFoul[];
  awayPlayerFouls: PlayerFoul[];
  // Baseball
  inning: number;
  inningHalf: "top" | "bottom";
  outs: number;
  balls: number;
  strikes: number;
  homeRuns: number[];
  awayRuns: number[];
  // Hockey
  homePenaltyMinutes: number;
  awayPenaltyMinutes: number;
  homeShots: number;
  awayShots: number;
  homeSOG: number;
  awaySOG: number;
  // Soccer
  stoppage: string;
  // Stats
  statLog: StatEntry[];
  autoScoreFromStats: boolean;
  // Display
  display: DisplayOptions;
}

export const SPORT_CONFIG: Record<SportType, { periods: number; periodName: string; defaultClock: string; timeoutsPerHalf: number }> = {
  football: { periods: 4, periodName: "Quarter", defaultClock: "15:00", timeoutsPerHalf: 3 },
  basketball: { periods: 4, periodName: "Quarter", defaultClock: "12:00", timeoutsPerHalf: 4 },
  baseball: { periods: 9, periodName: "Inning", defaultClock: "", timeoutsPerHalf: 0 },
  hockey: { periods: 3, periodName: "Period", defaultClock: "20:00", timeoutsPerHalf: 1 },
  soccer: { periods: 2, periodName: "Half", defaultClock: "00:00", timeoutsPerHalf: 0 },
};

// Maps stat actions to score deltas (when autoScoreFromStats is on)
export const SCORING_ACTIONS: Record<SportType, Record<string, number>> = {
  football: { "Touchdown": 6, "Field Goal": 3, "Extra Point": 1, "2PT Conversion": 2, "Safety": 2 },
  basketball: { "2PT Made": 2, "3PT Made": 3, "Free Throw": 1 },
  baseball: { "Home Run": 1, "RBI": 1 },
  hockey: { "Goal": 1, "Power Play Goal": 1 },
  soccer: { "Goal": 1 },
};

const CHANNEL_NAME = "scoreboard-sync";

function defaultDisplay(): DisplayOptions {
  return {
    showPeriod: true,
    showClock: true,
    showPossession: true,
    showTimeouts: true,
    showFouls: true,
    showPlayerFouls: false,
    showDownDistance: true,
    showSOG: true,
    showPIM: true,
    showStoppage: true,
    showStats: true,
    showTenthsAlways: false,
    showTenthsUnderMinute: true,
  };
}

export function parseClockToMs(input: string): number {
  if (!input) return 0;
  const s = input.trim();
  // mm:ss(.t)
  const mmss = s.match(/^(\d+):(\d{1,2})(?:\.(\d))?$/);
  if (mmss) {
    const m = parseInt(mmss[1], 10);
    const sec = parseInt(mmss[2], 10);
    const t = mmss[3] ? parseInt(mmss[3], 10) : 0;
    return (m * 60 + sec) * 1000 + t * 100;
  }
  // ss(.t)
  const ss = s.match(/^(\d+)(?:\.(\d))?$/);
  if (ss) {
    const sec = parseInt(ss[1], 10);
    const t = ss[2] ? parseInt(ss[2], 10) : 0;
    return sec * 1000 + t * 100;
  }
  return 0;
}

export function formatClock(ms: number, opts: { showTenthsAlways: boolean; showTenthsUnderMinute: boolean }): string {
  const totalMs = Math.max(0, ms);
  const totalSec = totalMs / 1000;
  const showTenths = opts.showTenthsAlways || (opts.showTenthsUnderMinute && totalSec < 60);
  const wholeSec = Math.floor(totalSec);
  const tenths = Math.floor((totalMs % 1000) / 100);
  const m = Math.floor(wholeSec / 60);
  const s = wholeSec % 60;
  if (showTenths && totalSec < 60) {
    return `${s}.${tenths}`;
  }
  if (showTenths) {
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${tenths}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getDefaultState(sport: SportType = "football"): ScoreboardState {
  const ms = parseClockToMs(SPORT_CONFIG[sport].defaultClock || "00:00");
  return {
    sport,
    homeTeam: "HOME",
    awayTeam: "AWAY",
    homeScore: 0,
    awayScore: 0,
    period: 1,
    clockMs: ms,
    clock: SPORT_CONFIG[sport].defaultClock,
    clockRunning: false,
    homeTimeouts: SPORT_CONFIG[sport].timeoutsPerHalf,
    awayTimeouts: SPORT_CONFIG[sport].timeoutsPerHalf,
    possession: null,
    down: 1,
    yardsToGo: 10,
    ballOn: "OWN 25",
    flagOnPlay: false,
    challengeTeam: null,
    timeoutTeam: null,
    homeFouls: 0,
    awayFouls: 0,
    homePlayerFouls: [],
    awayPlayerFouls: [],
    inning: 1,
    inningHalf: "top",
    outs: 0,
    balls: 0,
    strikes: 0,
    homeRuns: Array(9).fill(0),
    awayRuns: Array(9).fill(0),
    homePenaltyMinutes: 0,
    awayPenaltyMinutes: 0,
    homeShots: 0,
    awayShots: 0,
    homeSOG: 0,
    awaySOG: 0,
    stoppage: "",
    statLog: [],
    autoScoreFromStats: false,
    display: defaultDisplay(),
  };
}

function migrate(s: any): ScoreboardState {
  const base = getDefaultState(s?.sport || "football");
  // Merge nested display
  const display = { ...base.display, ...(s?.display || {}) };
  const merged: ScoreboardState = { ...base, ...s, display };
  if (typeof merged.clockMs !== "number") {
    merged.clockMs = parseClockToMs(merged.clock || base.clock);
  }
  return merged;
}

import { getGameByCode, subscribeGameByCode, updateGameStateByCode, makeThrottledWriter } from "@/lib/game-sync";

export function useScoreboard(isController: boolean, remoteCode?: string) {
  const [state, setState] = useState<ScoreboardState>(() => {
    if (remoteCode) return getDefaultState();
    const saved = localStorage.getItem("scoreboard-state");
    if (saved) {
      try { return migrate(JSON.parse(saved)); } catch { /* ignore */ }
    }
    return getDefaultState();
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  const remoteWriterRef = useRef<((s: ScoreboardState) => void) | null>(null);

  // Local broadcast (same-device tabs)
  useEffect(() => {
    if (remoteCode) return;
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    if (!isController) {
      channelRef.current.onmessage = (e) => setState(migrate(e.data));
    }
    return () => { channelRef.current?.close(); };
  }, [isController, remoteCode]);

  // Remote sync (cross-device via Supabase realtime)
  useEffect(() => {
    if (!remoteCode) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await getGameByCode(remoteCode);
        if (!cancelled && row?.state) setState(migrate(row.state));
      } catch (e) { console.error("game fetch failed", e); }
    })();
    const unsub = subscribeGameByCode(remoteCode, (s) => {
      if (!isController) setState(migrate(s));
    });
    if (isController) {
      remoteWriterRef.current = makeThrottledWriter<ScoreboardState>(
        (s) => updateGameStateByCode(remoteCode, s),
        300,
      );
    }
    return () => { cancelled = true; unsub(); remoteWriterRef.current = null; };
  }, [remoteCode, isController]);

  const broadcast = useCallback((newState: ScoreboardState) => {
    if (remoteCode) {
      if (isController) remoteWriterRef.current?.(newState);
    } else {
      localStorage.setItem("scoreboard-state", JSON.stringify(newState));
      channelRef.current?.postMessage(newState);
    }
  }, [remoteCode, isController]);

  const update = useCallback((partial: Partial<ScoreboardState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial } as ScoreboardState;
      if (partial.clock !== undefined && partial.clockMs === undefined) {
        next.clockMs = parseClockToMs(partial.clock);
      }
      if (partial.clockMs !== undefined && partial.clock === undefined) {
        next.clock = formatClock(next.clockMs, next.display);
      }
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  // High-precision clock loop — runs on controller AND display (display extrapolates between snapshots for smooth OBS)
  useEffect(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (!state.clockRunning) return;
    const isSoccer = state.sport === "soccer";
    lastTickRef.current = performance.now();

    clockRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.clockRunning) return prev;
        const now = performance.now();
        const dt = now - lastTickRef.current;
        lastTickRef.current = now;
        let newMs = isSoccer ? prev.clockMs + dt : prev.clockMs - dt;
        if (!isSoccer && newMs <= 0) {
          newMs = 0;
          const stopped = { ...prev, clockMs: 0, clock: formatClock(0, prev.display), clockRunning: false };
          if (isController) broadcast(stopped);
          return stopped;
        }
        const next = { ...prev, clockMs: newMs, clock: formatClock(newMs, prev.display) };
        if (isController) broadcast(next);
        return next;
      });
    }, 100);

    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [state.clockRunning, state.sport, isController, broadcast]);

  return { state, update };
}

