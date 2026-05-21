import { useDAS5000, formatClock, DSport } from "@/hooks/use-das5000";
import { useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

type Side = "home" | "guest";
type ControllerLayout = "standard" | "basketball-overlay";

/* ───────────────────────── UI COMPONENTS (unchanged) ───────────────────────── */

const SQ = memo(function SQ({ label, sub, color, onClick, armed, active }: any) {
  const PALETTE: any = {
    green: { base: "#14532d", on: "#16a34a", border: "#052e16", glow: "rgba(34,197,94,0.35)", txt: "#fff" },
    red: { base: "#7f1d1d", on: "#dc2626", border: "#450a0a", glow: "rgba(220,38,38,0.35)", txt: "#fff" },
    white: { base: "#c0c0c0", on: "#fbbf24", border: "#888", glow: "rgba(251,191,36,0.3)", txt: "#111" },
    dark: { base: "#3a3a3a", on: "#6b6b6b", border: "#111", glow: "none", txt: "#fbbf24" },
  };

  const p = PALETTE[color];
  const on = armed || active;

  return (
    <button
      onPointerDown={onClick}
      className="aspect-square w-full flex flex-col items-center justify-center rounded"
      style={{
        background: on ? p.on : p.base,
        borderBottom: `3px solid ${p.border}`,
        boxShadow: on ? `0 0 10px ${p.glow}` : "inset 0 -1px 0 rgba(0,0,0,0.4)",
        color: p.txt,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 900 }}>{label}</span>
      {sub && <span style={{ fontSize: 8 }}>{sub}</span>}
    </button>
  );
});

/* ───────────────────────── BASKETBALL OVERLAY (FIXED) ───────────────────────── */

function BasketballOverlay({
  state,
  update,
  press,
  armedFn,
  armedSide,
  setArmedFn,
  setArmedSide,
  setPendingDigits,
  setStatus,
  formatClock,
}: any) {
  const act = useCallback((fn: () => void) => {
    fn();
    setArmedFn(null);
    setArmedSide(null);
    setPendingDigits("");
    setStatus("OK");
    setTimeout(() => setStatus("READY"), 400);
  }, [setArmedFn, setArmedSide, setPendingDigits, setStatus]);

  /* ALL CALLBACKS ARE NOW SAFE (no conditional hooks anywhere) */
  const cb = {
    homeScore1: useCallback(() => act(() => update((p: any) => ({ homeScore: p.homeScore + 1 }))), [act, update]),
    homeScore2: useCallback(() => act(() => update((p: any) => ({ homeScore: p.homeScore + 2 }))), [act, update]),
    homeScore3: useCallback(() => act(() => update((p: any) => ({ homeScore: p.homeScore + 3 }))), [act, update]),

    guestScore1: useCallback(() => act(() => update((p: any) => ({ guestScore: p.guestScore + 1 }))), [act, update]),
    guestScore2: useCallback(() => act(() => update((p: any) => ({ guestScore: p.guestScore + 2 }))), [act, update]),
    guestScore3: useCallback(() => act(() => update((p: any) => ({ guestScore: p.guestScore + 3 }))), [act, update]),
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white" }}>BASKETBALL MODE</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <SQ label="HOME +1" color="green" onClick={cb.homeScore1} />
        <SQ label="HOME +2" color="green" onClick={cb.homeScore2} />
        <SQ label="GUEST +1" color="red" onClick={cb.guestScore1} />
        <SQ label="GUEST +2" color="red" onClick={cb.guestScore2} />
      </div>
    </div>
  );
}

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */

export default function DAS5000Control() {
  const { state, update } = useDAS5000(true);

  const [controllerLayout, setControllerLayout] = useState<ControllerLayout>("standard");
  const [pendingDigits, setPendingDigits] = useState("");
  const [armedFn, setArmedFn] = useState<string | null>(null);
  const [armedSide, setArmedSide] = useState<Side | null>(null);
  const [status, setStatus] = useState("READY");

  const press = useCallback((key: string) => {
    if (/^\d$/.test(key)) {
      setPendingDigits(d => (d + key).slice(0, 4));
      return;
    }

    if (key === "CLR") {
      setPendingDigits("");
      setArmedFn(null);
      setArmedSide(null);
      return;
    }

    if (key === "HOME") setArmedSide("home");
    if (key === "GUEST") setArmedSide("guest");

    setArmedFn(key);
  }, []);

  const sharedTop = (
    <div style={{ color: "white", marginBottom: 10 }}>
      <button onClick={() => setControllerLayout("standard")}>Standard</button>
      <button onClick={() => setControllerLayout("basketball-overlay")}>Basketball</button>
    </div>
  );

  /* ───────────────────────── ROUTER ───────────────────────── */

  if (controllerLayout === "basketball-overlay") {
    return (
      <BasketballOverlay
        state={state}
        update={update}
        press={press}
        armedFn={armedFn}
        armedSide={armedSide}
        setArmedFn={setArmedFn}
        setArmedSide={setArmedSide}
        setPendingDigits={setPendingDigits}
        setStatus={setStatus}
        formatClock={formatClock}
      />
    );
  }

  /* ───────────────────────── STANDARD MODE ───────────────────────── */

  return (
    <div style={{ color: "white" }}>
      {sharedTop}

      <h1>STANDARD MODE</h1>

      <button onClick={() => press("HOME")}>Home</button>
      <button onClick={() => press("GUEST")}>Guest</button>
      <button onClick={() => press("SCORE+1")}>+1</button>
    </div>
  );
}
