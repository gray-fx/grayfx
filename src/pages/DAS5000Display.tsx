import { useDAS5000, formatClock } from "@/hooks/use-das5000";
import { SevenSegNumber, SegText } from "@/components/das5000/SevenSeg";
import { useEffect, useState } from "react";

// Inject Barlow Condensed Black from Google Fonts once
if (typeof document !== "undefined") {
  const id = "barlow-condensed-font";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&display=swap";
    document.head.appendChild(link);
  }
}

const LABEL_FONT = "'Barlow Condensed', 'Arial Narrow', sans-serif";

export default function DAS5000Display() {
  const { state } = useDAS5000(false);
  const clockStr = formatClock(state.clockMs, state.showTenthsUnder60);
  const [hornFlash, setHornFlash] = useState(false);
  useEffect(() => {
    if (!state.hornAt) return;
    setHornFlash(true);
    const t = setTimeout(() => setHornFlash(false), 1500);
    return () => clearTimeout(t);
  }, [state.hornAt]);

  const RED   = "#ff2a2a";
  const AMBER = "#ffb800";
  const GREEN = "#1cff5a";

  const Label = ({ children, className = "", style = {} }: any) => (
    <div
      className={`tracking-wider text-center uppercase ${className}`}
      style={{
        fontFamily: LABEL_FONT,
        fontWeight: 900,
        color: "#ffffff",
        textShadow: "0 0 6px rgba(255,255,255,0.2)",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {children}
    </div>
  );

  // Outer scoreboard bezel — matches the thick black border in the image
  const Board = ({ children }: any) => (
    <div
      className="w-full max-w-[1400px] rounded-xl overflow-hidden"
      style={{
        background: "#111",
        border: "6px solid #222",
        boxShadow: "0 0 0 2px #444, 0 20px 60px rgba(0,0,0,0.9)",
      }}
    >
      {children}
    </div>
  );

  // Individual digit panel — dark inset box like each module in the image
  const Module = ({ children, className = "" }: any) => (
    <div
      className={`rounded-lg flex items-center justify-center ${className}`}
      style={{
        background: "#0a0a0a",
        border: "3px solid #1a1a1a",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.95)",
      }}
    >
      {children}
    </div>
  );

  // ── BASKETBALL layout ─────────────────────────────────────────────────────
  //
  // Proportions (matching reference photo):
  //   Clock   — tallest element, full-width centered top
  //   Scores  — hero digits, tall (240px), take up 3fr each side
  //   Period  — same module height as scores but only 1 digit + arrows; 2fr center
  //   Fouls   — shorter than scores (~55% of score height), sit in their own row
  //   PF box  — same height as fouls row; ghost segments always shown, only lit when called
  //   TOL     — compact, tucked beside MATCH label in center bottom
  //
  // Key rule: NO flex-1 on modules — explicit padding drives height so nothing
  // "inflates" to fill leftover space.
  //
  const renderBasketball = (withFouls: boolean) => {
    // Is there an active player-foul call to display?
    const pfActive = (state.lastFoulPlayer ?? null) !== null && state.lastFoulPlayer !== 0;

    return (
      <Board>
        {/* Branding strip */}
        <div style={{
          background: "#000", borderBottom: "2px solid #222",
          fontFamily: LABEL_FONT, fontWeight: 900, fontSize: 13,
          letterSpacing: "0.25em", color: "#555", textAlign: "center", padding: "4px 0",
        }}>DAKTRONICS</div>

        <div style={{ background: "#111", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── ROW 1: Clock centered ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Module style={{ padding: "10px 40px" }}>
              <SegText text={clockStr} height={150} color={AMBER} />
            </Module>
          </div>

          {/* ── ROW 2: Score | Period | Score  (3fr 2fr 3fr) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 3fr", gap: 12, alignItems: "start" }}>

            {/* HOME score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(20px, 3vw, 40px)" }}>{state.homeName}</Label>
              <Module style={{ width: "100%", padding: "18px 8px", display: "flex", justifyContent: "center" }}>
                <SevenSegNumber value={state.homeScore} digits={3} height={240} color={RED} />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>

            {/* CENTER: PERIOD label + module with poss arrows */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(13px, 1.6vw, 22px)" }}>PERIOD</Label>
              <Module style={{ width: "100%", padding: "18px 6px", display: "flex", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}>
                  {/* Home poss arrow */}
                  <span style={{
                    fontSize: "clamp(18px, 2.2vw, 30px)", fontFamily: LABEL_FONT, fontWeight: 900, lineHeight: 1, flexShrink: 0,
                    color: state.possession === "home" ? AMBER : "#1c1c1c",
                    textShadow: state.possession === "home" ? `0 0 14px ${AMBER}` : "none",
                    transition: "color 0.15s, text-shadow 0.15s",
                  }}>◄</span>
                  <SevenSegNumber value={state.period} digits={1} height={240} color={AMBER} />
                  {/* Guest poss arrow */}
                  <span style={{
                    fontSize: "clamp(18px, 2.2vw, 30px)", fontFamily: LABEL_FONT, fontWeight: 900, lineHeight: 1, flexShrink: 0,
                    color: state.possession === "guest" ? AMBER : "#1c1c1c",
                    textShadow: state.possession === "guest" ? `0 0 14px ${AMBER}` : "none",
                    transition: "color 0.15s, text-shadow 0.15s",
                  }}>►</span>
                </div>
              </Module>
              {/* Invisible spacer so this column's bottom label aligns with SCORE */}
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
            </div>

            {/* GUEST score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(20px, 3vw, 40px)" }}>{state.guestName}</Label>
              <Module style={{ width: "100%", padding: "18px 8px", display: "flex", justifyContent: "center" }}>
                <SevenSegNumber value={state.guestScore} digits={3} height={240} color={RED} />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>
          </div>

          {/* ── ROW 3: Fouls | Player Foul + MATCH/TOL | Fouls  (3fr 2fr 3fr) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 3fr", gap: 12, alignItems: "start" }}>

            {/* HOME fouls — fixed padding, NOT flex-1 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              <Module style={{ width: "100%", padding: "10px 8px", display: "flex", justifyContent: "center" }}>
                <SevenSegNumber value={state.homeFouls} digits={2} height={100} color={RED} />
              </Module>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: state.bonus === "home" ? AMBER : "#222", boxShadow: state.bonus === "home" ? `0 0 8px ${AMBER}` : "none" }} />
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: state.doubleBonus === "home" ? RED : "#222", boxShadow: state.doubleBonus === "home" ? `0 0 8px ${RED}` : "none" }} />
              </div>
            </div>

            {/* CENTER: Player Foul display + MATCH label + TOL pair */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(13px, 1.6vw, 22px)" }}>PLAYER FOUL</Label>
              {/*
                Ghost segments: always render the dim "88 8" skeleton.
                When pfActive, the real values light on top via color.
                We do this by rendering two SevenSegNumber components with
                the ghost color when not active, normal AMBER when active.
              */}
              <Module style={{ width: "100%", padding: "10px 8px", display: "flex", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SevenSegNumber
                    value={pfActive ? (state.lastFoulPlayer ?? 0) : 0}
                    digits={2}
                    height={100}
                    color={pfActive ? AMBER : "#2a2000"}
                  />
                  <SevenSegNumber
                    value={pfActive ? (state.lastFoulCount ?? 0) : 0}
                    digits={1}
                    height={100}
                    color={pfActive ? AMBER : "#2a2000"}
                  />
                </div>
              </Module>

              {/* MATCH label + TOL pair underneath */}
              <Label style={{ fontSize: "clamp(14px, 1.8vw, 24px)" }}>MATCH</Label>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Label style={{ fontSize: "clamp(10px, 1.2vw, 16px)" }}>TOL</Label>
                  <Module style={{ padding: "5px 10px" }}>
                    <SevenSegNumber value={state.homeTOL} digits={1} height={44} color={GREEN} />
                  </Module>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Label style={{ fontSize: "clamp(10px, 1.2vw, 16px)" }}>TOL</Label>
                  <Module style={{ padding: "5px 10px" }}>
                    <SevenSegNumber value={state.guestTOL} digits={1} height={44} color={GREEN} />
                  </Module>
                </div>
              </div>
            </div>

            {/* GUEST fouls */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              <Module style={{ width: "100%", padding: "10px 8px", display: "flex", justifyContent: "center" }}>
                <SevenSegNumber value={state.guestFouls} digits={2} height={100} color={RED} />
              </Module>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: state.bonus === "guest" ? AMBER : "#222", boxShadow: state.bonus === "guest" ? `0 0 8px ${AMBER}` : "none" }} />
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: state.doubleBonus === "guest" ? RED : "#222", boxShadow: state.doubleBonus === "guest" ? `0 0 8px ${RED}` : "none" }} />
              </div>
            </div>
          </div>

          {/* ── Optional player foul grid (indoor-bball-fouls) ── */}
          {withFouls && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, paddingTop: 16, borderTop: "2px solid #27272a" }}>
              <PlayerFoulCol title={state.homeName} players={state.homePlayers} />
              <PlayerFoulCol title={state.guestName} players={state.guestPlayers} />
            </div>
          )}
        </div>
      </Board>
    );
  };

  // ── All other layouts unchanged ─────────────────────────────────────────────

  const Panel = ({ children, className = "" }: any) => (
    <div className={`bg-black border-4 border-zinc-800 rounded-lg p-6 ${className}`}
      style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7)" }}>
      {children}
    </div>
  );

  const TeamBlock = ({ name, score, color, dotsBonus, dotsDouble }: any) => (
    <div className="flex flex-col items-center gap-3 flex-1">
      <Label className="text-4xl md:text-6xl truncate w-full px-2">{name}</Label>
      <SevenSegNumber value={score} digits={3} height={220} color={color} />
      {(dotsBonus || dotsDouble) && (
        <div className="flex gap-2 mt-1">
          <div className="w-5 h-5 rounded-full" style={{ background: dotsBonus ? AMBER : "#222", boxShadow: dotsBonus ? `0 0 10px ${AMBER}` : "none" }} />
          <div className="w-5 h-5 rounded-full" style={{ background: dotsDouble ? RED : "#222", boxShadow: dotsDouble ? `0 0 10px ${RED}` : "none" }} />
        </div>
      )}
    </div>
  );

  const renderFootball = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center"><Label className="text-2xl">Qtr</Label><SevenSegNumber value={state.period} digits={1} height={110} color={AMBER} /></div>
          <div className="text-center"><Label className="text-2xl">Clock</Label><SegText text={clockStr} height={160} color={RED} /></div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center"><Label className="text-xl">Down</Label><SevenSegNumber value={state.down} digits={1} height={70} color={AMBER} /></div>
            <div className="text-center"><Label className="text-xl">To Go</Label><SevenSegNumber value={state.distance} digits={2} height={70} color={AMBER} /></div>
            <div className="text-center"><Label className="text-xl">Ball On</Label><SevenSegNumber value={state.ballOn} digits={2} height={70} color={AMBER} /></div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const renderHockey = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col items-center gap-4">
          <Label className="text-5xl">{state.homeName}</Label>
          <SevenSegNumber value={state.homeScore} digits={2} height={210} color={RED} />
          <div className="text-center"><Label className="text-xl">SOG</Label><SevenSegNumber value={state.homeSOG} digits={2} height={70} color={AMBER} /></div>
          <div className="text-center"><Label className="text-xl">Penalty</Label><SegText text={formatClock(state.homePenaltyMs)} height={70} color={AMBER} /></div>
        </div>
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center"><Label className="text-2xl">Period</Label><SevenSegNumber value={state.period} digits={1} height={110} color={AMBER} /></div>
          <div className="text-center"><Label className="text-2xl">Clock</Label><SegText text={clockStr} height={170} color={RED} /></div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Label className="text-5xl">{state.guestName}</Label>
          <SevenSegNumber value={state.guestScore} digits={2} height={210} color={RED} />
          <div className="text-center"><Label className="text-xl">SOG</Label><SevenSegNumber value={state.guestSOG} digits={2} height={70} color={AMBER} /></div>
          <div className="text-center"><Label className="text-xl">Penalty</Label><SegText text={formatClock(state.guestPenaltyMs)} height={70} color={AMBER} /></div>
        </div>
      </div>
    </Panel>
  );

  const renderSoccer = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8 items-center">
        <TeamBlock name={state.homeName} score={state.homeScore} color={GREEN} />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center"><Label className="text-2xl">Half</Label><SevenSegNumber value={state.period} digits={1} height={90} color={AMBER} /></div>
          <div className="text-center"><Label className="text-2xl">Time</Label><SegText text={clockStr} height={170} color={GREEN} /></div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={GREEN} />
      </div>
    </Panel>
  );

  const renderBaseball = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-6">
          <div className="flex items-center gap-4">
            <Label className="text-2xl">Inn</Label>
            <SegText text={`${state.inningHalf}${state.inning}`} height={100} color={AMBER} />
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center"><Label className="text-xl">B</Label><SevenSegNumber value={state.balls} digits={1} height={70} color={GREEN} /></div>
            <div className="text-center"><Label className="text-xl">S</Label><SevenSegNumber value={state.strikes} digits={1} height={70} color={AMBER} /></div>
            <div className="text-center"><Label className="text-xl">O</Label><SevenSegNumber value={state.outs} digits={1} height={70} color={RED} /></div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const renderMinimal = () => (
    <Panel className="w-full max-w-[1200px]">
      <div className="grid grid-cols-3 gap-8 items-center">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <SegText text={clockStr} height={180} color={AMBER} />
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const layoutMap: Record<string, JSX.Element> = {
    "indoor-bball":        renderBasketball(false),
    "indoor-bball-fouls":  renderBasketball(true),
    "outdoor-football":    renderFootball(),
    "hockey":              renderHockey(),
    "soccer":              renderSoccer(),
    "baseball":            renderBaseball(),
    "minimal":             renderMinimal(),
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8"
      style={{ background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000 80%)" }}
    >
      {hornFlash && (
        <div
          className="fixed inset-0 pointer-events-none animate-pulse"
          style={{ background: "rgba(255,200,0,0.15)" }}
        />
      )}
      {layoutMap[state.layout] || renderMinimal()}
    </div>
  );
}

function PlayerFoulCol({ title, players }: { title: string; players: any[] }) {
  return (
    <div>
      <div
        className="text-center text-xl uppercase mb-2 tracking-wider"
        style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif", fontWeight: 900, color: "#ffffff" }}
      >
        {title} • Player Fouls
      </div>
      <div className="grid grid-cols-5 gap-2">
        {players.length === 0 && (
          <div className="col-span-5 text-zinc-600 text-xs text-center">No players logged</div>
        )}
        {players.map((p, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center">
            <div className="text-amber-400 font-bold text-lg">#{p.number}</div>
            <div className="text-red-500 font-mono text-xl">{p.fouls}F</div>
            <div className="text-zinc-400 font-mono text-sm">{p.points}pt</div>
          </div>
        ))}
      </div>
    </div>
  );
}
