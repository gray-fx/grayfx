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

  // ── BASKETBALL layout matching reference image ──────────────────────────────
  const renderBasketball = (withFouls: boolean) => (
    <Board>
      {/* Daktronics branding strip */}
      <div
        className="text-center py-1"
        style={{
          background: "#000",
          borderBottom: "2px solid #222",
          fontFamily: LABEL_FONT,
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: "0.25em",
          color: "#555",
        }}
      >
        DAKTRONICS
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-4" style={{ background: "#111" }}>

        {/* ── ROW 1: Clock — full width, top center ── */}
        <div className="flex justify-center">
          <Module className="px-6 py-3" style={{ minWidth: "38%" }}>
            <SegText text={clockStr} height={110} color={AMBER} />
          </Module>
        </div>

        {/* ── ROW 2: HOME score | PERIOD+POSS+PLAYER FOUL | GUEST score ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* HOME block */}
          <div className="flex flex-col items-center gap-2">
            <Label className="text-4xl md:text-5xl">{state.homeName}</Label>
            <Module className="w-full py-4 px-2">
              <SevenSegNumber value={state.homeScore} digits={3} height={160} color={RED} />
            </Module>
            <Label className="text-2xl md:text-3xl">SCORE</Label>
          </div>

          {/* CENTER block: Period + Possession arrows + Player Foul */}
          <div className="flex flex-col items-center gap-3" style={{ minWidth: "clamp(200px, 26vw, 340px)" }}>
            <Label className="text-2xl md:text-3xl">PERIOD</Label>
            {/* Period module — possession arrows flank the period digit */}
            <Module className="w-full py-3 px-4">
              <div className="flex items-center justify-center gap-3 w-full">
                {/* Home possession arrow */}
                <div style={{
                  fontSize: "clamp(22px, 3vw, 36px)",
                  fontFamily: LABEL_FONT,
                  fontWeight: 900,
                  color: state.possession === "home" ? AMBER : "#1a1a1a",
                  textShadow: state.possession === "home" ? `0 0 10px ${AMBER}` : "none",
                  transition: "color 0.15s, text-shadow 0.15s",
                  lineHeight: 1,
                }}>◄</div>
                <SevenSegNumber value={state.period} digits={1} height={90} color={AMBER} />
                {/* Guest possession arrow */}
                <div style={{
                  fontSize: "clamp(22px, 3vw, 36px)",
                  fontFamily: LABEL_FONT,
                  fontWeight: 900,
                  color: state.possession === "guest" ? AMBER : "#1a1a1a",
                  textShadow: state.possession === "guest" ? `0 0 10px ${AMBER}` : "none",
                  transition: "color 0.15s, text-shadow 0.15s",
                  lineHeight: 1,
                }}>►</div>
              </div>
            </Module>

            {/* PLAYER FOUL label + module */}
            <Label className="text-xl md:text-2xl">PLAYER FOUL</Label>
            <Module className="w-full py-3 px-4">
              {/* Shows last player foul entry: player number + foul count */}
              <div className="flex items-center justify-center gap-2">
                <SevenSegNumber
                  value={state.lastFoulPlayer ?? 0}
                  digits={2}
                  height={80}
                  color={AMBER}
                />
                <SevenSegNumber
                  value={state.lastFoulCount ?? 0}
                  digits={1}
                  height={80}
                  color={AMBER}
                />
              </div>
            </Module>

            <Label className="text-2xl md:text-3xl">MATCH</Label>
          </div>

          {/* GUEST block */}
          <div className="flex flex-col items-center gap-2">
            <Label className="text-4xl md:text-5xl">{state.guestName}</Label>
            <Module className="w-full py-4 px-2">
              <SevenSegNumber value={state.guestScore} digits={3} height={160} color={RED} />
            </Module>
            <Label className="text-2xl md:text-3xl">SCORE</Label>
          </div>
        </div>

        {/* ── ROW 3: FOULS + TOL (bottom strip) ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr auto 1fr" }}>

          {/* Home fouls */}
          <div className="flex flex-col items-center gap-1">
            <Label className="text-2xl md:text-3xl">FOULS</Label>
            <Module className="py-2 px-6">
              <SevenSegNumber value={state.homeFouls} digits={2} height={70} color={RED} />
            </Module>
            {/* Bonus indicators */}
            <div className="flex gap-2 mt-1">
              <div className="w-4 h-4 rounded-full" style={{ background: state.bonus === "home" ? AMBER : "#222", boxShadow: state.bonus === "home" ? `0 0 8px ${AMBER}` : "none" }} />
              <div className="w-4 h-4 rounded-full" style={{ background: state.doubleBonus === "home" ? RED : "#222", boxShadow: state.doubleBonus === "home" ? `0 0 8px ${RED}` : "none" }} />
            </div>
          </div>

          {/* Center TOL */}
          <div className="flex flex-col items-center justify-center gap-1" style={{ minWidth: "clamp(200px, 26vw, 340px)" }}>
            <div className="flex gap-6 items-end justify-center w-full">
              <div className="flex flex-col items-center gap-1">
                <Label className="text-lg">TOL</Label>
                <Module className="py-2 px-4">
                  <SevenSegNumber value={state.homeTOL} digits={1} height={55} color={GREEN} />
                </Module>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Label className="text-lg">TOL</Label>
                <Module className="py-2 px-4">
                  <SevenSegNumber value={state.guestTOL} digits={1} height={55} color={GREEN} />
                </Module>
              </div>
            </div>
          </div>

          {/* Guest fouls */}
          <div className="flex flex-col items-center gap-1">
            <Label className="text-2xl md:text-3xl">FOULS</Label>
            <Module className="py-2 px-6">
              <SevenSegNumber value={state.guestFouls} digits={2} height={70} color={RED} />
            </Module>
            <div className="flex gap-2 mt-1">
              <div className="w-4 h-4 rounded-full" style={{ background: state.bonus === "guest" ? AMBER : "#222", boxShadow: state.bonus === "guest" ? `0 0 8px ${AMBER}` : "none" }} />
              <div className="w-4 h-4 rounded-full" style={{ background: state.doubleBonus === "guest" ? RED : "#222", boxShadow: state.doubleBonus === "guest" ? `0 0 8px ${RED}` : "none" }} />
            </div>
          </div>
        </div>

        {/* ── Player foul grid (optional, indoor-bball-fouls layout) ── */}
        {withFouls && (
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-zinc-800">
            <PlayerFoulCol title={state.homeName} players={state.homePlayers} />
            <PlayerFoulCol title={state.guestName} players={state.guestPlayers} />
          </div>
        )}
      </div>
    </Board>
  );

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
