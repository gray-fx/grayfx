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
        let ms = 0;
        const s = pendingDigits;
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
    <>
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
    </>
  );

  // ─────────────────────────────────────────────
  // BASKETBALL OVERLAY LAYOUT
  // Matches the real Daktronics All Sport 5000 basketball overlay card exactly
  // ─────────────────────────────────────────────
  if (controllerLayout === "basketball-overlay") {
    // Compact square button matching the real console's membrane keys
    const B = ({
      label, sub, color, onClick, armed = false, active = false, wide = false, disabled = false,
    }: {
      label: string; sub?: string; color: "green" | "red" | "white" | "yellow" | "dark";
      onClick: () => void; armed?: boolean; active?: boolean; wide?: boolean; disabled?: boolean;
    }) => {
      const base: Record<string, string> = {
        green: armed || active
          ? "bg-green-400 border-green-700 text-black"
          : "bg-green-700 border-green-900 text-white hover:bg-green-600",
        red: armed || active
          ? "bg-red-400 border-red-700 text-black"
          : "bg-red-700 border-red-900 text-white hover:bg-red-600",
        white: armed || active
          ? "bg-amber-300 border-amber-600 text-black"
          : "bg-zinc-200 border-zinc-400 text-zinc-900 hover:bg-zinc-100",
        yellow: "bg-yellow-400 border-yellow-700 text-black hover:bg-yellow-300",
        dark: "bg-zinc-700 border-zinc-900 text-amber-300 hover:bg-zinc-600",
      };
      const ring = armed ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900" : "";
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            flex flex-col items-center justify-center rounded
            border-b-[3px] transition-all
            active:translate-y-px active:border-b-[1px]
            ${wide ? "col-span-2" : ""}
            ${base[color]} ${ring}
            ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          `}
          style={{
            minHeight: 36,
            padding: "3px 2px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.5)",
            fontSize: 8.5,
            fontFamily: "Impact, 'Arial Narrow', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          <span className="font-black uppercase leading-none text-center whitespace-nowrap" style={{ fontSize: 8.5 }}>{label}</span>
          {sub && <span className="leading-none text-center mt-0.5 opacity-75 whitespace-nowrap" style={{ fontSize: 7.5 }}>{sub}</span>}
        </button>
      );
    };

    // Numpad button
    const NB = ({ label, onClick, color = "dark" }: { label: string; onClick: () => void; color?: "dark" | "yellow" | "red" | "green" }) => {
      const s: Record<string, string> = {
        dark: "bg-zinc-700 border-zinc-900 text-amber-300 hover:bg-zinc-600",
        yellow: "bg-yellow-400 border-yellow-700 text-black hover:bg-yellow-300",
        red: "bg-red-700 border-red-900 text-white hover:bg-red-600",
        green: "bg-green-700 border-green-900 text-white hover:bg-green-600",
      };
      return (
        <button onClick={onClick}
          className={`rounded border-b-[3px] font-black text-xs uppercase tracking-wider transition-all active:translate-y-px active:border-b-[1px] ${s[color]}`}
          style={{ minHeight: 34, fontFamily: "Impact, sans-serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}>
          {label}
        </button>
      );
    };

    // Large right-side buttons
    const RB = ({ label, onClick, color }: { label: string; onClick: () => void; color: "green" | "red" | "yellow" }) => {
      const s: Record<string, string> = {
        green: "bg-green-600 border-green-900 text-white hover:bg-green-500",
        red: "bg-red-600 border-red-900 text-white hover:bg-red-500",
        yellow: "bg-yellow-400 border-yellow-700 text-black hover:bg-yellow-300",
      };
      return (
        <button onClick={onClick}
          className={`w-full rounded border-b-[3px] font-black text-sm uppercase tracking-wider transition-all active:translate-y-px active:border-b-[1px] ${s[color]}`}
          style={{ minHeight: 44, fontFamily: "Impact, sans-serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)" }}>
          {label}
        </button>
      );
    };

    // Arrow pad button
    const AB = ({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) => (
      <button onClick={onClick} title={title}
        className="rounded bg-zinc-600 border-b-[3px] border-zinc-900 text-white font-black text-xs hover:bg-zinc-500 active:translate-y-px active:border-b-[1px] flex items-center justify-center"
        style={{ minHeight: 30, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
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
            background: "linear-gradient(160deg, #d0d0d0 0%, #a8a8a8 60%, #b8b8b8 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}>

          {/* Top strip: LCD + labels */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b-2 border-zinc-500"
            style={{ background: "linear-gradient(180deg, #ddd 0%, #bbb 100%)" }}>
            {/* Daktronics wordmark */}
            <div className="text-zinc-600 font-black text-xs tracking-widest uppercase hidden sm:block" style={{ fontFamily: "Impact, sans-serif" }}>
              DAKTRONICS
            </div>

            {/* LCD */}
            <div className="flex-1 rounded px-2.5 py-1.5 border-2 border-zinc-600"
              style={{ background: "linear-gradient(180deg, #5c7a2e 0%, #6e933a 100%)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)", maxWidth: 320 }}>
              <div className="font-mono text-sm whitespace-pre text-black leading-tight"
                style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.05em", textShadow: "0 1px 0 rgba(255,255,255,0.15)" }}>
                {lcdL1.padEnd(20, " ")}{"\n"}{lcdL2.padEnd(20, " ")}
              </div>
            </div>

            {/* Config inputs */}
            <div className="flex gap-2 flex-1 justify-end">
              {[
                { label: "Sport", el: (
                  <select value={state.sport} onChange={e => update({ sport: e.target.value as DSport })}
                    className="bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs">
                    {["basketball","football","hockey","soccer","baseball"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                )},
                { label: "Layout", el: (
                  <select value={state.layout} onChange={e => update({ layout: e.target.value as any })}
                    className="bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs">
                    {[["indoor-bball","Indoor Bball"],["indoor-bball-fouls","Bball+Fouls"],["outdoor-football","Football"],["hockey","Hockey"],["soccer","Soccer"],["baseball","Baseball"],["minimal","Minimal"]].map(([v,l]) =>
                      <option key={v} value={v}>{l}</option>)}
                  </select>
                )},
                { label: "Home", el: <input value={state.homeName} maxLength={8} onChange={e => update({ homeName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs" /> },
                { label: "Guest", el: <input value={state.guestName} maxLength={8} onChange={e => update({ guestName: e.target.value.toUpperCase() })} className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 text-amber-300 text-xs" /> },
              ].map(({ label, el }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{label}</span>
                  {el}
                </div>
              ))}
            </div>

            {/* Logo area */}
            <div className="text-right hidden lg:block shrink-0">
              <div className="font-black text-zinc-700 text-base tracking-widest leading-none" style={{ fontFamily: "Impact, sans-serif" }}>ALL SPORT</div>
              <div className="text-zinc-600 text-[10px] font-bold tracking-widest">5000 SERIES</div>
              <div className="text-zinc-500 text-[8px] tracking-widest uppercase">Control Console</div>
            </div>
          </div>

          {/* ── MAIN BUTTON AREA ── */}
          <div className="flex gap-2 px-4 pb-4 pt-3 items-start">

            {/* ════════════════════════════════════════════
                HOME section (green) — matches overlay left columns
                ════════════════════════════════════════════ */}
            <div className="flex flex-col gap-1" style={{ minWidth: 0, flex: "1 1 0" }}>
              {/* HOME header bar */}
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-0.5"
                style={{ color: "#fff", background: "#15803d", fontFamily: "Impact, sans-serif" }}>
                ◄ HOME
              </div>
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="SCORE" sub="+1" color="green" onClick={() => { setArmedSide("home"); press("SCORE+1"); commit(); }} armed={armedFn === "SCORE+1" && armedSide === "home"} />
                <B label="TIME" sub="SHOT TIME" color="white" onClick={() => press("SET SHOT")} armed={armedFn === "SET SHOT"} />
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="SCORE" sub="+2" color="green" onClick={() => { setArmedSide("home"); press("SCORE+2"); commit(); }} />
                <B label="TEAM FOULS" sub="FOUL +" color="green" onClick={() => { setArmedSide("home"); press("FOUL+"); commit(); }} armed={armedFn === "FOUL+" && armedSide === "home"} />
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="SCORE" sub="+3" color="green" onClick={() => { setArmedSide("home"); press("SCORE+3"); commit(); }} />
                <B label="TEAM FOULS" sub="FOUL -" color="green" onClick={() => { setArmedSide("home"); press("FOUL-"); commit(); }} armed={armedFn === "FOUL-" && armedSide === "home"} />
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="SCORE" sub="-" color="green" onClick={() => { setArmedSide("home"); press("SCORE-"); commit(); }} armed={armedFn === "SCORE-" && armedSide === "home"} />
                <B label="POSS ►" color="green" onClick={() => update({ possession: "home" })} active={state.possession === "home"} />
              </div>
              {/* Row 5 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="TIMEOUT" sub="TOL -" color="green" onClick={() => { setArmedSide("home"); press("TOL"); commit(); }} armed={armedFn === "TOL" && armedSide === "home"} />
                <B label="BONUS" color="green" onClick={() => { setArmedSide("home"); press("BONUS"); commit(); }} active={state.bonus === "home"} />
              </div>
              {/* Row 6 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="DBL BONUS" color="green" onClick={() => { setArmedSide("home"); press("DBONUS"); commit(); }} active={state.doubleBonus === "home"} />
                <B label="SET SCORE" color="green" onClick={() => { setArmedSide("home"); setArmedFn("SET SCORE"); }} armed={armedFn === "SET SCORE" && armedSide === "home"} />
              </div>
            </div>

            {/* ════════════════════════════════════════════
                SHARED section (white/gray) — center columns
                ════════════════════════════════════════════ */}
            <div className="flex flex-col gap-1" style={{ minWidth: 90, flex: "0 0 90px" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-0.5 text-zinc-500"
                style={{ fontFamily: "Impact, sans-serif" }}>
                SHARED
              </div>
              <B label="RECALL" sub="BLANK TIME" color="white" onClick={() => press("SET CLOCK")} armed={armedFn === "SET CLOCK"} />
              <B label="SET SCORE" sub="SET ONLY" color="white" onClick={() => { setArmedFn("SET SCORE"); }} armed={armedFn === "SET SCORE" && !armedSide} />
              {/* Arrow pad for period / nav */}
              <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: "repeat(3, 28px)" }}>
                <div />
                <AB label="▲" onClick={() => press("PERIOD")} title="Period +" />
                <div />
                <AB label="◄" onClick={() => update({ shotClockMs: Math.max(0, state.shotClockMs - 1000) })} title="Shot -1s" />
                <button
                  onClick={() => { setArmedFn(null); setArmedSide(null); setPendingDigits(""); setStatus("READY"); }}
                  className="rounded bg-zinc-700 border-b-[3px] border-zinc-900 text-zinc-300 font-black text-[9px] hover:bg-zinc-600 active:translate-y-px active:border-b-[1px] flex items-center justify-center"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", fontFamily: "Impact, sans-serif" }}>
                  OK
                </button>
                <AB label="►" onClick={() => update({ shotClockMs: state.shotClockMs + 1000 })} title="Shot +1s" />
                <div />
                <AB label="▼" onClick={() => update({ period: Math.max(1, state.period - 1) })} title="Period -" />
                <div />
              </div>
              <B label="OUT OF GAME" color="white" onClick={() => {}} />
              <B label="IN GAME" color="white" onClick={() => {}} />
              <B label="SET PERIOD" color="white" onClick={() => press("PERIOD")} armed={armedFn === "PERIOD"} />
              <B label="SHOT 30" color="white" onClick={() => press("SHOT 30")} />
              <B label="SHOT 14" color="white" onClick={() => press("SHOT 14")} />
            </div>

            {/* ════════════════════════════════════════════
                GUEST section (red) — mirrors HOME on right
                ════════════════════════════════════════════ */}
            <div className="flex flex-col gap-1" style={{ minWidth: 0, flex: "1 1 0" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest py-0.5 rounded mb-0.5"
                style={{ color: "#fff", background: "#b91c1c", fontFamily: "Impact, sans-serif" }}>
                GUEST ►
              </div>
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="TIME" sub="SHOT TIME" color="white" onClick={() => press("SET SHOT")} />
                <B label="SCORE" sub="+1" color="red" onClick={() => { setArmedSide("guest"); press("SCORE+1"); commit(); }} armed={armedFn === "SCORE+1" && armedSide === "guest"} />
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="TEAM FOULS" sub="FOUL +" color="red" onClick={() => { setArmedSide("guest"); press("FOUL+"); commit(); }} armed={armedFn === "FOUL+" && armedSide === "guest"} />
                <B label="SCORE" sub="+2" color="red" onClick={() => { setArmedSide("guest"); press("SCORE+2"); commit(); }} />
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="TEAM FOULS" sub="FOUL -" color="red" onClick={() => { setArmedSide("guest"); press("FOUL-"); commit(); }} armed={armedFn === "FOUL-" && armedSide === "guest"} />
                <B label="SCORE" sub="+3" color="red" onClick={() => { setArmedSide("guest"); press("SCORE+3"); commit(); }} />
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="◄ POSS" color="red" onClick={() => update({ possession: "guest" })} active={state.possession === "guest"} />
                <B label="SCORE" sub="-" color="red" onClick={() => { setArmedSide("guest"); press("SCORE-"); commit(); }} armed={armedFn === "SCORE-" && armedSide === "guest"} />
              </div>
              {/* Row 5 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="BONUS" color="red" onClick={() => { setArmedSide("guest"); press("BONUS"); commit(); }} active={state.bonus === "guest"} />
                <B label="TIMEOUT" sub="TOL -" color="red" onClick={() => { setArmedSide("guest"); press("TOL"); commit(); }} armed={armedFn === "TOL" && armedSide === "guest"} />
              </div>
              {/* Row 6 */}
              <div className="grid grid-cols-2 gap-1">
                <B label="SET SCORE" color="red" onClick={() => { setArmedSide("guest"); setArmedFn("SET SCORE"); }} armed={armedFn === "SET SCORE" && armedSide === "guest"} />
                <B label="DBL BONUS" color="red" onClick={() => { setArmedSide("guest"); press("DBONUS"); commit(); }} active={state.doubleBonus === "guest"} />
              </div>
            </div>

            {/* ════════════════════════════════════════════
                NUMPAD — center-right, matches real console
                ════════════════════════════════════════════ */}
            <div className="flex flex-col gap-1" style={{ minWidth: 102, flex: "0 0 102px" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest text-zinc-500 py-0.5 mb-0.5"
                style={{ fontFamily: "Impact, sans-serif" }}>NUMPAD</div>
              {/* Pending display */}
              <div className="rounded px-2 py-1 text-center font-mono text-sm border border-zinc-600 mb-1"
                style={{ background: "#111", color: pendingDigits ? "#fbbf24" : "#3f3f46", minHeight: 26 }}>
                {pendingDigits || (armedFn ? armedFn.slice(0, 7) : "──")}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {["7","8","9","4","5","6","1","2","3"].map(n =>
                  <NB key={n} label={n} onClick={() => press(n)} />
                )}
                <NB label="CLR" onClick={() => press("CLR")} color="red" />
                <NB label="0" onClick={() => press("0")} />
                <NB label="ENT" onClick={() => press("ENTER")} color="green" />
              </div>
            </div>

            {/* ════════════════════════════════════════════
                RIGHT CONTROLS — arrow pad + HORN/START/STOP
                ════════════════════════════════════════════ */}
            <div className="flex flex-col gap-1.5" style={{ minWidth: 96, flex: "0 0 96px" }}>
              <div className="text-center text-[9px] font-black uppercase tracking-widest text-zinc-500 py-0.5 mb-0.5"
                style={{ fontFamily: "Impact, sans-serif" }}>CONTROLS</div>

              {/* Arrow diamond */}
              <div className="grid grid-cols-3 gap-1" style={{ gridTemplateRows: "repeat(3, 28px)" }}>
                <div />
                <AB label="▲" onClick={() => update({ shotClockMs: state.shotClockMs + 1000 })} title="Shot +1s" />
                <div />
                <AB label="◄" onClick={() => update({ clockMs: state.clockMs + 1000 })} title="Clock +1s" />
                <button
                  onClick={() => update({ clockRunning: !state.clockRunning })}
                  className="rounded border-b-[3px] font-black text-[9px] hover:brightness-125 active:translate-y-px active:border-b-[1px] flex items-center justify-center"
                  style={{
                    background: state.clockRunning ? "#dc2626" : "#16a34a",
                    borderColor: state.clockRunning ? "#7f1d1d" : "#052e16",
                    color: "#fff",
                    fontFamily: "Impact, sans-serif",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  {state.clockRunning ? "■" : "▶"}
                </button>
                <AB label="►" onClick={() => update({ clockMs: Math.max(0, state.clockMs - 1000) })} title="Clock -1s" />
                <div />
                <AB label="▼" onClick={() => update({ shotClockMs: Math.max(0, state.shotClockMs - 1000) })} title="Shot -1s" />
                <div />
              </div>

              {/* Display / blank button */}
              <button className="w-full rounded border-b-[3px] bg-zinc-600 border-zinc-800 text-white font-black text-[10px] uppercase tracking-wider hover:bg-zinc-500 active:translate-y-px active:border-b-[1px]"
                style={{ minHeight: 28, fontFamily: "Impact, sans-serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                DISPLAY
              </button>

              {/* Shot clock start/stop */}
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => press("SHOT START")}
                  className="rounded border-b-[3px] bg-green-800 border-green-900 text-white font-black text-[9px] uppercase tracking-wider hover:bg-green-700 active:translate-y-px active:border-b-[1px]"
                  style={{ minHeight: 28, fontFamily: "Impact, sans-serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  SHOT ▶
                </button>
                <button onClick={() => press("SHOT STOP")}
                  className="rounded border-b-[3px] bg-red-800 border-red-900 text-white font-black text-[9px] uppercase tracking-wider hover:bg-red-700 active:translate-y-px active:border-b-[1px]"
                  style={{ minHeight: 28, fontFamily: "Impact, sans-serif", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  SHOT ■
                </button>
              </div>

              {/* HORN — yellow */}
              <RB label="◼ HORN" onClick={() => press("HORN")} color="yellow" />
              {/* START — green */}
              <RB label="▶ START" onClick={() => press("START")} color="green" />
              {/* STOP — red */}
              <RB label="■ STOP" onClick={() => press("STOP")} color="red" />

              {/* Shot reset quick buttons */}
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <button onClick={() => press("SHOT 30")}
                  className="rounded border-b-[3px] bg-zinc-700 border-zinc-900 text-zinc-200 font-black text-[10px] uppercase hover:bg-zinc-600 active:translate-y-px active:border-b-[1px]"
                  style={{ minHeight: 26, fontFamily: "Impact, sans-serif" }}>
                  30s
                </button>
                <button onClick={() => press("SHOT 14")}
                  className="rounded border-b-[3px] bg-zinc-700 border-zinc-900 text-zinc-200 font-black text-[10px] uppercase hover:bg-zinc-600 active:translate-y-px active:border-b-[1px]"
                  style={{ minHeight: 26, fontFamily: "Impact, sans-serif" }}>
                  14s
                </button>
              </div>
            </div>

          </div>{/* end main button area */}

          {/* Keybind bar */}
          <div className="px-4 pb-2 text-[9px] text-zinc-500 leading-relaxed border-t border-zinc-500/30 pt-2">
            Keys: <kbd>Space</kbd> start/stop · <kbd>H</kbd>/<kbd>G</kbd> select team · <kbd>Q/W/E</kbd> +1/+2/+3 · <kbd>R</kbd> subtract · <kbd>F</kbd>/<kbd>⇧F</kbd> foul+/− · <kbd>T</kbd> TOL · <kbd>B</kbd> bonus · <kbd>P</kbd> poss · <kbd>⇧P</kbd> period · <kbd>N</kbd> horn · <kbd>0–9</kbd> numpad · <kbd>Enter</kbd> commit · <kbd>Esc</kbd> clear
          </div>

        </div>{/* end console chassis */}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STANDARD LAYOUT (original)
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
    gray: "from-zinc-600 to-zinc-800 text-zinc-100 border-zinc-900",
    dark: "from-zinc-800 to-zinc-950 text-amber-300 border-black",
    red: "from-red-600 to-red-900 text-white border-red-950",
    green: "from-green-600 to-green-900 text-white border-green-950",
    blue: "from-blue-700 to-blue-950 text-white border-blue-950",
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
