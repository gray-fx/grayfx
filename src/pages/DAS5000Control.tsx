import { useDAS5000, formatClock, DSport } from "@/hooks/use-das5000";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

type Side = "home" | "guest";

export default function DAS5000Control() {
  const { state, update } = useDAS5000(true);
  const [pendingDigits, setPendingDigits] = useState("");
  const [armedFn, setArmedFn] = useState<string | null>(null);
  const [armedSide, setArmedSide] = useState<Side | null>(null);
  const [status, setStatus] = useState("READY");

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

  const press = (key: string) => {
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
  });

  return (
    <div className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #050505 80%)" }}>
      <div className="flex justify-between items-center w-full max-w-4xl mb-4">
        <div>
          <h1 className="text-xl font-black tracking-widest text-yellow-300" style={{ fontFamily: "Impact, sans-serif" }}>
            DAKTRONICS ALL SPORT 5000
          </h1>
          <p className="text-xs text-zinc-500">Simulator · Press keys or click buttons</p>
        </div>
        <Link to="/das5000" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-600/40 px-3 py-2 rounded">
          <ExternalLink className="w-4 h-4" /> Open Scoreboard
        </Link>
      </div>

      <div className="w-full max-w-4xl rounded-2xl p-6 border-2 border-zinc-700"
        style={{
          background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
        <div className="flex gap-4 items-center mb-4">
          <div className="text-yellow-400 font-black text-2xl tracking-wider" style={{ fontFamily: "Impact, sans-serif" }}>
            DAKTRONICS
          </div>
          <div className="flex-1" />
          <div className="text-xs text-zinc-500">ALL SPORT® 5000</div>
        </div>

        <div className="rounded p-3 mb-5 border-2 border-zinc-900"
          style={{
            background: "linear-gradient(180deg, #6b8e3d 0%, #7ba348 100%)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
          }}>
          <div className="font-mono text-base md:text-xl whitespace-pre text-black leading-tight"
            style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.05em", textShadow: "0 0 1px rgba(0,0,0,0.3)" }}>
            {lcdL1.padEnd(20, " ")}
            {"\n"}
            {lcdL2.padEnd(20, " ")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Sport</label>
            <select value={state.sport}
              onChange={e => update({ sport: e.target.value as DSport })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm">
              {["basketball", "football", "hockey", "soccer", "baseball"].map(s =>
                <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Layout</label>
            <select value={state.layout}
              onChange={e => update({ layout: e.target.value as any })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm">
              {[
                ["indoor-bball", "Indoor Basketball"],
                ["indoor-bball-fouls", "Indoor BBall + Player Fouls"],
                ["outdoor-football", "Outdoor Football"],
                ["hockey", "Hockey"],
                ["soccer", "Soccer"],
                ["baseball", "Baseball"],
                ["minimal", "Minimal"],
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Home Name</label>
            <input value={state.homeName} maxLength={8}
              onChange={e => update({ homeName: e.target.value.toUpperCase() })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Guest Name</label>
            <input value={state.guestName} maxLength={8}
              onChange={e => update({ guestName: e.target.value.toUpperCase() })}
              className="w-full mt-1 bg-black border border-zinc-700 rounded px-2 py-1.5 text-amber-300 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <KeyBtn label={`HOME${armedSide === "home" ? " ●" : ""}`} hint="H"
            color={armedSide === "home" ? "amber" : "blue"}
            onClick={() => press("HOME")} />
          <KeyBtn label={`GUEST${armedSide === "guest" ? " ●" : ""}`} hint="G"
            color={armedSide === "guest" ? "amber" : "blue"}
            onClick={() => press("GUEST")} />
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
            {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map(n =>
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

function KeyBtn({
  label, hint, onClick, color = "gray", armed = false, className = "",
}: {
  label: string; hint?: string; onClick: () => void; color?: "gray" | "red" | "green" | "blue" | "amber" | "dark"; armed?: boolean; className?: string;
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
