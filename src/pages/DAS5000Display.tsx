import { useDAS5000, formatClock } from "@/hooks/use-das5000";
import { SegText } from "@/components/das5000/SevenSeg";
import { useMemo } from "react";

/**
 * Daktronics Basketball Scoreboard — faithful reproduction of the
 * BB-2102 / BB-2103 indoor LED scoreboard with PLAYER FOUL panel.
 *
 *  ┌─────────────────────────────────────────────┐
 *  │            ┌── DAKTRONICS ──┐               │
 *  │            │     CLOCK       │              │
 *  │            └─────────────────┘              │
 *  │   HOME            PERIOD            GUEST   │
 *  │  ┌─────┐    ┌──┐ ┌──┐ ┌──┐         ┌─────┐ │
 *  │  │ 101 │    │BB│ │ 4│ │B │         │ 87  │ │
 *  │  └─────┘    └──┘ └──┘ └──┘         └─────┘ │
 *  │   FOULS         PLAYER FOUL          FOULS  │
 *  │  ┌─────┐       ┌────┐ ┌──┐          ┌─────┐│
 *  │  │  6  │       │ 29 │ │ 3│          │ 10  ││
 *  │  └─────┘       └────┘ └──┘          └─────┘│
 *  │   SCORE           MATCH               SCORE │
 *  └─────────────────────────────────────────────┘
 */

const COLOR_AMBER = "#ffb000";
const COLOR_RED = "#ff2418";

function LedBox({
  children,
  width,
  height,
  padX = 12,
  padY = 6,
}: {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  padX?: number;
  padY?: number;
}) {
  return (
    <div
      style={{
        background: "#050505",
        border: "3px solid #f4f4f4",
        boxShadow:
          "inset 0 0 18px rgba(0,0,0,0.95), 0 0 0 1px #000",
        width,
        height,
        padding: `${padY}px ${padX}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}

function Label({
  children,
  size = 36,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div
      style={{
        color: "#ffffff",
        fontFamily: "'Arial Narrow', Impact, Haettenschweiler, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.04em",
        lineHeight: 1,
        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export default function DAS5000Display() {
  const { state } = useDAS5000(false);

  const clockText = useMemo(
    () => formatClock(state.clockMs, state.showTenthsUnder60),
    [state.clockMs, state.showTenthsUnder60],
  );

  // Center bonus indicators (the small "B" / arrow boxes flanking PERIOD)
  const homeBonusOn = state.bonus === "home" || state.doubleBonus === "home";
  const guestBonusOn = state.bonus === "guest" || state.doubleBonus === "guest";
  const homeDouble = state.doubleBonus === "home";
  const guestDouble = state.doubleBonus === "guest";
  const possessionHome = state.possession === "home";
  const possessionGuest = state.possession === "guest";

  // Pick latest player foul to display (most recent fouled player)
  const latestFoul = useMemo(() => {
    const all = [
      ...state.homePlayers.map((p) => ({ ...p, side: "home" as const })),
      ...state.guestPlayers.map((p) => ({ ...p, side: "guest" as const })),
    ].filter((p) => p.fouls > 0);
    return all.length ? all[all.length - 1] : null;
  }, [state.homePlayers, state.guestPlayers]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "#1a1a1a" }}
    >
      {/* Outer black scoreboard panel */}
      <div
        className="relative"
        style={{
          background: "#0a0a0a",
          border: "2px solid #2a2a2a",
          borderRadius: 14,
          padding: "28px 38px 38px",
          width: "min(1100px, 96vw)",
          aspectRatio: "1080 / 800",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.85), inset 0 0 60px rgba(0,0,0,0.6)",
          display: "grid",
          gridTemplateRows: "auto 1fr 1fr",
        }}
      >
        {/* ── ROW 1: CLOCK ── */}
        <div className="flex justify-center items-start pt-1 pb-2">
          <div
            style={{
              position: "relative",
              padding: "10px 22px 14px",
              border: "3px solid #fafafa",
              background: "#040404",
              boxShadow:
                "inset 0 0 24px rgba(0,0,0,0.95), 0 0 0 1px #000",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#0a0a0a",
                padding: "0 10px",
                color: "#ffffff",
                fontFamily: "Arial, sans-serif",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.25em",
              }}
            >
              DAKTRONICS
            </div>
            <SegText text={clockText} height={120} color={COLOR_AMBER} />
          </div>
        </div>

        {/* ── ROW 2: HOME · PERIOD · GUEST ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 24,
            padding: "10px 0",
          }}
        >
          {/* HOME */}
          <div className="flex flex-col items-center gap-3">
            <Label size={48}>HOME</Label>
            <LedBox padX={18} padY={8}>
              <SegText
                text={String(state.homeScore).padStart(3, " ")}
                height={138}
                color={COLOR_RED}
              />
            </LedBox>
          </div>

          {/* CENTER: bonus L · PERIOD · bonus R */}
          <div className="flex flex-col items-center gap-3">
            <Label size={40}>PERIOD</Label>
            <div className="flex items-stretch gap-2">
              {/* Left bonus indicator (HOME possession arrow + double-bonus "B B") */}
              <LedBox padX={6} padY={6} width={42}>
                <div className="flex flex-col items-center" style={{ lineHeight: 0.9 }}>
                  <SegText
                    text={possessionHome ? "<" : " "}
                    height={22}
                    color={COLOR_AMBER}
                  />
                  <SegText
                    text="B"
                    height={32}
                    color={homeBonusOn ? COLOR_AMBER : "rgba(255,255,255,0.06)"}
                  />
                  <SegText
                    text="B"
                    height={32}
                    color={homeDouble ? COLOR_AMBER : "rgba(255,255,255,0.06)"}
                  />
                </div>
              </LedBox>

              {/* Period digit */}
              <LedBox padX={16} padY={6} width={92}>
                <SegText
                  text={String(state.period)}
                  height={100}
                  color={COLOR_AMBER}
                />
              </LedBox>

              {/* Right bonus indicator (GUEST) */}
              <LedBox padX={6} padY={6} width={42}>
                <div className="flex flex-col items-center" style={{ lineHeight: 0.9 }}>
                  <SegText
                    text={possessionGuest ? ">" : " "}
                    height={22}
                    color={COLOR_AMBER}
                  />
                  <SegText
                    text="B"
                    height={32}
                    color={guestBonusOn ? COLOR_AMBER : "rgba(255,255,255,0.06)"}
                  />
                  <SegText
                    text="B"
                    height={32}
                    color={guestDouble ? COLOR_AMBER : "rgba(255,255,255,0.06)"}
                  />
                </div>
              </LedBox>
            </div>
          </div>

          {/* GUEST */}
          <div className="flex flex-col items-center gap-3">
            <Label size={48}>GUEST</Label>
            <LedBox padX={18} padY={8}>
              <SegText
                text={String(state.guestScore).padStart(3, " ")}
                height={138}
                color={COLOR_RED}
              />
            </LedBox>
          </div>
        </div>

        {/* ── ROW 3: FOULS · PLAYER FOUL · FOULS ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "end",
            gap: 24,
            paddingBottom: 4,
          }}
        >
          {/* HOME FOULS */}
          <div className="flex flex-col items-center gap-2">
            <Label size={28}>FOULS</Label>
            <LedBox padX={14} padY={6}>
              <SegText
                text={String(state.homeFouls).padStart(2, " ")}
                height={86}
                color={COLOR_RED}
              />
            </LedBox>
            <Label size={26}>SCORE</Label>
          </div>

          {/* PLAYER FOUL */}
          <div className="flex flex-col items-center gap-2">
            <Label size={28}>PLAYER FOUL</Label>
            <LedBox padX={16} padY={6}>
              <div className="flex items-center" style={{ gap: 20 }}>
                <SegText
                  text={(latestFoul?.number ?? "  ").padStart(2, " ").slice(-2)}
                  height={78}
                  color={COLOR_AMBER}
                />
                <SegText
                  text={latestFoul ? String(latestFoul.fouls) : " "}
                  height={78}
                  color={COLOR_AMBER}
                />
              </div>
            </LedBox>
            <Label size={26}>MATCH</Label>
          </div>

          {/* GUEST FOULS */}
          <div className="flex flex-col items-center gap-2">
            <Label size={28}>FOULS</Label>
            <LedBox padX={14} padY={6}>
              <SegText
                text={String(state.guestFouls).padStart(2, " ")}
                height={86}
                color={COLOR_RED}
              />
            </LedBox>
            <Label size={26}>SCORE</Label>
          </div>
        </div>

        {/* Horn flash */}
        {Date.now() - state.hornAt < 1200 && (
          <div
            className="absolute inset-0 pointer-events-none animate-pulse"
            style={{
              background: "rgba(255,180,0,0.18)",
              borderRadius: 14,
            }}
          />
        )}
      </div>
    </div>
  );
}
