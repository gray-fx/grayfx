import { useDAS5000, formatClock, DSport } from "@/hooks/use-das5000";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

type Side = "home" | "guest";
type ControllerLayout = "standard" | "basketball-overlay";

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
      case "SCORE-": if (side) update(p => ({ [side === "home" ? "homeScore" : "guestScore"]: Math.max(0, (side === "home" ? p.homeScore : p.guestScore) - (n ?? 1)) })); break;
      case "SET SCORE": if (side && n !== null) update({ [side === "home" ? "homeScore" : "guestScore"]: n } as any); break;
      case "PERIOD": update({ period: n ?? state.period + 1 }); break;
      case "FOUL+": if (side) update(p => ({ [side === "home" ? "homeFouls" : "guestFouls"]: (side === "home" ? p.homeFouls : p.guestFouls) + 1 })); break;
      case "FOUL-": if (side) update(p => ({ [side === "home" ? "homeFouls" : "guestFouls"]: Math.max(0, (side === "home" ? p.homeFouls : p.guestFouls) - 1) })); break;
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
    if (key === "STOP") { update({ clockRunning: false }); return; }
    if (key === "HORN") { update({ hornAt: Date.now() }); return; }
    if (key === "SHOT START") { update({ shotClockRunning: true }); return; }
    if (key === "SHOT STOP") { update({ shotClockRunning: false }); return; }
    if (key === "SHOT 30") { update({ shotClockMs: 30000, shotClockRunning: false }); return; }
    if (key === "SHOT 14") { update({ shotClockMs: 14000, shotClockRunning: false }); return; }
    if (key === "HOME") { setArmedSide("home"); return; }
    if (key === "GUEST") { setArmedSide("guest"); return; }
    setArmedFn(key);
  }, [commit, update]);

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

  const sharedTop = (
    <div className="flex justify-between items-center w-full max-w-6xl mb-4">
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

  // ─────────────────────────────────────────────
  // BASKETBALL OVERLAY LAYOUT
  // ─────────────────────────────────────────────
  if (controllerLayout === "basketball-overlay") {

    const SQ = ({
      label, sub, color, onClick, armed = false, active = false,
    }: {
      label: string; sub?: string; color: "green" | "red" | "white" | "dark";
      onClick: () => void; armed?: boolean; active?: boolean;
    }) => {
      const bg: Record<string, { base: string; on: string; border: string; shadow: string }> = {
        green: { base: "#14532d", on: "#16a34a", border: "#052e16", shadow: "rgba(34,197,94,0.25)" },
        red:   { base: "#7f1d1d", on: "#dc2626", border: "#450a0a", shadow: "rgba(239,68,68,0.25)" },
        white: { base: "#c8c8c8", on: "#fbbf24", border: "#888", shadow: "rgba(251,191,36,0.2)" },
        dark:  { base: "#3a3a3a", on: "#6b6b6b", border: "#111", shadow: "none" },
      };
      const c = bg[color];
      const isOn = armed || active;
      return (
        <button
          onClick={onClick}
          className="aspect-square w-full flex flex-col items-center justify-center rounded transition-all active:translate-y-px hover:brightness-125"
          style={{
            background: isOn ? c.on : c.base,
            borderBottom: `3px solid ${c.border}`,
            boxShadow: isOn
              ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px ${c.shadow}`
              : "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)",
            outline: armed ? "2px solid #fbbf24" : "none",
            outlineOffset: 2,
          }}
        >
          <span className="font-black uppercase leading-none text-center px-0.5"
            style={{
              fontFamily: "Impact, 'Arial Narrow', sans-serif",
              fontSize: "clamp(6px, 1.05vw, 9px)",
              color: color === "white" ? (isOn ? "#000" : "#1a1a1a") : "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
              textShadow: color !== "white" ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
            }}>
            {label}
          </span>
          {sub && (
            <span className="font-bold uppercase leading-none text-center px-0.5 mt-0.5"
              style={{
                fontFamily: "Impact, 'Arial Narrow', sans-serif",
                fontSize: "clamp(5px, 0.8vw, 7px)",
                color: color === "white" ? (isOn ? "#000" : "#555") : "rgba(255,255,255,0.7)",
                letterSpacing: "0.02em",
              }}>
              {sub}
            </span>
          )}
        </button>
      );
    };

    const NQ = ({ label, onClick, color = "dark" }: { label: string; onClick: () => void; color?: "dark" | "red" | "green" }) => {
      const styles: Record<string, { bg: string; border: string; text: string }> = {
        dark:  { bg: "#444", border: "#111", text: "#fbbf24" },
        red:   { bg: "#991b1b", border: "#450a0a", text: "#fff" },
        green: { bg: "#15803d", border: "#052e16", text: "#fff" },
      };
      const s = styles[color];
      return (
        <button onClick={onClick}
          className="aspect-square w-full flex items-center justify-center rounded font-black uppercase transition-all active:translate-y-px hover:brightness-115"
          style={{
            background: s.bg,
            borderBottom: `3px solid ${s.border}`,
            color: s.text,
            fontFamily: "Impact, sans-serif",
            fontSize: "clamp(8px, 1.3vw, 12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.5)",
          }}>
          {label}
        </button>
      );
    };

    // Rectangular tall button for right side controls
    const RB = ({ label, sub, onClick, color }: { label: string; sub?: string; onClick: () => void; color: "green" | "red" | "yellow" | "gray" }) => {
      const s: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
        green:  { bg: "linear-gradient(180deg,#16a34a,#14532d)", border: "#052e16", text: "#fff", shadow: "rgba(22,163,74,0.3)" },
        red:    { bg: "linear-gradient(180deg,#dc2626,#7f1d1d)", border: "#450a0a", text: "#fff", shadow: "rgba(220,38,38,0.3)" },
        yellow: { bg: "linear-gradient(180deg,#fde047,#ca8a04)", border: "#713f12", text: "#000", shadow: "rgba(253,224,71,0.3)" },
        gray:   { bg: "linear-gradient(180deg,#4b4b4b,#2a2a2a)", border: "#111", text: "#d4d4d4", shadow: "none" },
      };
      const c = s[color];
      return (
        <button onClick={onClick}
          className="w-full rounded font-black uppercase tracking-wider transition-all active:translate-y-0.5 hover:brightness-110 flex flex-col items-center justify-center gap-0.5"
          style={{
            minHeight: 44,
            background: c.bg,
            borderBottom: `4px solid ${c.border}`,
            color: c.text,
            fontFamily: "Impact, sans-serif",
            fontSize: "clamp(9px, 1.2vw, 13px)",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 10px ${c.shadow}`,
          }}>
          <span>{label}</span>
          {sub && <span style={{ fontSize: "clamp(7px, 0.85vw, 9px)", opacity: 0.75 }}>{sub}</span>}
        </button>
      );
    };

    const AR = ({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) => (
      <button onClick={onClick} title={title}
        className="aspect-square w-full flex items-center justify-center rounded font-black hover:brightness-115 active:translate-y-px"
        style={{
          fontFamily: "Impact, sans-serif",
          fontSize: "clamp(8px, 1.2vw, 11px)",
          background: "#3a3a3a",
          borderBottom: "2px solid #111",
          color: "#e4e4e4",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
        {label}
      </button>
    );

    // Panel wrapper with label and accent bar
    const Panel = ({ label, accent, children, width }: { label: string; accent: string; children: React.ReactNode; width: string }) => (
      <div style={{ flex: `0 0 auto`, width }}>
        {/* Zone label */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div style={{ width: 3, height: 14, background: accent, borderRadius: 2, flexShrink: 0 }} />
          <span className="font-black uppercase tracking-widest"
            style={{
              fontFamily: "Impact, 'Arial Narrow', sans-serif",
              fontSize: "clamp(8px, 0.9vw, 10px)",
              color: accent,
              letterSpacing: "0.12em",
            }}>
            {label}
          </span>
        </div>
        {/* Inset panel */}
        <div className="rounded-lg p-2"
          style={{
            background: "linear-gradient(160deg, #1c1c1c, #161616)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
          {children}
        </div>
      </div>
    );

    // Vertical gutter / separator
    const Sep = () => (
      <div style={{ flex: "0 0 auto", width: 16, display: "flex", alignItems: "stretch", justifyContent: "center", paddingTop: 24 }}>
        <div style={{ width: 1, background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)" }} />
      </div>
    );

    return (
      <div className="min-h-screen w-full p-3 md:p-5 flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #050505 80%)" }}>
        {sharedTop}

        {/* Console chassis */}
        <div className="w-full max-w-6xl rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #d6d6d6 0%, #b0b0b0 50%, #c0c0c0 100%)",
            border: "2px solid #888",
            boxShadow: "0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.2)",
          }}>

          {/* ── TOP BEZEL: Brand + LCD + Config ── */}
          <div className="flex items-center gap-4 px-5 py-3"
            style={{
              background: "linear-gradient(180deg, #e0e0e0 0%, #c8c8c8 100%)",
              borderBottom: "2px solid #999",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}>

            <div className="shrink-0">
              <div className="font-black tracking-widest text-zinc-600 leading-none" style={{ fontFamily: "Impact, sans-serif", fontSize: 13 }}>DAKTRONICS</div>
              <div className="text-zinc-500 tracking-widest font-bold" style={{ fontSize: 8 }}>ALL SPORT® 5000</div>
            </div>

            {/* LCD */}
            <div className="rounded px-3 py-2 shrink-0"
              style={{
                background: "linear-gradient(180deg, #4a6b28 0%, #5a7e32 100%)",
                border: "2px solid #333",
                boxShadow: "inset 0 3px 10px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.3)",
              }}>
              <div className="font-mono whitespace-pre leading-snug"
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "clamp(10px, 1.3vw, 14px)",
                  letterSpacing: "0.08em",
                  color: "#1a1a1a",
                  textShadow: "0 0 4px rgba(0,0,0,0.3)",
                }}>
                {lcdL1.padEnd(20, " ")}{"\n"}{lcdL2.padEnd(20, " ")}
              </div>
            </div>

            {/* Config selects */}
            <div className="flex gap-3 flex-1 justify-center flex-wrap">
              {([
                ["Sport", <select key="sport" value={state.sport} onChange={e => update({ sport: e.target.value as DSport })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono">
                  {["basketball","football","hockey","soccer","baseball"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>],
                ["Layout", <select key="layout" value={state.layout} onChange={e => update({ layout: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono">
                  {[["indoor-bball","Indoor Bball"],["indoor-bball-fouls","Bball+Fouls"],["outdoor-football","Football"],["hockey","Hockey"],["soccer","Soccer"],["baseball","Baseball"],["minimal","Minimal"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>],
                ["Home", <input key="home" value={state.homeName} maxLength={8} onChange={e => update({ homeName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono" />],
                ["Guest", <input key="guest" value={state.guestName} maxLength={8} onChange={e => update({ guestName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-amber-300 text-xs font-mono" />],
              ] as [string, React.ReactNode][]).map(([label, el]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="font-bold uppercase tracking-wider text-zinc-500" style={{ fontSize: 9 }}>{label}</span>
                  {el}
                </div>
              ))}
            </div>

            <div className="text-right shrink-0 hidden lg:block">
              <div className="font-black text-zinc-600 tracking-widest leading-none" style={{ fontFamily: "Impact, sans-serif", fontSize: 15 }}>ALL SPORT</div>
              <div className="font-bold text-zinc-500 tracking-widest" style={{ fontSize: 9 }}>5000 SERIES · CONTROL CONSOLE</div>
            </div>
          </div>

          {/* ── MAIN BUTTON AREA ── */}
          <div className="flex items-start justify-center px-5 py-4 gap-0"
            style={{ background: "linear-gradient(160deg, #c8c8c8 0%, #b0b0b0 100%)" }}>

            {/* ═══ HOME PANEL (green) ═══ */}
            <Panel label="◄ HOME" accent="#22c55e" width="clamp(96px, 14vw, 138px)">
              <div className="grid grid-cols-2 gap-1">
                {/* Score column */}
                <SQ label="SCORE" sub="+1" color="green"
                  onClick={() => act(() => update(p => ({ homeScore: p.homeScore + 1 })))} />
                <SQ label="SCORE" sub="+2" color="green"
                  onClick={() => act(() => update(p => ({ homeScore: p.homeScore + 2 })))} />
                <SQ label="SCORE" sub="+3" color="green"
                  onClick={() => act(() => update(p => ({ homeScore: p.homeScore + 3 })))} />
                <SQ label="SCORE" sub="−" color="green"
                  onClick={() => act(() => update(p => ({ homeScore: Math.max(0, p.homeScore - 1) })))} />
                {/* Fouls column */}
                <SQ label="FOULS" sub="+" color="green"
                  onClick={() => act(() => update(p => ({ homeFouls: p.homeFouls + 1 })))} />
                <SQ label="FOULS" sub="−" color="green"
                  onClick={() => act(() => update(p => ({ homeFouls: Math.max(0, p.homeFouls - 1) })))} />
                {/* Possession / Bonus */}
                <SQ label="POSS ►" color="green"
                  onClick={() => update({ possession: "home" })}
                  active={state.possession === "home"} />
                <SQ label="BONUS" color="green"
                  onClick={() => act(() => update(p => ({ bonus: p.bonus === "home" ? "none" : "home" })))}
                  active={state.bonus === "home"} />
                {/* TOL / Player fouls */}
                <SQ label="TIME OUT" sub="TOL −" color="green"
                  onClick={() => act(() => update(p => ({ homeTOL: Math.max(0, p.homeTOL - 1) })))} />
                <SQ label="SHOT CLK" sub="SET" color="green"
                  onClick={() => { setArmedSide("home"); press("SET SHOT"); }}
                  armed={armedFn === "SET SHOT" && armedSide === "home"} />
              </div>
            </Panel>

            <Sep />

            {/* ═══ SHARED / NEUTRAL PANEL ═══ */}
            <Panel label="SHARED" accent="#a1a1aa" width="clamp(96px, 14vw, 138px)">
              {/* HOME / GUEST selectors at the top — key for arming side on shared functions */}
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={() => press("HOME")}
                  className="rounded font-black uppercase tracking-wider transition-all active:translate-y-px hover:brightness-110 flex items-center justify-center"
                  style={{
                    height: 28,
                    fontFamily: "Impact, 'Arial Narrow', sans-serif",
                    fontSize: "clamp(7px, 0.95vw, 10px)",
                    background: armedSide === "home" ? "#22c55e" : "#15532d",
                    borderBottom: "3px solid #052e16",
                    color: "#fff",
                    boxShadow: armedSide === "home" ? "0 0 8px rgba(34,197,94,0.5)" : "inset 0 1px 0 rgba(255,255,255,0.1)",
                    outline: armedSide === "home" ? "2px solid #fbbf24" : "none",
                    outlineOffset: 2,
                  }}>
                  ◄ HOME
                </button>
                <button
                  onClick={() => press("GUEST")}
                  className="rounded font-black uppercase tracking-wider transition-all active:translate-y-px hover:brightness-110 flex items-center justify-center"
                  style={{
                    height: 28,
                    fontFamily: "Impact, 'Arial Narrow', sans-serif",
                    fontSize: "clamp(7px, 0.95vw, 10px)",
                    background: armedSide === "guest" ? "#dc2626" : "#7f1d1d",
                    borderBottom: "3px solid #450a0a",
                    color: "#fff",
                    boxShadow: armedSide === "guest" ? "0 0 8px rgba(220,38,38,0.5)" : "inset 0 1px 0 rgba(255,255,255,0.1)",
                    outline: armedSide === "guest" ? "2px solid #fbbf24" : "none",
                    outlineOffset: 2,
                  }}>
                  GUEST ►
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {/* SET SCORE — needs side selected first */}
                <SQ label="SET SCORE" color="white"
                  onClick={() => setArmedFn("SET SCORE")}
                  armed={armedFn === "SET SCORE"} />
                {/* SET CLOCK — no side needed */}
                <SQ label="SET CLOCK" color="white"
                  onClick={() => press("SET CLOCK")}
                  armed={armedFn === "SET CLOCK"} />
                {/* Period */}
                <SQ label="PERIOD" sub="+" color="white"
                  onClick={() => update({ period: state.period + 1 })} />
                <SQ label="SET PERIOD" color="white"
                  onClick={() => press("PERIOD")}
                  armed={armedFn === "PERIOD"} />
                {/* Shot clock controls */}
                <SQ label="SHOT" sub="START" color="white"
                  onClick={() => press("SHOT START")} />
                <SQ label="SHOT" sub="STOP" color="white"
                  onClick={() => press("SHOT STOP")} />
                <SQ label="SHOT 30" color="white"
                  onClick={() => press("SHOT 30")} />
                <SQ label="SHOT 14" color="white"
                  onClick={() => press("SHOT 14")} />
                {/* SET SHOT — needs side */}
                <SQ label="SET SHOT" sub="CLK" color="white"
                  onClick={() => setArmedFn("SET SHOT")}
                  armed={armedFn === "SET SHOT" && !armedSide} />
                {/* DBL Bonus — needs side */}
                <SQ label="DBL BONUS" color="white"
                  onClick={() => setArmedFn("DBONUS")}
                  armed={armedFn === "DBONUS"} />
              </div>

              {/* Hint: select team first for these functions */}
              {armedFn && !armedSide && ["SET SCORE","DBONUS","SET SHOT"].includes(armedFn) && (
                <div className="mt-1.5 text-center rounded px-1 py-1"
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", fontSize: 8, color: "#fbbf24", fontFamily: "Impact, sans-serif", letterSpacing: "0.06em" }}>
                  ▲ SELECT HOME or GUEST ▲
                </div>
              )}
            </Panel>

            <Sep />

            {/* ═══ GUEST PANEL (red) — mirror of HOME ═══ */}
            <Panel label="GUEST ►" accent="#ef4444" width="clamp(96px, 14vw, 138px)">
              <div className="grid grid-cols-2 gap-1">
                <SQ label="SCORE" sub="+1" color="red"
                  onClick={() => act(() => update(p => ({ guestScore: p.guestScore + 1 })))} />
                <SQ label="SCORE" sub="+2" color="red"
                  onClick={() => act(() => update(p => ({ guestScore: p.guestScore + 2 })))} />
                <SQ label="SCORE" sub="+3" color="red"
                  onClick={() => act(() => update(p => ({ guestScore: p.guestScore + 3 })))} />
                <SQ label="SCORE" sub="−" color="red"
                  onClick={() => act(() => update(p => ({ guestScore: Math.max(0, p.guestScore - 1) })))} />
                <SQ label="FOULS" sub="+" color="red"
                  onClick={() => act(() => update(p => ({ guestFouls: p.guestFouls + 1 })))} />
                <SQ label="FOULS" sub="−" color="red"
                  onClick={() => act(() => update(p => ({ guestFouls: Math.max(0, p.guestFouls - 1) })))} />
                <SQ label="◄ POSS" color="red"
                  onClick={() => update({ possession: "guest" })}
                  active={state.possession === "guest"} />
                <SQ label="BONUS" color="red"
                  onClick={() => act(() => update(p => ({ bonus: p.bonus === "guest" ? "none" : "guest" })))}
                  active={state.bonus === "guest"} />
                <SQ label="TIME OUT" sub="TOL −" color="red"
                  onClick={() => act(() => update(p => ({ guestTOL: Math.max(0, p.guestTOL - 1) })))} />
                <SQ label="SHOT CLK" sub="SET" color="red"
                  onClick={() => { setArmedSide("guest"); press("SET SHOT"); }}
                  armed={armedFn === "SET SHOT" && armedSide === "guest"} />
              </div>
            </Panel>

            <Sep />

            {/* ═══ NUMPAD ═══ */}
            <Panel label="NUMPAD" accent="#78716c" width="clamp(96px, 13vw, 128px)">
              {/* Pending display */}
              <div className="rounded mb-1.5 px-2 py-1 text-center font-mono"
                style={{
                  background: "#0d0d0d",
                  border: "1px solid #333",
                  color: pendingDigits ? "#fbbf24" : armedFn ? "#d4d4d4" : "#444",
                  fontSize: "clamp(9px, 1.2vw, 13px)",
                  minHeight: 24,
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.08em",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                }}>
                {pendingDigits || (armedFn ? armedFn.slice(0, 9) : "──────")}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {["7","8","9","4","5","6","1","2","3"].map(n =>
                  <NQ key={n} label={n} onClick={() => press(n)} />)}
                <NQ label="CLR" onClick={() => press("CLR")} color="red" />
                <NQ label="0" onClick={() => press("0")} />
                <NQ label="ENT" onClick={() => press("ENTER")} color="green" />
              </div>
            </Panel>

            <Sep />

            {/* ═══ CONTROLS COLUMN ═══ */}
            <Panel label="CONTROLS" accent="#78716c" width="clamp(80px, 11vw, 108px)">
              <div className="flex flex-col gap-1.5">

                {/* Arrow diamond — period and shot adj */}
                <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
                  <div />
                  <AR label="▲" onClick={() => update({ period: state.period + 1 })} title="Period +" />
                  <div />
                  <AR label="◄" onClick={() => update({ shotClockMs: Math.max(0, state.shotClockMs - 1000) })} title="Shot −1s" />
                  <button
                    onClick={() => { setArmedFn(null); setArmedSide(null); setPendingDigits(""); setStatus("READY"); }}
                    className="aspect-square w-full flex items-center justify-center rounded font-black hover:brightness-110 active:translate-y-px"
                    style={{
                      fontFamily: "Impact, sans-serif",
                      fontSize: "clamp(7px, 0.9vw, 9px)",
                      background: "#2a2a2a",
                      borderBottom: "2px solid #111",
                      color: "#a1a1aa",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}>
                    CLR
                  </button>
                  <AR label="►" onClick={() => update({ shotClockMs: state.shotClockMs + 1000 })} title="Shot +1s" />
                  <div />
                  <AR label="▼" onClick={() => update({ period: Math.max(1, state.period - 1) })} title="Period −" />
                  <div />
                </div>

                {/* Shot quick resets */}
                <div className="grid grid-cols-2 gap-1">
                  <button onClick={() => press("SHOT 30")}
                    className="rounded font-black uppercase hover:brightness-110 active:translate-y-px flex items-center justify-center"
                    style={{
                      height: 28,
                      fontFamily: "Impact, sans-serif",
                      fontSize: "clamp(7px, 0.9vw, 10px)",
                      background: "#3a3a3a",
                      borderBottom: "2px solid #111",
                      color: "#d4d4d4",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}>
                    30s
                  </button>
                  <button onClick={() => press("SHOT 14")}
                    className="rounded font-black uppercase hover:brightness-110 active:translate-y-px flex items-center justify-center"
                    style={{
                      height: 28,
                      fontFamily: "Impact, sans-serif",
                      fontSize: "clamp(7px, 0.9vw, 10px)",
                      background: "#3a3a3a",
                      borderBottom: "2px solid #111",
                      color: "#d4d4d4",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}>
                    14s
                  </button>
                </div>

                {/* Main action buttons */}
                <RB label="◼ HORN" onClick={() => press("HORN")} color="yellow" />
                <RB label="▶ START" sub="SPACE" onClick={() => press("START")} color="green" />
                <RB label="■ STOP" sub="SPACE" onClick={() => press("STOP")} color="red" />
              </div>
            </Panel>

          </div>{/* end main button area */}

          {/* ── Bottom keybind bar ── */}
          <div className="px-5 py-2 flex items-center gap-2 flex-wrap"
            style={{ background: "linear-gradient(180deg, #b0b0b0, #a0a0a0)", borderTop: "1px solid #888" }}>
            <span className="font-bold text-zinc-500 uppercase tracking-widest" style={{ fontSize: 8 }}>Keyboard:</span>
            {[
              ["Space","start/stop"], ["H/G","home/guest"], ["Q/W/E","+1/+2/+3"],
              ["R","− score"], ["F/⇧F","foul±"], ["T","TOL"], ["B","bonus"],
              ["P","poss"], ["⇧P","period"], ["N","horn"], ["0–9","digits"],
              ["Enter","commit"], ["Esc","clear"],
            ].map(([k, v]) => (
              <span key={k} className="flex items-center gap-0.5">
                <kbd className="rounded px-1 py-0.5 font-mono font-bold text-zinc-700"
                  style={{ fontSize: 8, background: "#e0e0e0", border: "1px solid #999", boxShadow: "0 1px 0 #888" }}>
                  {k}
                </kbd>
                <span className="text-zinc-500" style={{ fontSize: 8 }}>{v}</span>
              </span>
            ))}
          </div>

        </div>{/* end chassis */}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STANDARD LAYOUT (unchanged)
  // ─────────────────────────────────────────────
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

function pad(s: string, n: number) { return (s || "").slice(0, n).padEnd(n, " "); }
function pad3(n: number) { return String(n).padStart(3, " "); }

function KeyBtn({ label, hint, onClick, color = "gray", armed = false, className = "" }: {
  label: string; hint?: string; onClick: () => void; color?: "gray"|"red"|"green"|"blue"|"amber"|"dark"; armed?: boolean; className?: string;
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
