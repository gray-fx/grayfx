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

export interface ScoreboardState {
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  clockRunning: boolean;
  homeTimeouts: number;
  awayTimeouts: number;
  possession: "home" | "away" | null;
  down: number;
  yardsToGo: number;
  ballOn: string;
  homeFouls: number;
  awayFouls: number;
  inning: number;
  inningHalf: "top" | "bottom";
  outs: number;
  balls: number;
  strikes: number;
  homeRuns: number[];
  awayRuns: number[];
  homePenaltyMinutes: number;
  awayPenaltyMinutes: number;
  homeShots: number;
  awayShots: number;
  homeSOG: number;
  awaySOG: number;
  stoppage: string;
  statLog: StatEntry[];
}

export const SPORT_CONFIG: Record<SportType, { periods: number; periodName: string; defaultClock: string; timeoutsPerHalf: number }> = {
  football: { periods: 4, periodName: "Quarter", defaultClock: "15:00", timeoutsPerHalf: 3 },
  basketball: { periods: 4, periodName: "Quarter", defaultClock: "12:00", timeoutsPerHalf: 4 },
  baseball: { periods: 9, periodName: "Inning", defaultClock: "", timeoutsPerHalf: 0 },
  hockey: { periods: 3, periodName: "Period", defaultClock: "20:00", timeoutsPerHalf: 1 },
  soccer: { periods: 2, periodName: "Half", defaultClock: "00:00", timeoutsPerHalf: 0 },
};

const CHANNEL_NAME = "scoreboard-sync";

export function getDefaultState(sport: SportType = "football"): ScoreboardState {
  return {
    sport,
    homeTeam: "HOME",
    awayTeam: "AWAY",
    homeScore: 0,
    awayScore: 0,
    period: 1,
    clock: SPORT_CONFIG[sport].defaultClock,
    clockRunning: false,
    homeTimeouts: SPORT_CONFIG[sport].timeoutsPerHalf,
    awayTimeouts: SPORT_CONFIG[sport].timeoutsPerHalf,
    possession: null,
    down: 1,
    yardsToGo: 10,
    ballOn: "OWN 25",
    homeFouls: 0,
    awayFouls: 0,
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
  };
}

export function useScoreboard(isController: boolean) {
  const [state, setState] = useState<ScoreboardState>(() => {
    const saved = localStorage.getItem("scoreboard-state");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return getDefaultState();
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    if (!isController) {
      channelRef.current.onmessage = (e) => {
        setState(e.data);
      };
    }
    return () => { channelRef.current?.close(); };
  }, [isController]);

  const broadcast = useCallback((newState: ScoreboardState) => {
    localStorage.setItem("scoreboard-state", JSON.stringify(newState));
    channelRef.current?.postMessage(newState);
  }, []);

  const update = useCallback((partial: Partial<ScoreboardState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      broadcast(next);
      return next;
    });
  }, [broadcast]);

  // Clock logic
  useEffect(() => {
    if (clockRef.current) clearInterval(clockRef.current);
    if (!state.clockRunning || !isController) return;

    const isSoccer = state.sport === "soccer";

    clockRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.clockRunning) return prev;
        const [m, s] = prev.clock.split(":").map(Number);
        const totalSec = m * 60 + s;

        let newTotal: number;
        if (isSoccer) {
          newTotal = totalSec + 1; // count up
        } else {
          if (totalSec <= 0) return { ...prev, clockRunning: false };
          newTotal = totalSec - 1; // count down
        }

        const newMin = Math.floor(newTotal / 60);
        const newSec = newTotal % 60;
        const newClock = `${String(newMin).padStart(2, "0")}:${String(newSec).padStart(2, "0")}`;
        const next = { ...prev, clock: newClock };
        broadcast(next);
        return next;
      });
    }, 1000);

    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [state.clockRunning, state.sport, isController, broadcast]);

  return { state, update };
}
