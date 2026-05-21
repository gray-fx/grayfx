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

  const RED   = "#ff2a2a";
  const AMBER = "#ffb800";
  const GREEN = "#1cff5a";

  // Ghost (always-dim) color for unlit segments — simulates real LED matrix
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

  // ── BASKETBALL layout ──────────────────────────────────────────────────────
  //
  // Proportions matching reference photo:
  //   Clock     — very large, top-center, prominent
  //   Scores    — hero digits (240px), wide columns (3fr each)
  //   Period    — narrower column (1.4fr), digit ~150px, SMALLER than scores
  //   Fouls     — taller (130px), sit below scores in same columns
  //   PF box    — always shows "## #" ghost segments; lights up when pfActive
  //   Bonus "B" — inside the period module, flanking the period digit
  //
  const renderBasketball = (withFouls: boolean) => {
    const pfActive =
      (state.lastFoulPlayer ?? null) !== null && state.lastFoulPlayer !== 0;

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

        <div
          style={{
            background: "#111",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* ── ROW 1: Clock centered — LARGE ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Module style={{ padding: "12px 48px" }}>
              {/*
                Clock is the hero element — 180px tall to match reference.
                On the real board the clock is the single most prominent digit.
              */}
              <SegText text={clockStr} height={180} color={AMBER} />
            </Module>
          </div>

          {/* ── ROW 2: Score | Period | Score  (3fr 1.4fr 3fr) ── */}
          {/*
            Period column is intentionally narrower (1.4fr vs 3fr) so it reads
            as a secondary element, matching the reference image proportions.
          */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1.4fr 3fr",
              gap: 12,
              alignItems: "start",
            }}
          >
            {/* HOME score */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(20px, 3vw, 40px)" }}>
                {state.homeName}
              </Label>
              <Module
                style={{
                  width: "100%",
                  padding: "18px 8px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {/*
                  Ghost layer: always render dim "888" behind the live value.
                  We achieve this by stacking two SevenSegNumber components in
                  a position:relative wrapper — ghost at opacity 1 with dim color,
                  real value on top with position:absolute and full color.
                  This guarantees the ghost outline is always visible regardless
                  of whether the digit is 0 or undefined.
                */}
                <div style={{ position: "relative", display: "inline-flex" }}>
                  {/* Ghost layer — always lit dim */}
                  <SevenSegNumber
                    value={888}
                    digits={3}
                    height={240}
                    color={GHOST_RED}
                  />
                  {/* Live value — on top */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SevenSegNumber
                      value={state.homeScore}
                      digits={3}
                      height={240}
                      color={RED}
                    />
                  </div>
                </div>
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>
                SCORE
              </Label>
            </div>

            {/* CENTER: PERIOD label + module */}
            {/*
              The period digit is shorter (150px) than the score digits (240px),
              making it clearly a secondary/supporting display.
              Possession arrows sit beside the digit; "B" bonus indicators are
              below the digit inside the same module, flanking it — matching the
              reference image where "B" appears on both sides of the period digit.
            */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(13px, 1.6vw, 22px)" }}>
                PERIOD
              </Label>
              <Module
                style={{
                  width: "100%",
                  padding: "14px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Possession arrow row + period digit */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(16px, 2vw, 26px)",
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      lineHeight: 1,
                      flexShrink: 0,
                      color:
                        state.possession === "home" ? AMBER : "#1c1c1c",
                      textShadow:
                        state.possession === "home"
                          ? `0 0 14px ${AMBER}`
                          : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                    }}
                  >
                    ◄
                  </span>
                  {/* Period digit — 150px tall (smaller than 240px scores) */}
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <SevenSegNumber
                      value={8}
                      digits={1}
                      height={150}
                      color={GHOST_AMBER}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SevenSegNumber
                        value={state.period}
                        digits={1}
                        height={150}
                        color={AMBER}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "clamp(16px, 2vw, 26px)",
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      lineHeight: 1,
                      flexShrink: 0,
                      color:
                        state.possession === "guest" ? AMBER : "#1c1c1c",
                      textShadow:
                        state.possession === "guest"
                          ? `0 0 14px ${AMBER}`
                          : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                    }}
                  >
                    ►
                  </span>
                </div>

                {/* Bonus "B" indicators inside module, flanking — like reference */}
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    padding: "0 8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 22px)",
                      color:
                        state.bonus === "home" || state.doubleBonus === "home"
                          ? AMBER
                          : "#1c1c1c",
                      textShadow:
                        state.bonus === "home" || state.doubleBonus === "home"
                          ? `0 0 10px ${AMBER}`
                          : "none",
                      transition: "color 0.15s",
                    }}
                  >
                    B
                  </span>
                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 22px)",
                      color:
                        state.bonus === "guest" ||
                        state.doubleBonus === "guest"
                          ? AMBER
                          : "#1c1c1c",
                      textShadow:
                        state.bonus === "guest" ||
                        state.doubleBonus === "guest"
                          ? `0 0 10px ${AMBER}`
                          : "none",
                      transition: "color 0.15s",
                    }}
                  >
                    B
                  </span>
                </div>
              </Module>
              {/* Invisible spacer to align bottom with SCORE label */}
              <Label
                style={{
                  fontSize: "clamp(16px, 2.2vw, 30px)",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              >
                SCORE
              </Label>
            </div>

            {/* GUEST score */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(20px, 3vw, 40px)" }}>
                {state.guestName}
              </Label>
              <Module
                style={{
                  width: "100%",
                  padding: "18px 8px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <SevenSegNumber
                    value={888}
                    digits={3}
                    height={240}
                    color={GHOST_RED}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SevenSegNumber
                      value={state.guestScore}
                      digits={3}
                      height={240}
                      color={RED}
                    />
                  </div>
                </div>
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>
                SCORE
              </Label>
            </div>
          </div>

          {/* ── ROW 3: Fouls | Player Foul + MATCH/TOL | Fouls  (3fr 1.4fr 3fr) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1.4fr 3fr",
              gap: 12,
              alignItems: "start",
            }}
          >
            {/* HOME fouls */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>
                FOULS
              </Label>
              <Module
                style={{
                  width: "100%",
                  padding: "12px 8px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {/*
                  Fouls: ghost layer always shows "88", live value on top.
                  Height increased to 130px (was 100px) to match reference.
                */}
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <SevenSegNumber
                    value={88}
                    digits={2}
                    height={130}
                    color={GHOST_RED}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SevenSegNumber
                      value={state.homeFouls}
                      digits={2}
                      height={130}
                      color={RED}
                    />
                  </div>
                </div>
              </Module>
            </div>

            {/* CENTER: Player Foul display + MATCH label + TOL pair */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(13px, 1.6vw, 22px)" }}>
                PLAYER FOUL
              </Label>
              {/*
                Ghost segments: ALWAYS render the "## #" skeleton (2 digits,
                gap, 1 digit) at dim amber. When pfActive, live digits overlay
                on top at full AMBER. This matches the real Daktronics board
                behavior exactly.
              */}
              <Module
                style={{
                  width: "100%",
                  padding: "12px 8px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* Player number: 2 ghost digits */}
                  <div
                    style={{ position: "relative", display: "inline-flex" }}
                  >
                    <SevenSegNumber
                      value={88}
                      digits={2}
                      height={130}
                      color={GHOST_AMBER}
                    />
                    {pfActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SevenSegNumber
                          value={state.lastFoulPlayer ?? 0}
                          digits={2}
                          height={130}
                          color={AMBER}
                        />
                      </div>
                    )}
                  </div>

                  {/* Foul count: 1 ghost digit */}
                  <div
                    style={{ position: "relative", display: "inline-flex" }}
                  >
                    <SevenSegNumber
                      value={8}
                      digits={1}
                      height={130}
                      color={GHOST_AMBER}
                    />
                    {pfActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SevenSegNumber
                          value={state.lastFoulCount ?? 0}
                          digits={1}
                          height={130}
                          color={AMBER}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Module>

              {/* MATCH label + TOL pair */}
              <Label style={{ fontSize: "clamp(14px, 1.8vw, 24px)" }}>
                MATCH
              </Label>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Label style={{ fontSize: "clamp(10px, 1.2vw, 16px)" }}>
                    TOL
                  </Label>
                  <Module style={{ padding: "5px 10px" }}>
                    <div
                      style={{ position: "relative", display: "inline-flex" }}
                    >
                      <SevenSegNumber
                        value={8}
                        digits={1}
                        height={44}
                        color={GHOST_AMBER}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SevenSegNumber
                          value={state.homeTOL}
                          digits={1}
                          height={44}
                          color={GREEN}
                        />
                      </div>
                    </div>
                  </Module>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Label style={{ fontSize: "clamp(10px, 1.2vw, 16px)" }}>
                    TOL
                  </Label>
                  <Module style={{ padding: "5px 10px" }}>
                    <div
                      style={{ position: "relative", display: "inline-flex" }}
                    >
                      <SevenSegNumber
                        value={8}
                        digits={1}
                        height={44}
                        color={GHOST_AMBER}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SevenSegNumber
                          value={state.guestTOL}
                          digits={1}
                          height={44}
                          color={GREEN}
                        />
                      </div>
                    </div>
                  </Module>
                </div>
              </div>
            </div>

            {/* GUEST fouls */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>
                FOULS
              </Label>
              <Module
                style={{
                  width: "100%",
                  padding: "12px 8px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <SevenSegNumber
                    value={88}
                    digits={2}
                    height={130}
                    color={GHOST_RED}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SevenSegNumber
                      value={state.guestFouls}
                      digits={2}
                      height={130}
                      color={RED}
                    />
                  </div>
                </div>
              </Module>
            </div>
          </div>

          {/* ── Optional player foul grid (indoor-bball-fouls) ── */}
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
              <PlayerFoulCol
                title={state.homeName}
                players={state.homePlayers}
              />
              <PlayerFoulCol
                title={state.guestName}
                players={state.guestPlayers}
              />
            </div>
          )}
        </div>
      </Board>
    );
  };

  // ── All other layouts unchanged ─────────────────────────────────────────────

  const Panel = ({ children, className = "" }: any) => (
    <div
      className={`bg-black border-4 border-zinc-800 rounded-lg p-6 ${className}`}
      style={{
        boxShadow:
          "inset 0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7)",
      }}
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

  const TeamBlock = ({
    name,
    score,
    color,
    dotsBonus,
    dotsDouble,
  }: any) => (
    <div className="flex flex-col items-center gap-3 flex-1">
      <Label2 className="text-4xl md:text-6xl truncate w-full px-2">
        {name}
      </Label2>
      <SevenSegNumber value={score} digits={3} height={220} color={color} />
      {(dotsBonus || dotsDouble) && (
        <div className="flex gap-2 mt-1">
          <div
            className="w-5 h-5 rounded-full"
            style={{
              background: dotsBonus ? AMBER : "#222",
              boxShadow: dotsBonus ? `0 0 10px ${AMBER}` : "none",
            }}
          />
          <div
            className="w-5 h-5 rounded-full"
            style={{
              background: dotsDouble ? RED : "#222",
              boxShadow: dotsDouble ? `0 0 10px ${RED}` : "none",
            }}
          />
        </div>
      )}
    </div>
  );

  const renderFootball = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock
          name={state.homeName}
          score={state.homeScore}
          color={RED}
        />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Qtr</Label2>
            <SevenSegNumber
              value={state.period}
              digits={1}
              height={110}
              color={AMBER}
            />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Clock</Label2>
            <SegText text={clockStr} height={160} color={RED} />
          </div>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <Label2 className="text-xl">Down</Label2>
              <SevenSegNumber
                value={state.down}
                digits={1}
                height={70}
                color={AMBER}
              />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">To Go</Label2>
              <SevenSegNumber
                value={state.distance}
                digits={2}
                height={70}
                color={AMBER}
              />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">Ball On</Label2>
              <SevenSegNumber
                value={state.ballOn}
                digits={2}
                height={70}
                color={AMBER}
              />
            </div>
          </div>
        </div>
        <TeamBlock
          name={state.guestName}
          score={state.guestScore}
          color={RED}
        />
      </div>
    </Panel>
  );

  const renderHockey = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col items-center gap-4">
          <Label2 className="text-5xl">{state.homeName}</Label2>
          <SevenSegNumber
            value={state.homeScore}
            digits={2}
            height={210}
            color={RED}
          />
          <div className="text-center">
            <Label2 className="text-xl">SOG</Label2>
            <SevenSegNumber
              value={state.homeSOG}
              digits={2}
              height={70}
              color={AMBER}
            />
          </div>
          <div className="text-center">
            <Label2 className="text-xl">Penalty</Label2>
            <SegText
              text={formatClock(state.homePenaltyMs)}
              height={70}
              color={AMBER}
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Period</Label2>
            <SevenSegNumber
              value={state.period}
              digits={1}
              height={110}
              color={AMBER}
            />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Clock</Label2>
            <SegText text={clockStr} height={170} color={RED} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Label2 className="text-5xl">{state.guestName}</Label2>
          <SevenSegNumber
            value={state.guestScore}
            digits={2}
            height={210}
            color={RED}
          />
          <div className="text-center">
            <Label2 className="text-xl">SOG</Label2>
            <SevenSegNumber
              value={state.guestSOG}
              digits={2}
              height={70}
              color={AMBER}
            />
          </div>
          <div className="text-center">
            <Label2 className="text-xl">Penalty</Label2>
            <SegText
              text={formatClock(state.guestPenaltyMs)}
              height={70}
              color={AMBER}
            />
          </div>
        </div>
      </div>
    </Panel>
  );

  const renderSoccer = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8 items-center">
        <TeamBlock
          name={state.homeName}
          score={state.homeScore}
          color={GREEN}
        />
        <div className="flex flex-col items-center gap-6 border-x-2 border-zinc-800 px-6">
          <div className="text-center">
            <Label2 className="text-2xl">Half</Label2>
            <SevenSegNumber
              value={state.period}
              digits={1}
              height={90}
              color={AMBER}
            />
          </div>
          <div className="text-center">
            <Label2 className="text-2xl">Time</Label2>
            <SegText text={clockStr} height={170} color={GREEN} />
          </div>
        </div>
        <TeamBlock
          name={state.guestName}
          score={state.guestScore}
          color={GREEN}
        />
      </div>
    </Panel>
  );

  const renderBaseball = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-8">
        <TeamBlock
          name={state.homeName}
          score={state.homeScore}
          color={RED}
        />
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-6">
          <div className="flex items-center gap-4">
            <Label2 className="text-2xl">Inn</Label2>
            <SegText
              text={`${state.inningHalf}${state.inning}`}
              height={100}
              color={AMBER}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="text-center">
              <Label2 className="text-xl">B</Label2>
              <SevenSegNumber
                value={state.balls}
                digits={1}
                height={70}
                color={GREEN}
              />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">S</Label2>
              <SevenSegNumber
                value={state.strikes}
                digits={1}
                height={70}
                color={AMBER}
              />
            </div>
            <div className="text-center">
              <Label2 className="text-xl">O</Label2>
              <SevenSegNumber
                value={state.outs}
                digits={1}
                height={70}
                color={RED}
              />
            </div>
          </div>
        </div>
        <TeamBlock
          name={state.guestName}
          score={state.guestScore}
          color={RED}
        />
      </div>
    </Panel>
  );

  const renderMinimal = () => (
    <Panel className="w-full max-w-[1200px]">
      <div className="grid grid-cols-3 gap-8 items-center">
        <TeamBlock
          name={state.homeName}
          score={state.homeScore}
          color={RED}
        />
        <SegText text={clockStr} height={180} color={AMBER} />
        <TeamBlock
          name={state.guestName}
          score={state.guestScore}
          color={RED}
        />
      </div>
    </Panel>
  );

  const layoutMap: Record<string, JSX.Element> = {
    "indoor-bball": renderBasketball(false),
    "indoor-bball-fouls": renderBasketball(true),
    "outdoor-football": renderFootball(),
    hockey: renderHockey(),
    soccer: renderSoccer(),
    baseball: renderBaseball(),
    minimal: renderMinimal(),
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8"
      style={{
        background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000 80%)",
      }}
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

function PlayerFoulCol({
  title,
  players,
}: {
  title: string;
  players: any[];
}) {
  return (
    <div>
      <div
        className="text-center text-xl uppercase mb-2 tracking-wider"
        style={{
          fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
          fontWeight: 900,
          color: "#ffffff",
        }}
      >
        {title} • Player Fouls
      </div>
      <div className="grid grid-cols-5 gap-2">
        {players.length === 0 && (
          <div className="col-span-5 text-zinc-600 text-xs text-center">
            No players logged
          </div>
        )}
        {players.map((p, i) => (
          <div
            key={i}
            className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center"
          >
            <div className="text-amber-400 font-bold text-lg">#{p.number}</div>
            <div className="text-red-500 font-mono text-xl">{p.fouls}F</div>
            <div className="text-zinc-400 font-mono text-sm">{p.points}pt</div>
          </div>
        ))}
      </div>
    </div>
  );
}
