import { useScoreboard, SPORT_CONFIG, formatClock } from "@/hooks/use-scoreboard";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, AlertTriangle, Hand } from "lucide-react";

const ScoreboardDisplay = () => {
  const { state } = useScoreboard(false);
  const config = SPORT_CONFIG[state.sport];
  const d = state.display;
  const clockText = formatClock(state.clockMs, d);

  const ordinal = (n: number) => {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  };

  const PossessionDot = ({ side }: { side: "home" | "away" }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: d.showPossession && state.possession === side ? 1 : 0 }}
      className="w-3 h-3 rounded-full bg-primary"
    />
  );

  // Ghost digit string for LED effect — fills display width with "8"s
  const ghostScore = "888";
  const ghostFoul = "88";
  const ghostClock = state.sport === "baseball" ? "" : "88:88";
  const ghostPeriod = "8";
  const ghostPlayerFoul = "88 8";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-3">

        {/* Overlays */}
        <AnimatePresence>
          {state.timeoutTeam && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
            >
              <Hand className="h-5 w-5" />
              Timeout — {state.timeoutTeam === "home" ? state.homeTeam : state.awayTeam}
            </motion.div>
          )}
          {state.sport === "football" && state.flagOnPlay && (
            <motion.div
              key="flag"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-yellow-500 text-black rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
            >
              <Flag className="h-5 w-5" /> Flag on the Play
            </motion.div>
          )}
          {state.sport === "football" && state.challengeTeam && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive text-destructive-foreground rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
            >
              <AlertTriangle className="h-5 w-5" />
              Challenge — {state.challengeTeam === "home" ? state.homeTeam : state.awayTeam}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Scoreboard */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">

          {/* ── ROW 1: Sport bar + Clock ── */}
          <div className="bg-secondary px-6 py-3 flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display w-24">{state.sport}</span>

            {/* Clock — centered, large */}
            <div className="flex-1 flex justify-center">
              {state.sport !== "baseball" && d.showClock && (
                <div className="bg-black rounded-md px-6 py-2 relative inline-flex items-center justify-center">
                  {/* Ghost digits */}
                  <span className="font-mono text-7xl font-bold tracking-wider tabular-nums select-none pointer-events-none absolute text-[#1a1a00]">
                    {ghostClock}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={clockText}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-7xl font-bold text-[hsl(var(--primary))] tracking-wider tabular-nums relative z-10"
                    >
                      {clockText}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
              {state.sport === "baseball" && (
                <div className="flex gap-5 items-center">
                  {[
                    { label: "B", count: state.balls, max: 4, color: "bg-primary" },
                    { label: "S", count: state.strikes, max: 2, color: "bg-destructive" },
                    { label: "O", count: state.outs, max: 2, color: "bg-foreground" },
                  ].map(({ label, count, max, color }) => (
                    <div key={label} className="text-center">
                      <span className="text-xs text-muted-foreground font-display">{label}</span>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: max }).map((_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < count ? color : ""}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-24 text-right">
              {state.sport !== "baseball" && (
                <span className="text-xs text-muted-foreground font-display">{state.clockRunning ? "LIVE" : "STOPPED"}</span>
              )}
              {state.sport === "baseball" && (
                <span className="text-xs text-muted-foreground font-display">{state.outs} OUT{state.outs !== 1 ? "S" : ""}</span>
              )}
            </div>
          </div>

          {/* ── ROW 2: HOME | PERIOD | GUEST ── */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-0 px-8 pt-8 pb-4">

            {/* HOME */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <PossessionDot side="home" />
                <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-foreground uppercase">
                  {state.homeTeam}
                </h2>
              </div>
              {/* LED score box */}
              <div className="bg-black border-2 border-border rounded-md w-full flex items-center justify-center py-4 relative">
                {/* Ghost */}
                <span className="font-mono text-8xl font-black tracking-widest tabular-nums text-[#1a0000] select-none pointer-events-none absolute">
                  {ghostScore}
                </span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={state.homeScore}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="font-mono text-8xl font-black text-destructive tracking-widest tabular-nums relative z-10"
                  >
                    {state.homeScore}
                  </motion.span>
                </AnimatePresence>
              </div>
              {/* Timeouts */}
              {d.showTimeouts && config.timeoutsPerHalf > 0 && (
                <div className="flex gap-1.5">
                  {Array.from({ length: config.timeoutsPerHalf }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < state.homeTimeouts ? "bg-primary" : "bg-transparent"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* CENTER — Period */}
            <div className="flex flex-col items-center gap-2 px-6">
              {d.showPeriod && state.sport !== "baseball" && (
                <>
                  <span className="text-sm font-display font-semibold text-foreground uppercase tracking-widest">
                    {config.periodName}
                  </span>
                  {/* LED period box — narrower */}
                  <div className="bg-black border-2 border-border rounded-md w-28 flex items-center justify-center py-4 relative">
                    <span className="font-mono text-7xl font-black tracking-widest tabular-nums text-[#1a1a00] select-none pointer-events-none absolute">
                      {ghostPeriod}
                    </span>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={state.period}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="font-mono text-7xl font-black text-primary tracking-widest tabular-nums relative z-10"
                      >
                        {state.sport === "baseball"
                          ? `${state.inningHalf === "top" ? "▲" : "▼"}${state.inning}`
                          : state.period}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </>
              )}
              {d.showStoppage && state.sport === "soccer" && state.stoppage && (
                <span className="text-sm text-destructive font-display font-semibold">{state.stoppage}</span>
              )}
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-display">VS</div>
            </div>

            {/* GUEST / AWAY */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-foreground uppercase">
                  {state.awayTeam}
                </h2>
                <PossessionDot side="away" />
              </div>
              {/* LED score box */}
              <div className="bg-black border-2 border-border rounded-md w-full flex items-center justify-center py-4 relative">
                <span className="font-mono text-8xl font-black tracking-widest tabular-nums text-[#1a0000] select-none pointer-events-none absolute">
                  {ghostScore}
                </span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={state.awayScore}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="font-mono text-8xl font-black text-destructive tracking-widest tabular-nums relative z-10"
                  >
                    {state.awayScore}
                  </motion.span>
                </AnimatePresence>
              </div>
              {d.showTimeouts && config.timeoutsPerHalf > 0 && (
                <div className="flex gap-1.5">
                  {Array.from({ length: config.timeoutsPerHalf }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < state.awayTimeouts ? "bg-primary" : "bg-transparent"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 3: FOULS | PLAYER FOUL | FOULS (basketball) ── */}
          {d.showFouls && state.sport === "basketball" && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-0 px-8 pb-6">

              {/* Home fouls — square box */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">Fouls</span>
                <div className="bg-black border-2 border-border rounded-md aspect-square w-20 flex items-center justify-center relative">
                  <span className="font-mono text-5xl font-black tabular-nums text-[#1a0000] select-none pointer-events-none absolute">
                    {ghostFoul}
                  </span>
                  <span className="font-mono text-5xl font-black text-destructive tabular-nums relative z-10">
                    {state.homeFouls}
                  </span>
                </div>
              </div>

              {/* Player foul — center wide box */}
              <div className="flex flex-col items-center gap-1 px-6">
                <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">Player Foul</span>
                {(state.homePlayerFouls.length > 0 || state.awayPlayerFouls.length > 0) ? (
                  <div className="bg-black border-2 border-border rounded-md px-6 py-3 relative flex items-center justify-center">
                    <span className="font-mono text-5xl font-black tabular-nums text-[#1a1a00] select-none pointer-events-none absolute tracking-[0.3em]">
                      {ghostPlayerFoul}
                    </span>
                    {/* Show most recent player foul entry */}
                    {(() => {
                      const latest = [...state.homePlayerFouls, ...state.awayPlayerFouls].sort((a, b) => b.fouls - a.fouls)[0];
                      return latest ? (
                        <span className="font-mono text-5xl font-black text-primary tabular-nums relative z-10 tracking-[0.3em]">
                          {latest.player} {latest.fouls}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="bg-black border-2 border-border rounded-md px-6 py-3 flex items-center justify-center">
                    <span className="font-mono text-5xl font-black text-[#1a1a00] tabular-nums tracking-[0.3em]">
                      {ghostPlayerFoul}
                    </span>
                  </div>
                )}
              </div>

              {/* Away fouls — square box */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-display font-bold text-foreground uppercase tracking-widest">Fouls</span>
                <div className="bg-black border-2 border-border rounded-md aspect-square w-20 flex items-center justify-center relative">
                  <span className="font-mono text-5xl font-black tabular-nums text-[#1a0000] select-none pointer-events-none absolute">
                    {ghostFoul}
                  </span>
                  <span className="font-mono text-5xl font-black text-destructive tabular-nums relative z-10">
                    {state.awayFouls}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── ROW 3 labels: SCORE | MATCH | SCORE ── */}
          <div className="grid grid-cols-3 bg-secondary px-8 py-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display text-center">Score</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display text-center">Match</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display text-center">Score</span>
          </div>

          {/* ── Football-specific footer ── */}
          {d.showDownDistance && state.sport === "football" && (
            <div className="bg-secondary px-6 py-3 flex items-center justify-center gap-6 text-sm font-display">
              <span className="text-foreground font-bold">{ordinal(state.down)} & {state.yardsToGo}</span>
              <span className="text-muted-foreground">Ball on {state.ballOn}</span>
            </div>
          )}

          {/* ── Hockey stats footer ── */}
          {state.sport === "hockey" && (d.showSOG || d.showPIM) && (
            <div className="bg-secondary px-6 py-3 flex items-center justify-center gap-6 text-sm font-display">
              {d.showSOG && (
                <span className="text-muted-foreground">
                  SOG: <span className="text-foreground font-bold">{state.homeSOG}</span>
                  {" - "}
                  <span className="text-foreground font-bold">{state.awaySOG}</span>
                </span>
              )}
              {d.showPIM && (
                <span className="text-muted-foreground">
                  PIM: <span className="text-foreground font-bold">{state.homePenaltyMinutes}</span>
                  {" - "}
                  <span className="text-foreground font-bold">{state.awayPenaltyMinutes}</span>
                </span>
              )}
            </div>
          )}

          {/* ── Player fouls detail panel (basketball) ── */}
          {d.showPlayerFouls && state.sport === "basketball" && (state.homePlayerFouls.length > 0 || state.awayPlayerFouls.length > 0) && (
            <div className="bg-card border-t border-border px-6 py-3 grid grid-cols-2 gap-6 text-xs font-display">
              {(["home", "away"] as const).map((side) => {
                const list = side === "home" ? state.homePlayerFouls : state.awayPlayerFouls;
                return (
                  <div key={side}>
                    <div className="text-muted-foreground uppercase mb-1">
                      {side === "home" ? state.homeTeam : state.awayTeam} Player Fouls
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {list.map((p) => (
                        <span
                          key={p.player}
                          className={`px-2 py-0.5 rounded ${p.fouls >= 5 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"}`}
                        >
                          {p.player}: <strong>{p.fouls}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Live Stat Feed ── */}
        {d.showStats && state.statLog.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-lg"
          >
            <div className="bg-secondary px-6 py-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Live Stats</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {[...state.statLog].reverse().slice(0, 10).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-6 py-2 flex items-center gap-4 border-b border-border last:border-0"
                >
                  <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{entry.clock}</span>
                  <span className="text-xs font-bold text-primary w-16 shrink-0 uppercase">
                    {entry.team === "home" ? state.homeTeam : state.awayTeam}
                  </span>
                  <span className="text-sm text-foreground">{entry.player}</span>
                  <span className="text-sm font-semibold text-foreground ml-auto">{entry.action}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ScoreboardDisplay;
