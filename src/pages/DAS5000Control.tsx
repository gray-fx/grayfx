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

    // Square membrane button — aspect-square enforced via padding trick
    // label = top line, sub = smaller second line
    const SQ = ({
      label, sub, color, onClick, armed = false, active = false,
    }: {
      label: string; sub?: string; color: "green" | "red" | "white" | "dark";
      onClick: () => void; armed?: boolean; active?: boolean;
    }) => {
      const bg: Record<string, { base: string; on: string; border: string }> = {
        green: { base: "#166534", on: "#22c55e", border: "#052e16" },
        red:   { base: "#991b1b", on: "#ef4444", border: "#450a0a" },
        white: { base: "#d4d4d4", on: "#fbbf24", border: "#71717a" },
        dark:  { base: "#3f3f46", on: "#78716c", border: "#18181b" },
      };
      const c = bg[color];
      const isOn = armed || active;
      return (
        <button
          onClick={onClick}
          className="aspect-square w-full flex flex-col items-center justify-center rounded border-b-2 transition-all active:translate-y-px active:border-b-0 hover:brightness-125"
          style={{
            background: isOn ? c.on : c.base,
            borderColor: c.border,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.6)",
            outline: armed ? "2px solid #fbbf24" : "none",
            outlineOffset: 1,
          }}
        >
          <span className="font-black uppercase leading-none text-center px-0.5"
            style={{
              fontFamily: "Impact, 'Arial Narrow', sans-serif",
              fontSize: "clamp(6px, 1.1vw, 9px)",
              color: color === "white" ? (isOn ? "#000" : "#1a1a1a") : "#fff",
              letterSpacing: "0.03em",
              lineHeight: 1.1,
            }}>
            {label}
          </span>
          {sub && (
            <span className="font-bold uppercase leading-none text-center px-0.5 mt-0.5"
              style={{
                fontFamily: "Impact, 'Arial Narrow', sans-serif",
                fontSize: "clamp(5px, 0.85vw, 7px)",
                color: color === "white" ? (isOn ? "#000" : "#444") : "rgba(255,255,255,0.75)",
                letterSpacing: "0.02em",
              }}>
              {sub}
            </span>
          )}
        </button>
      );
    };

    // Numpad button (square)
    const NQ = ({ label, onClick, color = "dark" }: { label: string; onClick: () => void; color?: "dark" | "red" | "green" }) => {
      const styles: Record<string, string> = {
        dark:  "bg-zinc-700 border-zinc-900 text-amber-300 hover:bg-zinc-600",
        red:   "bg-red-700 border-red-900 text-white hover:bg-red-600",
        green: "bg-green-700 border-green-900 text-white hover:bg-green-600",
      };
      return (
        <button onClick={onClick}
          className={`aspect-square w-full flex items-center justify-center rounded border-b-2 font-black uppercase transition-all active:translate-y-px active:border-b-0 hover:brightness-110 ${styles[color]}`}
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: "clamp(8px, 1.3vw, 11px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}>
          {label}
        </button>
      );
    };

    // Right-side tall buttons (not square — these are rectangular on the real unit)
    const RB = ({ label, onClick, color }: { label: string; onClick: () => void; color: "green" | "red" | "yellow" }) => {
      const s: Record<string, string> = {
        green:  "bg-green-600 border-green-900 text-white hover:bg-green-500",
        red:    "bg-red-600 border-red-900 text-white hover:bg-red-500",
        yellow: "bg-yellow-400 border-yellow-700 text-black hover:bg-yellow-300",
      };
      return (
        <button onClick={onClick}
          className={`w-full rounded border-b-4 font-black text-sm uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-2 ${s[color]}`}
          style={{
            minHeight: 48,
            fontFamily: "Impact, sans-serif",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)",
          }}>
          {label}
        </button>
      );
    };

    // Arrow pad square button
    const AR = ({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) => (
      <button onClick={onClick} title={title}
        className="aspect-square w-full flex items-center justify-center rounded bg-zinc-600 border-b-2 border-zinc-900 text-white font-black hover:bg-zinc-500 active:translate-y-px active:border-b-0"
        style={{ fontFamily: "Impact, sans-serif", fontSize: "clamp(8px, 1.2vw, 11px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
        {label}
      </button>
    );

    return (
      <div className="min-h-screen w-full p-3 md:p-5 flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #050505 80%)" }}>
        {sharedTop}

        {/* Console chassis */}
        <div className="w-full max-w-6xl rounded-xl border-2 border-zinc-500 overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #cecece 0%, #a8a8a8 60%, #b8b8b8 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}>

          {/* Top: LCD + config */}
          <div className="flex items-center gap-4 px-5 py-3 border-b-2 border-zinc-500"
            style={{ background: "linear-gradient(180deg, #ddd 0%, #bbb 100%)" }}>
            <div className="text-zinc-600 font-black text-xs tracking-widest hidden sm:block" style={{ fontFamily: "Impact, sans-serif" }}>
              DAKTRONICS
            </div>
            {/* LCD */}
            <div className="rounded px-2.5 py-1.5 border-2 border-zinc-600"
              style={{ background: "linear-gradient(180deg, #5c7a2e 0%, #6e933a 100%)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)" }}>
              <div className="font-mono whitespace-pre text-black leading-tight"
                style={{ fontFamily: "'Courier New', monospace", fontSize: "clamp(10px, 1.4vw, 14px)", letterSpacing: "0.05em" }}>
                {lcdL1.padEnd(20, " ")}{"\n"}{lcdL2.padEnd(20, " ")}
              </div>
            </div>
            {/* Config */}
            <div className="flex gap-2 flex-1 justify-center flex-wrap">
              {([
                ["Sport", <select key="sport" value={state.sport} onChange={e => update({ sport: e.target.value as DSport })}
                  className="bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs">
                  {["basketball","football","hockey","soccer","baseball"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>],
                ["Layout", <select key="layout" value={state.layout} onChange={e => update({ layout: e.target.value as any })}
                  className="bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs">
                  {[["indoor-bball","Indoor Bball"],["indoor-bball-fouls","Bball+Fouls"],["outdoor-football","Football"],["hockey","Hockey"],["soccer","Soccer"],["baseball","Baseball"],["minimal","Minimal"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>],
                ["Home", <input key="home" value={state.homeName} maxLength={8} onChange={e => update({ homeName: e.target.value.toUpperCase() })} className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs" />],
                ["Guest", <input key="guest" value={state.guestName} maxLength={8} onChange={e => update({ guestName: e.target.value.toUpperCase() })} className="w-14 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs" />],
              ] as [string, React.ReactNode][]).map(([label, el]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{label}</span>
                  {el}
                </div>
              ))}
            </div>
            {/* Logo */}
            <div className="text-right hidden lg:block shrink-0">
              <div className="font-black text-zinc-700 text-base tracking-widest leading-none" style={{ fontFamily: "Impact, sans-serif" }}>ALL SPORT</div>
              <div className="text-zinc-600 text-[10px] font-bold tracking-widest">5000 SERIES</div>
              <div className="text-zinc-500 text-[8px] tracking-widest uppercase">Control Console</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              MAIN BUTTON AREA
              Layout: [HOME 2col] [SHARED 2col] [GUEST 2col] [NUMPAD 3col] [CONTROLS]
              ══════════════════════════════════════════════════════════ */}
          <div className="flex gap-2 px-4 pb-4 pt-3 items-start">

            {/* ── HOME (green) — 2 columns × 5 rows ── */}
            <div className="flex-1 min-w-0">
              {/* HOME header */}
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-1"
                style={{ color: "#fff", background: "#15803d", fontFamily: "Impact, sans-serif" }}>
                ◄ HOME
              </div>
              {/* 2-col grid, 5 rows */}
              <div className="grid grid-cols-2 gap-1">
                {/* Row 1 */}
                <SQ label="SCORE" sub="+1" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("SCORE+1"); setTimeout(commit, 0); }}
                  armed={armedFn === "SCORE+1" && armedSide === "home"} />
                <SQ label="TIME" sub="SHOT TIME" color="green"
                  onClick={() => { setArmedSide("home"); press("SET SHOT"); }}
                  armed={armedFn === "SET SHOT" && armedSide === "home"} />
                {/* Row 2 */}
                <SQ label="SCORE" sub="+2" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("SCORE+2"); setTimeout(commit, 0); }} />
                <SQ label="TEAM FOULS" sub="FOUL +" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("FOUL+"); setTimeout(commit, 0); }}
                  armed={armedFn === "FOUL+" && armedSide === "home"} />
                {/* Row 3 */}
                <SQ label="SCORE" sub="+3" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("SCORE+3"); setTimeout(commit, 0); }} />
                <SQ label="TEAM FOULS" sub="FOUL -" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("FOUL-"); setTimeout(commit, 0); }}
                  armed={armedFn === "FOUL-" && armedSide === "home"} />
                {/* Row 4 */}
                <SQ label="SCORE" sub="-" color="green"
                  onClick={() => { setArmedSide("home"); setArmedFn("SCORE-"); setTimeout(commit, 0); }}
                  armed={armedFn === "SCORE-" && armedSide === "home"} />
                <SQ label="POSS ►" color="green"
                  onClick={() => update({ possession: "home" })}
                  active={state.possession === "home"} />
                {/* Row 5 */}
                <SQ label="PLAYER" color="green" onClick={() => {}} />
                <SQ label="MADE SUB" color="green" onClick={() => {}} />
              </div>
            </div>

            {/* ── SHARED (white) — 2 columns × 5 rows ── */}
            <div className="flex-1 min-w-0">
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-1 text-zinc-500"
                style={{ fontFamily: "Impact, sans-serif", background: "rgba(0,0,0,0.1)" }}>
                SHARED
              </div>
              <div className="grid grid-cols-2 gap-1">
                {/* Row 1 */}
                <SQ label="RECALL" sub="BLANK TIME" color="white"
                  onClick={() => press("SET CLOCK")}
                  armed={armedFn === "SET CLOCK"} />
                <SQ label="SET SCORE" sub="SET ONLY" color="white"
                  onClick={() => { setArmedSide(null); setArmedFn("SET SCORE"); }}
                  armed={armedFn === "SET SCORE" && !armedSide} />
                {/* Row 2: arrow up + OUT OF GAME */}
                <SQ label="▲ PERIOD" color="white"
                  onClick={() => { update({ period: state.period + 1 }); }} />
                <SQ label="OUT OF GAME" color="white" onClick={() => {}} />
                {/* Row 3: IN GAME + DELETE PLAYER FOUL */}
                <SQ label="IN GAME" color="white" onClick={() => {}} />
                <SQ label="DELETE PLAYER FOUL" color="white" onClick={() => {}} />
                {/* Row 4: BLANK TEAM SUB + CLEAR TEAM SUB */}
                <SQ label="BLANK TEAM SUB" color="white" onClick={() => {}} />
                <SQ label="CLEAR TEAM SUB" color="white" onClick={() => {}} />
                {/* Row 5: FRIENDS SUB + empty/period down */}
                <SQ label="FRIENDS SUB" color="white" onClick={() => {}} />
                <SQ label="▼ PERIOD" color="white"
                  onClick={() => update({ period: Math.max(1, state.period - 1) })} />
              </div>
            </div>

            {/* ── GUEST (red) — 2 columns × 5 rows — mirror of HOME ── */}
            <div className="flex-1 min-w-0">
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-1"
                style={{ color: "#fff", background: "#b91c1c", fontFamily: "Impact, sans-serif" }}>
                GUEST ►
              </div>
              <div className="grid grid-cols-2 gap-1">
                {/* Row 1 */}
                <SQ label="TIME" sub="SHOT TIME" color="red"
                  onClick={() => { setArmedSide("guest"); press("SET SHOT"); }}
                  armed={armedFn === "SET SHOT" && armedSide === "guest"} />
                <SQ label="SCORE" sub="+1" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("SCORE+1"); setTimeout(commit, 0); }}
                  armed={armedFn === "SCORE+1" && armedSide === "guest"} />
                {/* Row 2 */}
                <SQ label="TEAM FOULS" sub="FOUL +" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("FOUL+"); setTimeout(commit, 0); }}
                  armed={armedFn === "FOUL+" && armedSide === "guest"} />
                <SQ label="SCORE" sub="+2" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("SCORE+2"); setTimeout(commit, 0); }} />
                {/* Row 3 */}
                <SQ label="TEAM FOULS" sub="FOUL -" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("FOUL-"); setTimeout(commit, 0); }}
                  armed={armedFn === "FOUL-" && armedSide === "guest"} />
                <SQ label="SCORE" sub="+3" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("SCORE+3"); setTimeout(commit, 0); }} />
                {/* Row 4 */}
                <SQ label="◄ POSS" color="red"
                  onClick={() => update({ possession: "guest" })}
                  active={state.possession === "guest"} />
                <SQ label="SCORE" sub="-" color="red"
                  onClick={() => { setArmedSide("guest"); setArmedFn("SCORE-"); setTimeout(commit, 0); }}
                  armed={armedFn === "SCORE-" && armedSide === "guest"} />
                {/* Row 5 */}
                <SQ label="MADE SUB" color="red" onClick={() => {}} />
                <SQ label="PLAYER" color="red" onClick={() => {}} />
              </div>
            </div>

            {/* ── NUMPAD — 3 columns × 4 rows (square keys) ── */}
            <div style={{ flex: "0 0 auto", width: "clamp(88px, 13vw, 130px)" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-1 text-zinc-500"
                style={{ fontFamily: "Impact, sans-serif", background: "rgba(0,0,0,0.15)" }}>
                NUMPAD
              </div>
              {/* Pending display */}
              <div className="rounded px-2 py-1 text-center font-mono border border-zinc-700 mb-1"
                style={{ background: "#111", color: pendingDigits ? "#fbbf24" : "#3f3f46", fontSize: "clamp(9px, 1.3vw, 12px)", minHeight: 22 }}>
                {pendingDigits || (armedFn ? armedFn.slice(0, 8) : "──")}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {["7","8","9","4","5","6","1","2","3"].map(n =>
                  <NQ key={n} label={n} onClick={() => press(n)} />)}
                <NQ label="CLR" onClick={() => press("CLR")} color="red" />
                <NQ label="0" onClick={() => press("0")} />
                <NQ label="ENT" onClick={() => press("ENTER")} color="green" />
              </div>
            </div>

            {/* ── RIGHT CONTROLS: arrow pad + HORN/START/STOP ── */}
            <div className="flex flex-col gap-1.5" style={{ flex: "0 0 auto", width: "clamp(72px, 10vw, 100px)" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-1 text-zinc-500"
                style={{ fontFamily: "Impact, sans-serif", background: "rgba(0,0,0,0.15)" }}>
                CONTROLS
              </div>

              {/* Arrow diamond — ONE only, right side */}
              <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
                <div />
                <AR label="▲" onClick={() => update({ period: state.period + 1 })} title="Period +" />
                <div />
                <AR label="◄" onClick={() => update({ shotClockMs: Math.max(0, state.shotClockMs - 1000) })} title="Shot -1s" />
                <button
                  onClick={() => { setArmedFn(null); setArmedSide(null); setPendingDigits(""); setStatus("READY"); }}
                  className="aspect-square w-full flex items-center justify-center rounded bg-zinc-800 border-b-2 border-zinc-900 text-zinc-300 font-black hover:bg-zinc-700 active:translate-y-px active:border-b-0"
                  style={{ fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 1vw, 9px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                  OK
                </button>
                <AR label="►" onClick={() => update({ shotClockMs: state.shotClockMs + 1000 })} title="Shot +1s" />
                <div />
                <AR label="▼" onClick={() => update({ period: Math.max(1, state.period - 1) })} title="Period -" />
                <div />
              </div>

              {/* Blank/Display button */}
              <button className="w-full rounded border-b-2 border-zinc-800 bg-zinc-600 text-white font-black uppercase hover:bg-zinc-500 active:translate-y-px active:border-b-0"
                style={{ minHeight: 28, fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 1vw, 10px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                DISPLAY
              </button>

              {/* Shot clock quick resets */}
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => press("SHOT 30")}
                  className="aspect-square w-full flex items-center justify-center rounded border-b-2 bg-zinc-700 border-zinc-900 text-zinc-200 font-black uppercase hover:bg-zinc-600 active:translate-y-px active:border-b-0"
                  style={{ fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 1vw, 9px)" }}>
                  30s
                </button>
                <button onClick={() => press("SHOT 14")}
                  className="aspect-square w-full flex items-center justify-center rounded border-b-2 bg-zinc-700 border-zinc-900 text-zinc-200 font-black uppercase hover:bg-zinc-600 active:translate-y-px active:border-b-0"
                  style={{ fontFamily: "Impact, sans-serif", fontSize: "clamp(7px, 1vw, 9px)" }}>
                  14s
                </button>
              </div>

              {/* HORN yellow */}
              <RB label="◼ HORN" onClick={() => press("HORN")} color="yellow" />
              {/* START green */}
              <RB label="▶ START" onClick={() => press("START")} color="green" />
              {/* STOP red */}
              <RB label="■ STOP" onClick={() => press("STOP")} color="red" />
            </div>

          </div>{/* end main button area */}

          {/* Keybind hint bar */}
          <div className="px-4 pb-2 pt-2 text-[9px] text-zinc-500 border-t border-zinc-500/30">
            <kbd>Space</kbd> start/stop · <kbd>H</kbd>/<kbd>G</kbd> team · <kbd>Q/W/E</kbd> +1/+2/+3 · <kbd>R</kbd> − score · <kbd>F</kbd>/<kbd>⇧F</kbd> foul+/− · <kbd>T</kbd> TOL · <kbd>B</kbd> bonus · <kbd>P</kbd> poss · <kbd>⇧P</kbd> period · <kbd>N</kbd> horn · <kbd>0–9</kbd> digits · <kbd>Enter</kbd> commit · <kbd>Esc</kbd> clear
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
