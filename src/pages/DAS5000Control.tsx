import { useDAS5000, formatClock, DSport } from "@/hooks/use-das5000";
import { useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

type Side = "home" | "guest";
type ControllerLayout = "standard" | "basketball-overlay";

// ─── Membrane button — defined OUTSIDE parent so React never remounts it ───────
const SQ = memo(function SQ({
  label, sub, color, onClick, armed, active,
}: {
  label: string; sub?: string;
  color: "green" | "red" | "white" | "dark" | "black";
  onClick: () => void; armed?: boolean; active?: boolean;
}) {
  const PALETTE = {
    green: { base: "#14532d", on: "#16a34a", border: "#052e16", glow: "rgba(34,197,94,0.35)", txt: "#fff" },
    red:   { base: "#7f1d1d", on: "#dc2626", border: "#450a0a", glow: "rgba(220,38,38,0.35)",  txt: "#fff" },
    white: { base: "#c0c0c0", on: "#fbbf24", border: "#888",    glow: "rgba(251,191,36,0.3)",  txt: "#111" },
    dark:  { base: "#3a3a3a", on: "#6b6b6b", border: "#111",    glow: "none",                  txt: "#fbbf24" },
    black: { base: "#1a1a1a", on: "#374151", border: "#000",    glow: "none",                  txt: "#e4e4e4" },
  };
  const p = PALETTE[color];
  const on = !!(armed || active);
  return (
    <button
      onPointerDown={onClick}
      className="aspect-square w-full flex flex-col items-center justify-center rounded select-none touch-none"
      style={{
        background: on ? p.on : p.base,
        borderBottom: `3px solid ${p.border}`,
        boxShadow: on
          ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 10px ${p.glow}`
          : "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.5)",
        outline: armed ? "2px solid #fbbf24" : "none",
        outlineOffset: 2,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <span style={{
        fontFamily: "Impact, 'Arial Narrow', sans-serif",
        fontSize: "clamp(6px, 1vw, 9px)",
        color: on && color === "white" ? "#000" : on ? p.txt : p.txt,
        letterSpacing: "0.04em",
        lineHeight: 1.1,
        textAlign: "center",
        padding: "0 2px",
        textShadow: color !== "white" ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
        fontWeight: 900,
        textTransform: "uppercase",
      }}>{label}</span>
      {sub && <span style={{
        fontFamily: "Impact, 'Arial Narrow', sans-serif",
        fontSize: "clamp(5px, 0.75vw, 7px)",
        color: color === "white" ? (on ? "#000" : "#555") : "rgba(255,255,255,0.65)",
        letterSpacing: "0.02em",
        marginTop: 2,
        textAlign: "center",
        fontWeight: 700,
        textTransform: "uppercase",
      }}>{sub}</span>}
    </button>
  );
});

// Rectangular transport button (START / STOP / HORN)
const RB = memo(function RB({ label, sub, onClick, color }: {
  label: string; sub?: string; onClick: () => void;
  color: "green" | "red" | "yellow" | "gray";
}) {
  const S = {
    green:  { bg: "linear-gradient(180deg,#16a34a,#14532d)", border: "#052e16", txt: "#fff", glow: "rgba(22,163,74,0.3)" },
    red:    { bg: "linear-gradient(180deg,#dc2626,#7f1d1d)", border: "#450a0a", txt: "#fff", glow: "rgba(220,38,38,0.3)" },
    yellow: { bg: "linear-gradient(180deg,#fde047,#ca8a04)", border: "#713f12", txt: "#000", glow: "rgba(253,224,71,0.25)" },
    gray:   { bg: "linear-gradient(180deg,#4b4b4b,#2a2a2a)", border: "#111",    txt: "#d4d4d4", glow: "none" },
  };
  const c = S[color];
  return (
    <button onPointerDown={onClick}
      className="w-full rounded font-black uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 select-none touch-none"
      style={{
        minHeight: 42, background: c.bg, borderBottom: `4px solid ${c.border}`,
        color: c.txt, fontFamily: "Impact, sans-serif", fontSize: "clamp(9px, 1.1vw, 12px)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 8px ${c.glow}`,
        WebkitUserSelect: "none", userSelect: "none",
      }}>
      <span>{label}</span>
      {sub && <span style={{ fontSize: "clamp(6px, 0.75vw, 8px)", opacity: 0.7 }}>{sub}</span>}
    </button>
  );
});

// Numpad key
const NK = memo(function NK({ label, onClick, color = "dark" }: {
  label: string; onClick: () => void; color?: "dark" | "red" | "green";
}) {
  const S = {
    dark:  { bg: "#3d3d3d", border: "#111", txt: "#fbbf24" },
    red:   { bg: "#991b1b", border: "#450a0a", txt: "#fff" },
    green: { bg: "#15803d", border: "#052e16", txt: "#fff" },
  };
  const c = S[color];
  return (
    <button onPointerDown={onClick}
      className="aspect-square w-full flex items-center justify-center rounded font-black uppercase select-none touch-none"
      style={{
        background: c.bg, borderBottom: `3px solid ${c.border}`, color: c.txt,
        fontFamily: "Impact, sans-serif", fontSize: "clamp(8px, 1.2vw, 12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.5)",
        WebkitUserSelect: "none", userSelect: "none",
      }}>
      {label}
    </button>
  );
});

// Arrow pad key
const AR = memo(function AR({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) {
  return (
    <button onPointerDown={onClick} title={title}
      className="aspect-square w-full flex items-center justify-center rounded font-black select-none touch-none"
      style={{
        fontFamily: "Impact, sans-serif", fontSize: "clamp(8px, 1.1vw, 11px)",
        background: "#2e2e2e", borderBottom: "2px solid #111", color: "#d4d4d4",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        WebkitUserSelect: "none", userSelect: "none",
      }}>
      {label}
    </button>
  );
});

// Zone section header label
function ZoneLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <div style={{ width: 3, height: 13, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{
        fontFamily: "Impact, 'Arial Narrow', sans-serif",
        fontSize: "clamp(7px, 0.85vw, 9px)",
        color, letterSpacing: "0.12em", fontWeight: 900, textTransform: "uppercase",
      }}>{label}</span>
    </div>
  );
}

// Inset panel bezel
function Panel({ children, width }: { children: React.ReactNode; width: string }) {
  return (
    <div style={{ flex: "0 0 auto", width }}>
      <div className="rounded-lg p-1.5" style={{
        background: "linear-gradient(160deg,#1c1c1c,#161616)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
        height: "100%",
      }}>
        {children}
      </div>
    </div>
  );
}

// Vertical divider between zones
function Divider() {
  return (
    <div style={{ flex: "0 0 14px", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1, height: "80%", background: "linear-gradient(180deg,transparent,rgba(255,255,255,0.1) 20%,rgba(255,255,255,0.1) 80%,transparent)" }} />
    </div>
  );
}

// ─── Standard layout button ────────────────────────────────────────
function KeyBtn({ label, hint, onClick, color = "gray", armed = false, className = "" }: {
  label: string; hint?: string; onClick: () => void;
  color?: "gray"|"red"|"green"|"blue"|"amber"|"dark"; armed?: boolean; className?: string;
}) {
  const colorMap: Record<string, string> = {
    gray:  "from-zinc-600 to-zinc-800 text-zinc-100 border-zinc-900",
    dark:  "from-zinc-800 to-zinc-950 text-amber-300 border-black",
    red:   "from-red-600 to-red-900 text-white border-red-950",
    green: "from-green-600 to-green-900 text-white border-green-950",
    blue:  "from-blue-700 to-blue-950 text-white border-blue-950",
    amber: "from-amber-400 to-amber-700 text-black border-amber-900",
  };
  return (
    <button onClick={onClick}
      className={`relative bg-gradient-to-b ${colorMap[color]} border-b-4 rounded-md py-2.5 px-1 text-[11px] font-bold uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-2 hover:brightness-110 ${armed ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900" : ""} ${className}`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.5)" }}>
      <div>{label}</div>
      {hint && <div className="text-[8px] opacity-60 mt-0.5">{hint}</div>}
    </button>
  );
}

function pad(s: string, n: number) { return (s || "").slice(0, n).padEnd(n, " "); }
function pad3(n: number) { return String(n).padStart(3, " "); }

// ══════════════════════════════════════════════════════════════════════════════
export default function DAS5000Control() {
  const { state, update } = useDAS5000(true);
  const [pendingDigits, setPendingDigits] = useState("");
  const [armedFn, setArmedFn] = useState<string | null>(null);
  const [armedSide, setArmedSide] = useState<Side | null>(null);
  const [status, setStatus] = useState("READY");
  const [controllerLayout, setControllerLayout] = useState<ControllerLayout>("standard");

  const lcdL1 = `${pad(state.homeName, 4)} ${pad3(state.homeScore)}  ${pad3(state.guestScore)} ${pad(state.guestName, 4)}`;
  const lcdL2 = armedFn
    ? `${armedFn.toUpperCase()}${armedSide ? " " + (armedSide === "home" ? "H" : "G") : ""}${pendingDigits ? " " + pendingDigits : ""}`.padEnd(16, " ")
    : `P${state.period} ${pad(formatClock(state.clockMs, state.showTenthsUnder60), 7)} ${state.clockRunning ? "RUN" : "STOP"}  ${pad(status, 6)}`;

  const commit = useCallback(() => {
    const n = pendingDigits ? parseInt(pendingDigits, 10) : null;
    const side = armedSide;
    switch (armedFn) {
      case "SCORE+1": if (side) update(p => ({ [side === "home" ? "homeScore" : "guestScore"]: (side === "home" ? p.homeScore : p.guestScore) + (n ?? 1) })); break;
      case "SCORE+2": if (side) update(p => ({ [side === "home" ? "homeScore" : "guestScore"]: (side === "home" ? p.homeScore : p.guestScore) + 2 })); break;
      case "SCORE+3": if (side) update(p => ({ [side === "home" ? "homeScore" : "guestScore"]: (side === "home" ? p.homeScore : p.guestScore) + 3 })); break;
      case "SCORE-":  if (side) update(p => ({ [side === "home" ? "homeScore" : "guestScore"]: Math.max(0, (side === "home" ? p.homeScore : p.guestScore) - (n ?? 1)) })); break;
      case "SET SCORE": if (side && n !== null) update({ [side === "home" ? "homeScore" : "guestScore"]: n } as any); break;
      case "PERIOD": update({ period: n ?? state.period + 1 }); break;
      case "FOUL+": if (side) update(p => ({ [side === "home" ? "homeFouls" : "guestFouls"]: (side === "home" ? p.homeFouls : p.guestFouls) + 1 })); break;
      case "FOUL-":  if (side) update(p => ({ [side === "home" ? "homeFouls" : "guestFouls"]: Math.max(0, (side === "home" ? p.homeFouls : p.guestFouls) - 1) })); break;
      case "TOL": if (side) update(p => ({ [side === "home" ? "homeTOL" : "guestTOL"]: Math.max(0, (side === "home" ? p.homeTOL : p.guestTOL) - 1) })); break;
      case "BONUS": if (side) update({ bonus: state.bonus === side ? "none" : side }); break;
      case "DBONUS": if (side) update({ doubleBonus: state.doubleBonus === side ? "none" : side }); break;
      case "POSS": update({ possession: side }); break;
      case "SET CLOCK": if (n !== null) {
        const s = pendingDigits;
        let ms = 0;
        if (s.length <= 2) ms = parseInt(s, 10) * 1000;
        else { const sec = parseInt(s.slice(-2), 10); const m = parseInt(s.slice(0, -2), 10); ms = (m * 60 + sec) * 1000; }
        update({ clockMs: ms });
      } break;
      case "SET SHOT": if (n !== null) update({ shotClockMs: n * 1000 }); break;
      case "SOG+": if (side) update(p => ({ [side === "home" ? "homeSOG" : "guestSOG"]: (side === "home" ? p.homeSOG : p.guestSOG) + 1 })); break;
      case "PENALTY": if (side && n !== null) update({ [side === "home" ? "homePenaltyMs" : "guestPenaltyMs"]: n * 60 * 1000 } as any); break;
      case "DOWN": update({ down: n ?? (state.down >= 4 ? 1 : state.down + 1) }); break;
      case "DIST": if (n !== null) update({ distance: n }); break;
      case "BALL ON": if (n !== null) update({ ballOn: n }); break;
      case "B": update({ balls: state.balls >= 3 ? 0 : state.balls + 1 }); break;
      case "S": update({ strikes: state.strikes >= 2 ? 0 : state.strikes + 1 }); break;
      case "O": update({ outs: state.outs >= 2 ? 0 : state.outs + 1 }); break;
      case "INNING": update(p => ({ inningHalf: p.inningHalf === "T" ? "B" : "T", inning: p.inningHalf === "B" ? p.inning + 1 : p.inning })); break;
      case "PLR FOUL": {
        // Format: <player> then second ENTER (any digits) = foul count delta (+1 default)
        // Single ENTER with just player number = +1 foul to that player
        if (side && pendingDigits) {
          const parts = pendingDigits.split(" ").filter(Boolean);
          const num = parts[0];
          const fouls = parts[1] ? parseInt(parts[1], 10) : null;
          const listKey = side === "home" ? "homePlayers" : "guestPlayers";
          update(p => {
            const list = [...p[listKey]];
            const idx = list.findIndex(pl => pl.number === num);
            if (idx >= 0) list[idx] = { ...list[idx], fouls: fouls ?? list[idx].fouls + 1, inGame: true };
            else list.push({ number: num, fouls: fouls ?? 1, points: 0, inGame: true });
            // also bump team fouls if it was an add
            const teamKey = side === "home" ? "homeFouls" : "guestFouls";
            return { [listKey]: list, [teamKey]: (p as any)[teamKey] + 1 } as any;
          });
        }
        break;
      }
      case "MASS SUB": {
        // Comma/space separated player numbers — mark all as in-game, others out
        if (side && pendingDigits) {
          const nums = pendingDigits.split(/[\s,]+/).filter(Boolean);
          const listKey = side === "home" ? "homePlayers" : "guestPlayers";
          update(p => {
            const existing = new Map(p[listKey].map(pl => [pl.number, pl]));
            const result = nums.map(n => existing.get(n) ?? { number: n, fouls: 0, points: 0, inGame: true });
            // include benched players too (preserved, marked out)
            for (const pl of p[listKey]) if (!nums.includes(pl.number)) result.push({ ...pl, inGame: false });
            return { [listKey]: result } as any;
          });
        }
        break;
      }
      case "IN/OUT": {
        if (side && pendingDigits) {
          const num = pendingDigits.trim();
          const listKey = side === "home" ? "homePlayers" : "guestPlayers";
          update(p => {
            const list = [...p[listKey]];
            const idx = list.findIndex(pl => pl.number === num);
            if (idx >= 0) list[idx] = { ...list[idx], inGame: !list[idx].inGame };
            else list.push({ number: num, fouls: 0, points: 0, inGame: true });
            return { [listKey]: list } as any;
          });
        }
        break;
      }

    setStatus("OK");
    setArmedFn(null); setArmedSide(null); setPendingDigits("");
    setTimeout(() => setStatus("READY"), 600);
  }, [armedFn, armedSide, pendingDigits, state, update]);

  const act = useCallback((fn: () => void) => {
    fn();
    setArmedFn(null); setArmedSide(null); setPendingDigits("");
    setStatus("OK");
    setTimeout(() => setStatus("READY"), 400);
  }, []);

  const press = useCallback((key: string) => {
    if (/^\d$/.test(key)) { setPendingDigits(d => (d + key).slice(0, 4)); return; }
    if (key === "CLR") { setPendingDigits(""); setArmedFn(null); setArmedSide(null); setStatus("CLR"); setTimeout(() => setStatus("READY"), 400); return; }
    if (key === "ENTER") { commit(); return; }
    if (key === "START") { update({ clockRunning: true }); return; }
    if (key === "STOP")  { update({ clockRunning: false }); return; }
    if (key === "HORN")  { update({ hornAt: Date.now() }); return; }
    if (key === "SHOT START") { update({ shotClockRunning: true }); return; }
    if (key === "SHOT STOP")  { update({ shotClockRunning: false }); return; }
    if (key === "SHOT 30") { update({ shotClockMs: 30000, shotClockRunning: false }); return; }
    if (key === "SHOT 14") { update({ shotClockMs: 14000, shotClockRunning: false }); return; }
    if (key === "HOME")  { setArmedSide("home"); return; }
    if (key === "GUEST") { setArmedSide("guest"); return; }
    setArmedFn(key);
  }, [commit, update]);

  // ── ALL cb callbacks declared unconditionally at the top level ──────────────
  const cb = {
    homeScore1:     useCallback(() => act(() => update(p => ({ homeScore: p.homeScore + 1 }))), [act, update]),
    homeScore2:     useCallback(() => act(() => update(p => ({ homeScore: p.homeScore + 2 }))), [act, update]),
    homeScore3:     useCallback(() => act(() => update(p => ({ homeScore: p.homeScore + 3 }))), [act, update]),
    homeScoreMinus: useCallback(() => act(() => update(p => ({ homeScore: Math.max(0, p.homeScore - 1) }))), [act, update]),
    homeFoulPlus:   useCallback(() => act(() => update(p => ({ homeFouls: p.homeFouls + 1 }))), [act, update]),
    homeFoulMinus:  useCallback(() => act(() => update(p => ({ homeFouls: Math.max(0, p.homeFouls - 1) }))), [act, update]),
    homeTOL:        useCallback(() => act(() => update(p => ({ homeTOL: Math.max(0, p.homeTOL - 1) }))), [act, update]),
    homePoss:       useCallback(() => update({ possession: "home" }), [update]),
    homeBonus:      useCallback(() => act(() => update(p => ({ bonus: p.bonus === "home" ? "none" : "home" }))), [act, update]),
    homeDblBonus:   useCallback(() => act(() => update(p => ({ doubleBonus: p.doubleBonus === "home" ? "none" : "home" }))), [act, update]),
    homeSetShot:    useCallback(() => { setArmedSide("home"); press("SET SHOT"); }, [press]),

    guestScore1:     useCallback(() => act(() => update(p => ({ guestScore: p.guestScore + 1 }))), [act, update]),
    guestScore2:     useCallback(() => act(() => update(p => ({ guestScore: p.guestScore + 2 }))), [act, update]),
    guestScore3:     useCallback(() => act(() => update(p => ({ guestScore: p.guestScore + 3 }))), [act, update]),
    guestScoreMinus: useCallback(() => act(() => update(p => ({ guestScore: Math.max(0, p.guestScore - 1) }))), [act, update]),
    guestFoulPlus:   useCallback(() => act(() => update(p => ({ guestFouls: p.guestFouls + 1 }))), [act, update]),
    guestFoulMinus:  useCallback(() => act(() => update(p => ({ guestFouls: Math.max(0, p.guestFouls - 1) }))), [act, update]),
    guestTOL:        useCallback(() => act(() => update(p => ({ guestTOL: Math.max(0, p.guestTOL - 1) }))), [act, update]),
    guestPoss:       useCallback(() => update({ possession: "guest" }), [update]),
    guestBonus:      useCallback(() => act(() => update(p => ({ bonus: p.bonus === "guest" ? "none" : "guest" }))), [act, update]),
    guestDblBonus:   useCallback(() => act(() => update(p => ({ doubleBonus: p.doubleBonus === "guest" ? "none" : "guest" }))), [act, update]),
    guestSetShot:    useCallback(() => { setArmedSide("guest"); press("SET SHOT"); }, [press]),

    periodPlus:   useCallback(() => update({ period: state.period + 1 }), [update, state.period]),
    periodMinus:  useCallback(() => update({ period: Math.max(1, state.period - 1) }), [update, state.period]),
    setPeriod:    useCallback(() => press("PERIOD"), [press]),
    setClock:     useCallback(() => press("SET CLOCK"), [press]),
    setScore:     useCallback(() => setArmedFn("SET SCORE"), []),
    selHome:      useCallback(() => press("HOME"), [press]),
    selGuest:     useCallback(() => press("GUEST"), [press]),
    shotStart:    useCallback(() => press("SHOT START"), [press]),
    shotStop:     useCallback(() => press("SHOT STOP"), [press]),
    shot30:       useCallback(() => press("SHOT 30"), [press]),
    shot14:       useCallback(() => press("SHOT 14"), [press]),
    setShot:      useCallback(() => setArmedFn("SET SHOT"), []),
    shotAdjMinus: useCallback(() => update({ shotClockMs: Math.max(0, state.shotClockMs - 1000) }), [update, state.shotClockMs]),
    shotAdjPlus:  useCallback(() => update({ shotClockMs: state.shotClockMs + 1000 }), [update, state.shotClockMs]),

    horn:   useCallback(() => press("HORN"), [press]),
    start:  useCallback(() => press("START"), [press]),
    stop:   useCallback(() => press("STOP"), [press]),
    clrAll: useCallback(() => { setArmedFn(null); setArmedSide(null); setPendingDigits(""); setStatus("READY"); }, []),

    n0: useCallback(() => press("0"), [press]),
    n1: useCallback(() => press("1"), [press]),
    n2: useCallback(() => press("2"), [press]),
    n3: useCallback(() => press("3"), [press]),
    n4: useCallback(() => press("4"), [press]),
    n5: useCallback(() => press("5"), [press]),
    n6: useCallback(() => press("6"), [press]),
    n7: useCallback(() => press("7"), [press]),
    n8: useCallback(() => press("8"), [press]),
    n9: useCallback(() => press("9"), [press]),
    clr: useCallback(() => press("CLR"), [press]),
    ent: useCallback(() => press("ENTER"), [press]),
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      const k = e.key;
      if (/^\d$/.test(k)) { press(k); return; }
      const map: Record<string, string> = {
        " ": state.clockRunning ? "STOP" : "START",
        "Enter": "ENTER", "Escape": "CLR", "Backspace": "CLR",
        "h": "HOME", "H": "HOME", "g": "GUEST", "G": "GUEST",
        "q": "SCORE+1", "w": "SCORE+2", "e": "SCORE+3", "r": "SCORE-",
        "f": "FOUL+", "F": "FOUL-",
        "p": "POSS", "P": "PERIOD",
        "t": "TOL", "b": "BONUS",
        "n": "HORN",
        "s": "SHOT START", "S": "SHOT STOP",
      };
      if (map[k]) { e.preventDefault(); press(map[k]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [press, state.clockRunning]);

  const ZONE_W = "clamp(90px, 13.5vw, 134px)";
  const NUMPAD_W = "clamp(88px, 12.5vw, 122px)";
  const CTRL_W = "clamp(76px, 10.5vw, 104px)";

  const sharedTop = (
    <div className="flex justify-between items-center w-full max-w-7xl mb-4">
      <div>
        <h1 className="text-xl font-black tracking-widest text-yellow-300" style={{ fontFamily: "Impact, sans-serif" }}>
          DAKTRONICS ALL SPORT 5000
        </h1>
        <p className="text-xs text-zinc-500">Simulator · Press keys or click buttons</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded overflow-hidden border border-zinc-600 text-xs">
          <button onClick={() => setControllerLayout("standard")}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-colors ${controllerLayout === "standard" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
            Standard
          </button>
          <button onClick={() => setControllerLayout("basketball-overlay")}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition-colors ${controllerLayout === "basketball-overlay" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
            Basketball
          </button>
        </div>
        <Link to="/das5000" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-600/40 px-3 py-2 rounded">
          <ExternalLink className="w-4 h-4" /> Open Scoreboard
        </Link>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // BASKETBALL OVERLAY LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  if (controllerLayout === "basketball-overlay") {
    return (
      <div className="min-h-screen w-full p-3 md:p-5 flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #050505 80%)" }}>
        {sharedTop}

        {/* ── Console chassis ── */}
        <div className="w-full max-w-7xl rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(165deg,#d8d8d8 0%,#b8b8b8 55%,#c4c4c4 100%)",
            border: "2px solid #888",
            boxShadow: "0 32px 90px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.2)",
          }}>

          {/* ── TOP BEZEL: branding + LCD + config ── */}
          <div className="flex items-center gap-4 px-5 py-3"
            style={{
              background: "linear-gradient(180deg,#e2e2e2 0%,#cacaca 100%)",
              borderBottom: "2px solid #999",
            }}>
            <div className="shrink-0">
              <div className="font-black tracking-widest text-zinc-600 leading-none" style={{ fontFamily: "Impact, sans-serif", fontSize: 13 }}>DAKTRONICS</div>
              <div className="font-bold tracking-widest text-zinc-500" style={{ fontSize: 8 }}>ALL SPORT® 5000</div>
            </div>

            {/* LCD */}
            <div className="rounded px-3 py-2 shrink-0"
              style={{
                background: "linear-gradient(180deg,#4a6b28,#5a7e32)",
                border: "2px solid #333",
                boxShadow: "inset 0 3px 10px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.3)",
              }}>
              <div className="font-mono whitespace-pre leading-snug"
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "clamp(10px, 1.3vw, 14px)",
                  letterSpacing: "0.08em",
                  color: "#1a1a1a",
                }}>
                {lcdL1.padEnd(20, " ")}{"\n"}{lcdL2.padEnd(20, " ")}
              </div>
            </div>

            {/* Config */}
            <div className="flex gap-3 flex-1 justify-center flex-wrap">
              {([
                ["Sport", <select key="sport" value={state.sport} onChange={e => update({ sport: e.target.value as DSport })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono">
                  {["basketball","football","hockey","soccer","baseball"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>],
                ["Layout", <select key="layout" value={state.layout} onChange={e => update({ layout: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono">
                  {[["indoor-bball","Indoor Bball"],["indoor-bball-fouls","Bball+Fouls"],["outdoor-football","Football"],["hockey","Hockey"],["soccer","Soccer"],["baseball","Baseball"],["minimal","Minimal"]].map(([v,l]) =>
                    <option key={v} value={v}>{l}</option>)}
                </select>],
                ["Home", <input key="home" value={state.homeName} maxLength={8} onChange={e => update({ homeName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono" />],
                ["Guest", <input key="guest" value={state.guestName} maxLength={8} onChange={e => update({ guestName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono" />],
              ] as [string, React.ReactNode][]).map(([lbl, el]) => (
                <div key={lbl as string} className="flex flex-col gap-0.5">
                  <span className="font-bold uppercase tracking-wider text-zinc-500" style={{ fontSize: 9 }}>{lbl}</span>
                  {el}
                </div>
              ))}
            </div>

            <div className="text-right shrink-0 hidden lg:block">
              <div className="font-black text-zinc-600 tracking-widest leading-none" style={{ fontFamily: "Impact, sans-serif", fontSize: 15 }}>ALL SPORT</div>
              <div className="font-bold text-zinc-500 tracking-widest" style={{ fontSize: 9 }}>5000 SERIES · CONTROL CONSOLE</div>
            </div>
          </div>

          {/* ══ MAIN BUTTON AREA ══ */}
          <div className="flex items-start justify-center px-4 pt-4 pb-3 gap-0"
            style={{ background: "linear-gradient(160deg,#c8c8c8 0%,#b4b4b4 100%)" }}>

            {/* ══ HOME (green) ══ */}
            <div style={{ flex: "0 0 auto", width: ZONE_W }}>
              <ZoneLabel label="◄ HOME" color="#22c55e" />
              <Panel width="100%">
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SCORE" sub="+1" color="green" onClick={cb.homeScore1} />
                  <SQ label="SCORE" sub="+2" color="green" onClick={cb.homeScore2} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SCORE" sub="+3" color="green" onClick={cb.homeScore3} />
                  <SQ label="SCORE" sub="−" color="green" onClick={cb.homeScoreMinus} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="FOULS" sub="+" color="green" onClick={cb.homeFoulPlus} />
                  <SQ label="FOULS" sub="−" color="green" onClick={cb.homeFoulMinus} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="TIME OUT" sub="TOL −" color="green" onClick={cb.homeTOL} />
                  <SQ label="POSS ►" color="green" onClick={cb.homePoss} active={state.possession === "home"} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <SQ label="BONUS" color="green" onClick={cb.homeBonus} active={state.bonus === "home"} />
                  <SQ label="SET SHOT" sub="CLK" color="green" onClick={cb.homeSetShot} armed={armedFn === "SET SHOT" && armedSide === "home"} />
                </div>
              </Panel>
            </div>

            <Divider />

            {/* ══ SHARED (white/grey) ══ */}
            <div style={{ flex: "0 0 auto", width: ZONE_W }}>
              <ZoneLabel label="SHARED" color="#a1a1aa" />
              <Panel width="100%">
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {[
                    { label: "◄ HOME", side: "home" as Side, bg: "#15532d", on: "#22c55e", border: "#052e16", glow: "rgba(34,197,94,0.45)" },
                    { label: "GUEST ►", side: "guest" as Side, bg: "#7f1d1d", on: "#dc2626", border: "#450a0a", glow: "rgba(220,38,38,0.45)" },
                  ].map(({ label, side, bg, on, border, glow }) => (
                    <button key={side} onPointerDown={side === "home" ? cb.selHome : cb.selGuest}
                      className="rounded font-black uppercase tracking-wider flex items-center justify-center select-none touch-none"
                      style={{
                        height: 28,
                        fontFamily: "Impact, 'Arial Narrow', sans-serif",
                        fontSize: "clamp(7px, 0.9vw, 9px)",
                        background: armedSide === side ? on : bg,
                        borderBottom: `3px solid ${border}`,
                        color: "#fff",
                        boxShadow: armedSide === side ? `0 0 10px ${glow}` : "inset 0 1px 0 rgba(255,255,255,0.1)",
                        outline: armedSide === side ? "2px solid #fbbf24" : "none",
                        outlineOffset: 2,
                        WebkitUserSelect: "none", userSelect: "none",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SET CLOCK" color="white" onClick={cb.setClock} armed={armedFn === "SET CLOCK"} />
                  <SQ label="RECALL SHOT" color="white" onClick={cb.shotStop} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SET SCORE" color="white" onClick={cb.setScore} armed={armedFn === "SET SCORE"} />
                  <SQ label="PERIOD" sub="+1" color="white" onClick={cb.periodPlus} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SHOT" sub="START" color="white" onClick={cb.shotStart} />
                  <SQ label="SHOT" sub="STOP" color="white" onClick={cb.shotStop} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SHOT 30" color="white" onClick={cb.shot30} />
                  <SQ label="SHOT 14" color="white" onClick={cb.shot14} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <SQ label="SET SHOT" sub="CLK" color="white" onClick={cb.setShot} armed={armedFn === "SET SHOT" && !armedSide} />
                  <SQ label="SET PERIOD" color="white" onClick={cb.setPeriod} armed={armedFn === "PERIOD"} />
                </div>

                {armedFn && !armedSide && ["SET SCORE","SET SHOT","DBONUS"].includes(armedFn) && (
                  <div className="mt-1.5 text-center rounded px-1 py-1"
                    style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", fontSize: 8, color: "#fbbf24", fontFamily: "Impact, sans-serif", letterSpacing: "0.05em" }}>
                    ▲ SELECT HOME or GUEST ▲
                  </div>
                )}
              </Panel>
            </div>

            <Divider />

            {/* ══ GUEST (red) ══ */}
            <div style={{ flex: "0 0 auto", width: ZONE_W }}>
              <ZoneLabel label="GUEST ►" color="#ef4444" />
              <Panel width="100%">
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SCORE" sub="+1" color="red" onClick={cb.guestScore1} />
                  <SQ label="SCORE" sub="+2" color="red" onClick={cb.guestScore2} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="SCORE" sub="+3" color="red" onClick={cb.guestScore3} />
                  <SQ label="SCORE" sub="−" color="red" onClick={cb.guestScoreMinus} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="FOULS" sub="+" color="red" onClick={cb.guestFoulPlus} />
                  <SQ label="FOULS" sub="−" color="red" onClick={cb.guestFoulMinus} />
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <SQ label="TIME OUT" sub="TOL −" color="red" onClick={cb.guestTOL} />
                  <SQ label="◄ POSS" color="red" onClick={cb.guestPoss} active={state.possession === "guest"} />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <SQ label="BONUS" color="red" onClick={cb.guestBonus} active={state.bonus === "guest"} />
                  <SQ label="SET SHOT" sub="CLK" color="red" onClick={cb.guestSetShot} armed={armedFn === "SET SHOT" && armedSide === "guest"} />
                </div>
              </Panel>
            </div>

            <Divider />

            {/* ══ NUMPAD ══ */}
            <div style={{ flex: "0 0 auto", width: NUMPAD_W }}>
              <ZoneLabel label="NUMPAD" color="#78716c" />
              <Panel width="100%">
                <div className="rounded mb-1.5 px-2 py-1 text-center font-mono"
                  style={{
                    background: "#0c0c0c", border: "1px solid #2a2a2a",
                    color: pendingDigits ? "#fbbf24" : armedFn ? "#d4d4d4" : "#3a3a3a",
                    fontSize: "clamp(9px, 1.1vw, 12px)", minHeight: 22,
                    fontFamily: "'Courier New', monospace", letterSpacing: "0.08em",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                  }}>
                  {pendingDigits || (armedFn ? armedFn.slice(0, 10) : "──────────")}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <NK label="7" onClick={cb.n7} />
                  <NK label="8" onClick={cb.n8} />
                  <NK label="9" onClick={cb.n9} />
                  <NK label="4" onClick={cb.n4} />
                  <NK label="5" onClick={cb.n5} />
                  <NK label="6" onClick={cb.n6} />
                  <NK label="1" onClick={cb.n1} />
                  <NK label="2" onClick={cb.n2} />
                  <NK label="3" onClick={cb.n3} />
                  <NK label="CLR" onClick={cb.clr} color="red" />
                  <NK label="0" onClick={cb.n0} />
                  <NK label="ENT" onClick={cb.ent} color="green" />
                </div>
              </Panel>
            </div>

            <Divider />

            {/* ══ TRANSPORT / CONTROLS ══ */}
            <div style={{ flex: "0 0 auto", width: CTRL_W }}>
              <ZoneLabel label="CONTROLS" color="#78716c" />
              <Panel width="100%">
                <div className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: "repeat(3,1fr)" }}>
                    <div /><AR label="▲" onClick={cb.periodPlus} title="Period +" /><div />
                    <AR label="◄" onClick={cb.shotAdjMinus} title="Shot −1s" />
                    <button onPointerDown={cb.clrAll}
                      className="aspect-square w-full flex items-center justify-center rounded font-black select-none touch-none"
                      style={{
                        fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 0.85vw, 9px)",
                        background: "#222", borderBottom: "2px solid #111", color: "#888",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                        WebkitUserSelect: "none", userSelect: "none",
                      }}>CLR</button>
                    <AR label="►" onClick={cb.shotAdjPlus} title="Shot +1s" />
                    <div /><AR label="▼" onClick={cb.periodMinus} title="Period −" /><div />
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {([["30s", cb.shot30], ["14s", cb.shot14]] as [string, () => void][]).map(([lbl, fn]) => (
                      <button key={lbl} onPointerDown={fn}
                        className="rounded font-black uppercase flex items-center justify-center select-none touch-none"
                        style={{
                          height: 26, fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 0.9vw, 10px)",
                          background: "#333", borderBottom: "2px solid #111", color: "#d4d4d4",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                          WebkitUserSelect: "none", userSelect: "none",
                        }}>{lbl}</button>
                    ))}
                  </div>


                  <RB label="◼ HORN" onClick={cb.horn} color="yellow" />
                  <RB label="▶ START" onClick={cb.start} color="green" />
                  <RB label="■ STOP" onClick={cb.stop} color="red" />
                </div>
              </Panel>
            </div>

          </div>{/* end main button area */}

          {/* ── Keybind strip ── */}
          <div className="px-5 py-1.5 flex items-center gap-2 flex-wrap"
            style={{ background: "linear-gradient(180deg,#b4b4b4,#a4a4a4)", borderTop: "1px solid #888" }}>
            <span className="font-bold text-zinc-500 uppercase tracking-widest" style={{ fontSize: 8 }}>Keys:</span>
            {[
              ["Space","start/stop"], ["H/G","home/guest"], ["Q/W/E","+1/+2/+3"],
              ["R","−score"], ["F/⇧F","foul±"], ["T","TOL"], ["B","bonus"],
              ["P","poss"], ["⇧P","period"], ["N","horn"], ["0–9","digits"],
              ["Enter","commit"], ["Esc","clear"],
            ].map(([k, v]) => (
              <span key={k} className="flex items-center gap-0.5">
                <kbd className="rounded px-1 py-0.5 font-mono font-bold text-zinc-700"
                  style={{ fontSize: 8, background: "#e0e0e0", border: "1px solid #999", boxShadow: "0 1px 0 #888" }}>{k}</kbd>
                <span className="text-zinc-500" style={{ fontSize: 8 }}>{v}</span>
              </span>
            ))}
          </div>

        </div>{/* end chassis */}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STANDARD LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #050505 80%)" }}>
      {sharedTop}

      <div className="w-full max-w-4xl rounded-2xl p-6 border-2 border-zinc-700"
        style={{ background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)", boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        <div className="flex gap-4 items-center mb-4">
          <div className="text-yellow-400 font-black text-2xl tracking-wider" style={{ fontFamily: "Impact, sans-serif" }}>DAKTRONICS</div>
          <div className="flex-1" />
          <div className="text-xs text-zinc-500">ALL SPORT® 5000</div>
        </div>

        <div className="rounded p-3 mb-5 border-2 border-zinc-900"
          style={{ background: "linear-gradient(180deg, #6b8e3d 0%, #7ba348 100%)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }}>
          <div className="font-mono text-base md:text-xl whitespace-pre text-black leading-tight"
            style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}>
            {lcdL1.padEnd(20, " ")}{"\n"}{lcdL2.padEnd(20, " ")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Sport</label>
            <select value={state.sport} onChange={e => update({ sport: e.target.value as DSport })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm">
              {["basketball","football","hockey","soccer","baseball"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Layout</label>
            <select value={state.layout} onChange={e => update({ layout: e.target.value as any })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm">
              {[["indoor-bball","Indoor Basketball"],["indoor-bball-fouls","Indoor BBall + Player Fouls"],["outdoor-football","Outdoor Football"],["hockey","Hockey"],["soccer","Soccer"],["baseball","Baseball"],["minimal","Minimal"]].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Home Name</label>
            <input value={state.homeName} maxLength={8} onChange={e => update({ homeName: e.target.value.toUpperCase() })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Guest Name</label>
            <input value={state.guestName} maxLength={8} onChange={e => update({ guestName: e.target.value.toUpperCase() })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <KeyBtn label={`HOME${armedSide === "home" ? " ●" : ""}`} hint="H" color={armedSide === "home" ? "amber" : "blue"} onClick={() => press("HOME")} />
          <KeyBtn label={`GUEST${armedSide === "guest" ? " ●" : ""}`} hint="G" color={armedSide === "guest" ? "amber" : "blue"} onClick={() => press("GUEST")} />
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8 grid grid-cols-4 gap-2">
            <KeyBtn label="SCORE +1" hint="Q" onClick={() => press("SCORE+1")} armed={armedFn === "SCORE+1"} />
            <KeyBtn label="SCORE +2" hint="W" onClick={() => press("SCORE+2")} armed={armedFn === "SCORE+2"} />
            <KeyBtn label="SCORE +3" hint="E" onClick={() => press("SCORE+3")} armed={armedFn === "SCORE+3"} />
            <KeyBtn label="SCORE −" hint="R" onClick={() => press("SCORE-")} armed={armedFn === "SCORE-"} />
            <KeyBtn label="SET SCORE" onClick={() => press("SET SCORE")} armed={armedFn === "SET SCORE"} />
            <KeyBtn label="PERIOD +" hint="⇧P" onClick={() => press("PERIOD")} armed={armedFn === "PERIOD"} />
            <KeyBtn label="POSS" hint="P" onClick={() => press("POSS")} armed={armedFn === "POSS"} />
            <KeyBtn label="HORN" hint="N" color="red" onClick={() => press("HORN")} />
            <KeyBtn label="FOUL +" hint="F" onClick={() => press("FOUL+")} armed={armedFn === "FOUL+"} />
            <KeyBtn label="FOUL −" hint="⇧F" onClick={() => press("FOUL-")} armed={armedFn === "FOUL-"} />
            <KeyBtn label="TOL −" hint="T" onClick={() => press("TOL")} armed={armedFn === "TOL"} />
            <KeyBtn label="BONUS" hint="B" onClick={() => press("BONUS")} armed={armedFn === "BONUS"} />
            <KeyBtn label="DBL BONUS" onClick={() => press("DBONUS")} armed={armedFn === "DBONUS"} />
            <KeyBtn label="SET CLOCK" onClick={() => press("SET CLOCK")} armed={armedFn === "SET CLOCK"} />
            <KeyBtn label="SET SHOT" onClick={() => press("SET SHOT")} armed={armedFn === "SET SHOT"} />
            <KeyBtn label="SHOT 30" onClick={() => press("SHOT 30")} />
            <KeyBtn label="SHOT 14" onClick={() => press("SHOT 14")} />
            <KeyBtn label="SHOT ▶" hint="S" color="green" onClick={() => press("SHOT START")} />
            <KeyBtn label="SHOT ■" hint="⇧S" color="red" onClick={() => press("SHOT STOP")} />
            <KeyBtn label="DOWN +" onClick={() => press("DOWN")} armed={armedFn === "DOWN"} />
            <KeyBtn label="DIST" onClick={() => press("DIST")} armed={armedFn === "DIST"} />
            <KeyBtn label="BALL ON" onClick={() => press("BALL ON")} armed={armedFn === "BALL ON"} />
            <KeyBtn label="SOG +" onClick={() => press("SOG+")} armed={armedFn === "SOG+"} />
            <KeyBtn label="PEN MIN" onClick={() => press("PENALTY")} armed={armedFn === "PENALTY"} />
            <KeyBtn label="BALL" onClick={() => press("B")} />
            <KeyBtn label="STRIKE" onClick={() => press("S")} />
            <KeyBtn label="OUT" onClick={() => press("O")} />
            <KeyBtn label="INN ½" onClick={() => press("INNING")} />
          </div>
          <div className="col-span-4 grid grid-cols-3 gap-2">
            {["7","8","9","4","5","6","1","2","3"].map(n =>
              <KeyBtn key={n} label={n} color="dark" onClick={() => press(n)} />)}
            <KeyBtn label="CLR" color="red" onClick={() => press("CLR")} />
            <KeyBtn label="0" color="dark" onClick={() => press("0")} />
            <KeyBtn label="ENT" color="green" onClick={() => press("ENTER")} />
            <KeyBtn label={state.clockRunning ? "■ STOP" : "▶ START"} color={state.clockRunning ? "red" : "green"}
              onClick={() => press(state.clockRunning ? "STOP" : "START")} className="col-span-3" hint="Space" />
          </div>
        </div>

        <div className="mt-4 text-[10px] text-zinc-500 leading-relaxed">
          Keys: <kbd>Space</kbd> start/stop · <kbd>H</kbd>/<kbd>G</kbd> select team · <kbd>Q/W/E</kbd> +1/+2/+3 · <kbd>R</kbd> subtract · <kbd>F</kbd> foul · <kbd>P</kbd> possession · <kbd>B</kbd> bonus · <kbd>T</kbd> TOL · <kbd>N</kbd> horn · <kbd>S</kbd> shot clock · <kbd>0–9</kbd> numpad · <kbd>Enter</kbd> commit · <kbd>Esc</kbd> clear
        </div>
      </div>
    </div>
  );
}
