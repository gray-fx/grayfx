import { useDAS5000, formatClock } from "@/hooks/use-das5000";
import { SevenSegNumber, SegText } from "@/components/das5000/SevenSeg";
import { useEffect, useState } from "react";

if (typeof document !== "undefined") {
  const id = "barlow-condensed-font";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&display=swap";
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

  const RED         = "#ff2a2a";
  const AMBER       = "#ffb800";
  const GREEN       = "#1cff5a";
  const GHOST_AMBER = "#2a2000";
  const GHOST_RED   = "#2a0000";

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

  // Outer scoreboard bezel
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

  // Individual digit panel — dark inset box
  const Module = ({ children, className = "", style = {} }: any) => (
    <div
      className={`rounded-lg flex items-center justify-center ${className}`}
      style={{
        background: "#0a0a0a",
        border: "3px solid #1a1a1a",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.95)",
        ...style,
      }}
    >
      {children}
    </div>
  );

  // Ghost + live digit stack — reusable pattern
  const LedStack = ({
    ghost,
    live,
    ghostDigits,
    liveDigits,
    height,
    ghostColor,
    liveColor,
  }: {
    ghost: number;
    live: number;
    ghostDigits: number;
    liveDigits: number;
    height: number;
    ghostColor: string;
    liveColor: string;
  }) => (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <SevenSegNumber value={ghost} digits={ghostDigits} height={height} color={ghostColor} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SevenSegNumber value={live} digits={liveDigits} height={height} color={liveColor} />
      </div>
    </div>
  );

  // ── BASKETBALL ─────────────────────────────────────────────────────────────
  const renderBasketball = (withFouls: boolean) => {
    const pfActive = (state.lastFoulPlayer ?? null) !== null && state.lastFoulPlayer !== 0;

    return (
      <Board>
        {/* Branding strip */}
        <div
          style={{
            background: "#000",
            borderBottom: "2px solid #222",
            fontFamily: LABEL_FONT,
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: "0.25em",
            color: "#555",
            textAlign: "center",
            padding: "4px 0",
          }}
        >
          DAKTRONICS
        </div>

        <div style={{ background: "#111", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── ROW 1: Clock — full width, centered, hero size ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Module style={{ padding: "10px 52px" }}>
              {/*
                Clock is the single most prominent element on the board.
                180px tall matches the reference image where the clock
                towers over everything else in the top section.
              */}
              <SegText text={clockStr} height={180} color={AMBER} />
            </Module>
          </div>

          {/* ── ROW 2: HOME label+score | PERIOD | GUEST label+score ──
              Grid: 3fr 1fr 3fr
              Period column is deliberately narrow — on the reference board it
              is roughly 1/3 the width of each score column.
          ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 3fr",
              gap: 10,
              alignItems: "end",       // bottom-align so SCORE labels line up
            }}
          >
            {/* HOME */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>
                {state.homeName}
              </Label>
              <Module style={{ width: "100%", padding: "16px 8px", display: "flex", justifyContent: "center" }}>
                <LedStack
                  ghost={888} ghostDigits={3} ghostColor={GHOST_RED}
                  live={state.homeScore} liveDigits={3} liveColor={RED}
                  height={240}
                />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>

            {/* PERIOD — narrow, vertically centered relative to score modules */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>PERIOD</Label>
              <Module
                style={{
                  width: "100%",
                  padding: "12px 4px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {/* Possession arrows + period digit row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" }}>
                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 24px)",
                      lineHeight: 1,
                      color: state.possession === "home" ? AMBER : "#1c1c1c",
                      textShadow: state.possession === "home" ? `0 0 14px ${AMBER}` : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                      flexShrink: 0,
                    }}
                  >◄</span>

                  {/* Period digit — shorter than score digits, matches reference */}
                  <LedStack
                    ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER}
                    live={state.period} liveDigits={1} liveColor={AMBER}
                    height={150}
                  />

                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 24px)",
                      lineHeight: 1,
                      color: state.possession === "guest" ? AMBER : "#1c1c1c",
                      textShadow: state.possession === "guest" ? `0 0 14px ${AMBER}` : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                      flexShrink: 0,
                    }}
                  >►</span>
                </div>

                {/* Bonus "B" indicators — flanking, inside module */}
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "0 6px" }}>
                  {(["home", "guest"] as const).map((side) => (
                    <span
                      key={side}
                      style={{
                        fontFamily: LABEL_FONT,
                        fontWeight: 900,
                        fontSize: "clamp(12px, 1.5vw, 20px)",
                        color:
                          state.bonus === side || state.doubleBonus === side
                            ? AMBER : "#1c1c1c",
                        textShadow:
                          state.bonus === side || state.doubleBonus === side
                            ? `0 0 10px ${AMBER}` : "none",
                        transition: "color 0.15s",
                      }}
                    >B</span>
                  ))}
                </div>
              </Module>
              {/* Invisible spacer — keeps bottom aligned with SCORE labels */}
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)", opacity: 0, pointerEvents: "none" }}>
                SCORE
              </Label>
            </div>

            {/* GUEST */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>
                {state.guestName}
              </Label>
              <Module style={{ width: "100%", padding: "16px 8px", display: "flex", justifyContent: "center" }}>
                <LedStack
                  ghost={888} ghostDigits={3} ghostColor={GHOST_RED}
                  live={state.guestScore} liveDigits={3} liveColor={RED}
                  height={240}
                />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>
          </div>

          {/* ── ROW 3: FOULS | PLAYER FOUL + MATCH + TOL | FOULS ──
              Same 3fr 1fr 3fr grid — columns stay locked to row 2.
              Fouls modules are square: enforce equal height by fixing padding.
          ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 3fr",
              gap: 10,
              alignItems: "start",
            }}
          >
            {/* HOME FOULS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              {/*
                Square foul box: width is determined by the grid column.
                aspectRatio 1 makes it always square.
              */}
              <Module
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LedStack
                  ghost={88} ghostDigits={2} ghostColor={GHOST_RED}
                  live={state.homeFouls} liveDigits={2} liveColor={RED}
                  height={130}
                />
              </Module>
            </div>

            {/* CENTER: PLAYER FOUL + MATCH label + TOL pair */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(11px, 1.3vw, 18px)" }}>PLAYER FOUL</Label>
              <Module
                style={{
                  width: "100%",
                  padding: "10px 6px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {/* "## #" ghost always visible; live value overlays when active */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Player number — 2 digits */}
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <SevenSegNumber value={88} digits={2} height={130} color={GHOST_AMBER} />
                    {pfActive && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <SevenSegNumber value={state.lastFoulPlayer ?? 0} digits={2} height={130} color={AMBER} />
                      </div>
                    )}
                  </div>
                  {/* Foul count — 1 digit */}
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <SevenSegNumber value={8} digits={1} height={130} color={GHOST_AMBER} />
                    {pfActive && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <SevenSegNumber value={state.lastFoulCount ?? 0} digits={1} height={130} color={AMBER} />
                      </div>
                    )}
                  </div>
                </div>
              </Module>

              <Label style={{ fontSize: "clamp(13px, 1.5vw, 20px)" }}>MATCH</Label>

              {/* TOL pair */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {(["homeTOL", "guestTOL"] as const).map((key) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <Label style={{ fontSize: "clamp(9px, 1vw, 14px)" }}>TOL</Label>
                    <Module style={{ padding: "4px 8px" }}>
                      <LedStack
                        ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER}
                        live={state[key]} liveDigits={1} liveColor={GREEN}
                        height={44}
                      />
                    </Module>
                  </div>
                ))}
              </div>
            </div>

            {/* GUEST FOULS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              <Module
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LedStack
                  ghost={88} ghostDigits={2} ghostColor={GHOST_RED}
                  live={state.guestFouls} liveDigits={2} liveColor={RED}
                  height={130}
                />
              </Module>
            </div>
          </div>

          {/* ── Optional player foul grid ── */}
          {withFouls && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                paddingTop: 16,
                borderTop: "2px solid #27272a",
              }}
            >
              <PlayerFoulCol title={state.homeName} players={state.homePlayers} />
              <PlayerFoulCol title={state.guestName} players={state.guestPlayers} />
            </div>
          )}
        </div>
      </Board>
    );
  };

  // ── Shared helpers for non-basketball layouts ──────────────────────────────

  const Panel = ({ children, className = "" }: any) => (
    <div
      className={`bg-black border-4 border-zinc-800 rounded-lg p-6 ${className}`}
      style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7)" }}
    >
      {children}
    </div>
  );

  const Label2 = ({ children, className = "" }: any) => (
    <div
      className={`tracking-wider text-center uppercase text-white ${className}`}
      style={{ fontFamily: LABEL_FONT, fontWeight: 900 }}
    >
      {children}
    </div>
  );

  const TeamBlock = ({ name, score, color, dotsBonus, dotsDouble }: any) => (
    <div className="flex flex-col items-center gap-3 flex-1">
      <Label2 className="text-4xl md:text-6xl truncate w-full px-2">{name}</Label2>
      <SevenSegNumber value={score} digits={3} height={220} color={color} />
      {(dotsBonus || dotsDouble) && (
        <div className="flex gap-2 mt-1">
          <div className="w-5 h-5 rounded-full" style={{ background: dotsBonus ? AMBER : "#222", boxShadow: dotsBonus ? `0 0 10px ${AMBER}` : "none" }} />
          <div className="w-5 h-5 rounded-full" style={{ background: dotsDouble ? RED : "#222", boxShadow: dotsDouble ? `0 0 10px ${RED}` : "none" }} />
        </div>
      )}
    </div>
  );

  // ── Football ───────────────────────────────────────────────────────────────
  const renderFootball = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Qtr</Label2>
            <SevenSegNumber value={state.period} digits={1} height={110} color={AMBER} />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Clock</Label2>
            <SegText text={clockStr} height={160} color={RED} />
          </div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <Label2 className="text-xl">Down</Label2>
              <SevenSegNumber value={state.down} digits={1} height={70} color={AMBER} />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">To Go</Label2>
              <SevenSegNumber value={state.distance} digits={2} height={70} color={AMBER} />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">Ball On</Label2>
              <SevenSegNumber value={state.ballOn} digits={2} height={70} color={AMBER} />
            </div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  // ── Hockey ─────────────────────────────────────────────────────────────────
  const renderHockey = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col items-center gap-4">
          <Label2 className="text-5xl">{state.homeName}</Label2>
          <SevenSegNumber value={state.homeScore} digits={2} height={210} color={RED} />
          <div className="text-center">
            <Label2 className="text-xl">SOG</Label2>
            <SevenSegNumber value={state.homeSOG} digits={2} height={70} color={AMBER} />
          </div>
          <div className="text-center">
            <Label2 className="text-xl">Penalty</Label2>
            <SegText text={formatClock(state.homePenaltyMs)} height={70} color={AMBER} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Period</Label2>
            <SevenSegNumber value={state.period} digits={1} height={110} color={AMBER} />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Clock</Label2>
            <SegText text={clockStr} height={170} color={RED} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Label2 className="text-5xl">{state.guestName}</Label2>
          <SevenSegNumber value={state.guestScore} digits={2} height={210} color={RED} />
          <div className="text-center">
            <Label2 className="text-xl">SOG</Label2>
            <SevenSegNumber value={state.guestSOG} digits={2} height={70} color={AMBER} />
          </div>
          <div className="text-center">
            <Label2 className="text-xl">Penalty</Label2>
            <SegText text={formatClock(state.guestPenaltyMs)} height={70} color={AMBER} />
          </div>
        </div>
      </div>
    </Panel>
  );

  // ── Soccer ─────────────────────────────────────────────────────────────────
  const renderSoccer = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8 items-center">
        <TeamBlock name={state.homeName} score={state.homeScore} color={GREEN} />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Half</Label2>
            <SevenSegNumber value={state.period} digits={1} height={90} color={AMBER} />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Time</Label2>
            <SegText text={clockStr} height={170} color={GREEN} />
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={GREEN} />
      </div>
    </Panel>
  );

  // ── Baseball ───────────────────────────────────────────────────────────────
  const renderBaseball = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-6">
          <div className="flex items-center gap-4">
            <Label2 className="text-2xl">Inn</Label2>
            <SegText text={`${state.inningHalf}${state.inning}`} height={100} color={AMBER} />
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center">
              <Label2 className="text-xl">B</Label2>
              <SevenSegNumber value={state.balls} digits={1} height={70} color={GREEN} />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">S</Label2>
              <SevenSegNumber value={state.strikes} digits={1} height={70} color={AMBER} />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">O</Label2>
              <SevenSegNumber value={state.outs} digits={1} height={70} color={RED} />
            </div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  // ── Minimal ────────────────────────────────────────────────────────────────
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
    "indoor-bball":       renderBasketball(false),
    "indoor-bball-fouls": renderBasketball(true),
    "outdoor-football":   renderFootball(),
    hockey:               renderHockey(),
    soccer:               renderSoccer(),
    baseball:             renderBaseball(),
    minimal:              renderMinimal(),
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
