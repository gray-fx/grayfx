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

// ── Design tokens — Daktronics navy board ──────────────────────────────────
const BOARD_BG      = "#1a3a6b";
const BOARD_BORDER  = "#2a5098";
const BOARD_ACCENT  = "#4070c0";
const MODULE_BG     = "#000000";
const MODULE_BORDER = "#2a5098";

const RED         = "#ff2a2a";
const AMBER       = "#ffb800";
const GREEN       = "#1cff5a";
const GHOST_AMBER = "#2a2000";
const GHOST_RED   = "#2a0000";

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

  // ── Primitives ──────────────────────────────────────────────────────────────

  const Label = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div
      style={{
        fontFamily: LABEL_FONT,
        fontWeight: 900,
        color: "#ffffff",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const Board = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        background: BOARD_BG,
        border: `4px solid ${BOARD_BORDER}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: `0 0 0 2px ${BOARD_ACCENT}, 0 20px 60px rgba(0,0,0,0.9)`,
      }}
    >
      {children}
    </div>
  );

  const Module = ({
    children,
    style = {},
  }: {
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
    <div
      style={{
        background: MODULE_BG,
        border: `3px solid ${MODULE_BORDER}`,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.95)",
        ...style,
      }}
    >
      {children}
    </div>
  );

  // Ghost + live digit stack — live sits pixel-perfectly over ghost
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

  // ── BASKETBALL ──────────────────────────────────────────────────────────────
  const renderBasketball = (withFouls: boolean) => {
    const pfActive = (state.lastFoulPlayer ?? null) !== null && state.lastFoulPlayer !== 0;

    return (
      <Board>
        <div
          style={{
            background: "#000",
            borderBottom: `2px solid ${BOARD_BORDER}`,
            fontFamily: LABEL_FONT,
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: "0.3em",
            color: "#4a6090",
            textAlign: "center",
            padding: "4px 0",
          }}
        >
          DAKTRONICS
        </div>

        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ROW 1 — Clock hero */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Module style={{ padding: "10px 52px" }}>
              <SegText text={clockStr} height={180} color={AMBER} />
            </Module>
          </div>

          {/* ROW 2 — HOME | PERIOD | GUEST  (3fr 1fr 3fr) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 3fr",
              gap: 10,
              alignItems: "end",
            }}
          >
            {/* HOME */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
              <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
                <LedStack
                  ghost={888} ghostDigits={3} ghostColor={GHOST_RED}
                  live={state.homeScore} liveDigits={3} liveColor={RED}
                  height={240}
                />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>

            {/* PERIOD */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>PERIOD</Label>
              <Module style={{ width: "100%", padding: "12px 4px", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%" }}>
                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 22px)",
                      lineHeight: 1,
                      flexShrink: 0,
                      color: state.possession === "home" ? AMBER : "#1c1c1c",
                      textShadow: state.possession === "home" ? `0 0 12px ${AMBER}` : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                    }}
                  >◄</span>
                  <LedStack
                    ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER}
                    live={state.period} liveDigits={1} liveColor={AMBER}
                    height={150}
                  />
                  <span
                    style={{
                      fontFamily: LABEL_FONT,
                      fontWeight: 900,
                      fontSize: "clamp(14px, 1.8vw, 22px)",
                      lineHeight: 1,
                      flexShrink: 0,
                      color: state.possession === "guest" ? AMBER : "#1c1c1c",
                      textShadow: state.possession === "guest" ? `0 0 12px ${AMBER}` : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                    }}
                  >►</span>
                </div>
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "0 6px" }}>
                  {(["home", "guest"] as const).map((side) => (
                    <span
                      key={side}
                      style={{
                        fontFamily: LABEL_FONT,
                        fontWeight: 900,
                        fontSize: "clamp(12px, 1.5vw, 18px)",
                        color: state.bonus === side || state.doubleBonus === side ? AMBER : "#1c1c1c",
                        textShadow: state.bonus === side || state.doubleBonus === side ? `0 0 10px ${AMBER}` : "none",
                        transition: "color 0.15s",
                      }}
                    >B</span>
                  ))}
                </div>
              </Module>
              {/* Invisible spacer — keeps SCORE labels baseline-aligned */}
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
            </div>

            {/* GUEST */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
              <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
                <LedStack
                  ghost={888} ghostDigits={3} ghostColor={GHOST_RED}
                  live={state.guestScore} liveDigits={3} liveColor={RED}
                  height={240}
                />
              </Module>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 30px)" }}>SCORE</Label>
            </div>
          </div>

          {/* ROW 3 — FOULS | PLAYER FOUL + MATCH + TOL | FOULS  (3fr 1fr 3fr) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "3fr 1fr 3fr",
              gap: 10,
              alignItems: "start",
            }}
          >
            {/* HOME FOULS — square */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              <Module style={{ width: "100%", aspectRatio: "1", padding: 0 }}>
                <LedStack
                  ghost={88} ghostDigits={2} ghostColor={GHOST_RED}
                  live={state.homeFouls} liveDigits={2} liveColor={RED}
                  height={130}
                />
              </Module>
            </div>

            {/* CENTER — Player Foul + MATCH + TOL */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(11px, 1.3vw, 18px)" }}>PLAYER FOUL</Label>
              <Module style={{ width: "100%", padding: "10px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <SevenSegNumber value={88} digits={2} height={130} color={GHOST_AMBER} />
                    {pfActive && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <SevenSegNumber value={state.lastFoulPlayer ?? 0} digits={2} height={130} color={AMBER} />
                      </div>
                    )}
                  </div>
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

            {/* GUEST FOULS — square */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>FOULS</Label>
              <Module style={{ width: "100%", aspectRatio: "1", padding: 0 }}>
                <LedStack
                  ghost={88} ghostDigits={2} ghostColor={GHOST_RED}
                  live={state.guestFouls} liveDigits={2} liveColor={RED}
                  height={130}
                />
              </Module>
            </div>
          </div>

          {/* Optional per-player foul grid */}
          {withFouls && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                paddingTop: 16,
                borderTop: `2px solid ${BOARD_BORDER}`,
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

  // ── FOOTBALL ────────────────────────────────────────────────────────────────
  const renderFootball = () => (
    <Board>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Module style={{ padding: "10px 52px" }}>
            <SegText text={clockStr} height={150} color={AMBER} />
          </Module>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.6fr 3fr", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.homeScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: "100%" }}>
              {[
                { label: "QTR",  value: state.period,   digits: 1, ghost: 8,  color: AMBER },
                { label: "DOWN", value: state.down,     digits: 1, ghost: 8,  color: AMBER },
                { label: "TO GO",value: state.distance, digits: 2, ghost: 88, color: AMBER },
                { label: "ON",   value: state.ballOn,   digits: 2, ghost: 88, color: AMBER },
              ].map(({ label, value, digits, ghost, color }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Label style={{ fontSize: "clamp(9px, 1vw, 14px)" }}>{label}</Label>
                  <Module style={{ width: "100%", padding: "6px 4px", justifyContent: "center" }}>
                    <LedStack ghost={ghost} ghostDigits={digits} ghostColor={GHOST_AMBER} live={value} liveDigits={digits} liveColor={color} height={60} />
                  </Module>
                </div>
              ))}
            </div>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.guestScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
        </div>
      </div>
    </Board>
  );

  // ── HOCKEY ──────────────────────────────────────────────────────────────────
  const renderHockey = () => (
    <Board>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Module style={{ padding: "10px 52px" }}>
            <SegText text={clockStr} height={150} color={AMBER} />
          </Module>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 3fr", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_RED} live={state.homeScore} liveDigits={2} liveColor={RED} height={210} />
            </Module>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", marginTop: 6 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>SOG</Label>
                <Module style={{ width: "100%", padding: "8px 4px", justifyContent: "center" }}>
                  <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_AMBER} live={state.homeSOG} liveDigits={2} liveColor={AMBER} height={70} />
                </Module>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>PENALTY</Label>
                <Module style={{ width: "100%", padding: "8px 4px", justifyContent: "center" }}>
                  <SegText text={formatClock(state.homePenaltyMs)} height={70} color={AMBER} />
                </Module>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>PERIOD</Label>
            <Module style={{ width: "100%", padding: "12px 4px", justifyContent: "center" }}>
              <LedStack ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER} live={state.period} liveDigits={1} liveColor={AMBER} height={120} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_RED} live={state.guestScore} liveDigits={2} liveColor={RED} height={210} />
            </Module>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", marginTop: 6 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>SOG</Label>
                <Module style={{ width: "100%", padding: "8px 4px", justifyContent: "center" }}>
                  <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_AMBER} live={state.guestSOG} liveDigits={2} liveColor={AMBER} height={70} />
                </Module>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>PENALTY</Label>
                <Module style={{ width: "100%", padding: "8px 4px", justifyContent: "center" }}>
                  <SegText text={formatClock(state.guestPenaltyMs)} height={70} color={AMBER} />
                </Module>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Board>
  );

  // ── SOCCER ──────────────────────────────────────────────────────────────────
  const renderSoccer = () => (
    <Board>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Module style={{ padding: "10px 52px" }}>
            <SegText text={clockStr} height={150} color={GREEN} />
          </Module>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 3fr", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_RED} live={state.homeScore} liveDigits={2} liveColor={GREEN} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>HALF</Label>
            <Module style={{ width: "100%", padding: "12px 4px", justifyContent: "center" }}>
              <LedStack ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER} live={state.period} liveDigits={1} liveColor={AMBER} height={150} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={88} ghostDigits={2} ghostColor={GHOST_RED} live={state.guestScore} liveDigits={2} liveColor={GREEN} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
        </div>
      </div>
    </Board>
  );

  // ── BASEBALL ────────────────────────────────────────────────────────────────
  const renderBaseball = () => (
    <Board>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.4fr 3fr", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.homeScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Label style={{ fontSize: "clamp(12px, 1.4vw, 20px)" }}>INNING</Label>
            <Module style={{ width: "100%", padding: "10px 4px", justifyContent: "center" }}>
              <SegText text={`${state.inningHalf}${state.inning}`} height={100} color={AMBER} />
            </Module>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, width: "100%" }}>
              {[
                { label: "B", value: state.balls,   color: GREEN },
                { label: "S", value: state.strikes, color: AMBER },
                { label: "O", value: state.outs,    color: RED   },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Label style={{ fontSize: "clamp(11px, 1.2vw, 18px)" }}>{label}</Label>
                  <Module style={{ width: "100%", padding: "6px 4px", justifyContent: "center" }}>
                    <LedStack ghost={8} ghostDigits={1} ghostColor={GHOST_AMBER} live={value} liveDigits={1} liveColor={color} height={60} />
                  </Module>
                </div>
              ))}
            </div>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)", opacity: 0, pointerEvents: "none" }}>SCORE</Label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.guestScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
            <Label style={{ fontSize: "clamp(16px, 2.2vw, 28px)" }}>SCORE</Label>
          </div>
        </div>
      </div>
    </Board>
  );

  // ── MINIMAL ─────────────────────────────────────────────────────────────────
  const renderMinimal = () => (
    <Board>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 3fr", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.homeName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.homeScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
          </div>
          <Module style={{ padding: "10px 16px", flexDirection: "column", gap: 6 }}>
            <SegText text={clockStr} height={140} color={AMBER} />
          </Module>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Label style={{ fontSize: "clamp(22px, 3vw, 42px)" }}>{state.guestName}</Label>
            <Module style={{ width: "100%", padding: "16px 8px", justifyContent: "center" }}>
              <LedStack ghost={888} ghostDigits={3} ghostColor={GHOST_RED} live={state.guestScore} liveDigits={3} liveColor={RED} height={220} />
            </Module>
          </div>
        </div>
      </div>
    </Board>
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
        style={{
          fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
          fontWeight: 900,
          fontSize: 18,
          color: "#ffffff",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {title} • Player Fouls
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {players.length === 0 && (
          <div style={{ gridColumn: "span 5", color: "#555", fontSize: 12, textAlign: "center" }}>
            No players logged
          </div>
        )}
        {players.map((p, i) => (
          <div
            key={i}
            style={{
              background: "#0a0a0a",
              border: `2px solid #2a5098`,
              borderRadius: 6,
              padding: "8px 4px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#ffb800", fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif", fontWeight: 900, fontSize: 16 }}>#{p.number}</div>
            <div style={{ color: "#ff2a2a", fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif", fontWeight: 900, fontSize: 20 }}>{p.fouls}F</div>
            <div style={{ color: "#888", fontFamily: "'Barlow Condensed','Arial Narrow',sans-serif", fontWeight: 900, fontSize: 14 }}>{p.points}pt</div>
          </div>
        ))}
      </div>
    </div>
  );
}
