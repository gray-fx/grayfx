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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Overlays */}
        <AnimatePresence>
          {state.timeoutTeam && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 bg-primary text-primary-foreground rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
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
              className="mb-3 bg-yellow-500 text-black rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
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
              className="mb-3 bg-destructive text-destructive-foreground rounded-lg px-6 py-3 flex items-center justify-center gap-3 font-display font-bold text-lg uppercase tracking-wider"
            >
              <AlertTriangle className="h-5 w-5" />
              Challenge — {state.challengeTeam === "home" ? state.homeTeam : state.awayTeam}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Scoreboard */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          {/* Sport & Period Bar */}
          <div className="bg-secondary px-6 py-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">{state.sport}</span>
            {d.showPeriod && (
              <span className="text-sm font-display font-semibold text-foreground">
                {state.sport === "baseball"
                  ? `${state.inningHalf === "top" ? "▲" : "▼"} ${ordinal(state.inning)}`
                  : `${ordinal(state.period)} ${config.periodName}`}
              </span>
            )}
            {state.sport !== "baseball" && (
              <span className="text-xs text-muted-foreground font-display">{state.clockRunning ? "LIVE" : "STOPPED"}</span>
            )}
            {state.sport === "baseball" && (
              <span className="text-xs text-muted-foreground font-display">{state.outs} OUT{state.outs !== 1 ? "S" : ""}</span>
            )}
          </div>

          {/* Score Area */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-8 py-10">
            {/* Home */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <PossessionDot side="home" />
                <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-foreground">{state.homeTeam}</h2>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div key={state.homeScore} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
                  className="text-7xl md:text-9xl font-display font-black text-primary">{state.homeScore}</motion.div>
              </AnimatePresence>
              {d.showTimeouts && config.timeoutsPerHalf > 0 && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: SPORT_CONFIG[state.sport].timeoutsPerHalf }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < state.homeTimeouts ? "bg-primary" : "bg-transparent"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Center - Clock */}
            <div className="text-center px-8 space-y-2">
              {state.sport !== "baseball" ? (
                d.showClock && (
                  <div className="font-mono text-5xl md:text-7xl font-bold text-foreground tracking-wider tabular-nums">{clockText}</div>
                )
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-3 justify-center">
                    <div className="text-center"><span className="text-xs text-muted-foreground">B</span>
                      <div className="flex gap-1 mt-0.5">{[0, 1, 2, 3].map((i) => (<div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < state.balls ? "bg-primary" : ""}`} />))}</div>
                    </div>
                    <div className="text-center"><span className="text-xs text-muted-foreground">S</span>
                      <div className="flex gap-1 mt-0.5">{[0, 1].map((i) => (<div key={i} className={`w-3 h-3 rounded-full border border-destructive ${i < state.strikes ? "bg-destructive" : ""}`} />))}</div>
                    </div>
                    <div className="text-center"><span className="text-xs text-muted-foreground">O</span>
                      <div className="flex gap-1 mt-0.5">{[0, 1].map((i) => (<div key={i} className={`w-3 h-3 rounded-full border border-foreground ${i < state.outs ? "bg-foreground" : ""}`} />))}</div>
                    </div>
                  </div>
                </div>
              )}
              {d.showStoppage && state.sport === "soccer" && state.stoppage && (
                <span className="text-sm text-destructive font-display font-semibold">{state.stoppage}</span>
              )}
              <div className="text-xs text-muted-foreground uppercase tracking-wide">VS</div>
            </div>

            {/* Away */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-foreground">{state.awayTeam}</h2>
                <PossessionDot side="away" />
              </div>
              <AnimatePresence mode="popLayout">
                <motion.div key={state.awayScore} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
                  className="text-7xl md:text-9xl font-display font-black text-primary">{state.awayScore}</motion.div>
              </AnimatePresence>
              {d.showTimeouts && config.timeoutsPerHalf > 0 && (
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: SPORT_CONFIG[state.sport].timeoutsPerHalf }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-primary ${i < state.awayTimeouts ? "bg-primary" : "bg-transparent"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footers */}
          {d.showDownDistance && state.sport === "football" && (
            <div className="bg-secondary px-6 py-3 flex items-center justify-center gap-6 text-sm font-display">
              <span className="text-foreground font-bold">{ordinal(state.down)} & {state.yardsToGo}</span>
              <span className="text-muted-foreground">Ball on {state.ballOn}</span>
            </div>
          )}

          {d.showFouls && state.sport === "basketball" && (
            <div className="bg-secondary px-6 py-3 flex items-center justify-center gap-6 text-sm font-display">
              <span className="text-muted-foreground">Home Fouls: <span className="text-foreground font-bold">{state.homeFouls}</span></span>
              <span className="text-muted-foreground">Away Fouls: <span className="text-foreground font-bold">{state.awayFouls}</span></span>
            </div>
          )}

          {d.showPlayerFouls && state.sport === "basketball" && (state.homePlayerFouls.length > 0 || state.awayPlayerFouls.length > 0) && (
            <div className="bg-card border-t border-border px-6 py-3 grid grid-cols-2 gap-6 text-xs font-display">
              {(["home", "away"] as const).map((side) => {
                const list = side === "home" ? state.homePlayerFouls : state.awayPlayerFouls;
                return (
                  <div key={side}>
                    <div className="text-muted-foreground uppercase mb-1">{side === "home" ? state.homeTeam : state.awayTeam} Player Fouls</div>
                    <div className="flex flex-wrap gap-2">
                      {list.map((p) => (
                        <span key={p.player} className={`px-2 py-0.5 rounded ${p.fouls >= 5 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"}`}>
                          {p.player}: <strong>{p.fouls}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {state.sport === "hockey" && (d.showSOG || d.showPIM) && (
            <div className="bg-secondary px-6 py-3 flex items-center justify-center gap-6 text-sm font-display">
              {d.showSOG && <span className="text-muted-foreground">SOG: <span className="text-foreground font-bold">{state.homeSOG}</span> - <span className="text-foreground font-bold">{state.awaySOG}</span></span>}
              {d.showPIM && <span className="text-muted-foreground">PIM: <span className="text-foreground font-bold">{state.homePenaltyMinutes}</span> - <span className="text-foreground font-bold">{state.awayPenaltyMinutes}</span></span>}
            </div>
          )}
        </div>

        {/* Live Stat Feed */}
        {d.showStats && state.statLog.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-card border border-border rounded-xl overflow-hidden shadow-lg">
            <div className="bg-secondary px-6 py-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-display">Live Stats</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {[...state.statLog].reverse().slice(0, 10).map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="px-6 py-2 flex items-center gap-4 border-b border-border last:border-0">
                  <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{entry.clock}</span>
                  <span className="text-xs font-bold text-primary w-16 shrink-0 uppercase">{entry.team === "home" ? state.homeTeam : state.awayTeam}</span>
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
