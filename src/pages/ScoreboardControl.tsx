import { useState } from "react";
import { useScoreboard, SPORT_CONFIG, getDefaultState, type SportType, type StatEntry } from "@/hooks/use-scoreboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, Play, Pause, RotateCcw, ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const SPORT_ACTIONS: Record<SportType, string[]> = {
  football: ["Touchdown", "Field Goal", "Extra Point", "2PT Conversion", "Safety", "Interception", "Fumble", "Sack", "Tackle", "Pass Complete", "Rush", "Penalty", "Punt", "Kickoff"],
  basketball: ["2PT Made", "3PT Made", "Free Throw", "Rebound", "Assist", "Steal", "Block", "Turnover", "Foul", "Tech Foul"],
  baseball: ["Single", "Double", "Triple", "Home Run", "Walk", "Strikeout", "Ground Out", "Fly Out", "RBI", "Stolen Base", "Error", "Hit By Pitch"],
  hockey: ["Goal", "Assist", "Shot", "Save", "Hit", "Blocked Shot", "Penalty", "Power Play Goal", "Faceoff Win"],
  soccer: ["Goal", "Assist", "Shot", "Shot on Target", "Save", "Foul", "Yellow Card", "Red Card", "Corner", "Offside"],
};

const ScoreboardControl = () => {
  const { state, update } = useScoreboard(true);
  const config = SPORT_CONFIG[state.sport];

  const [statTeam, setStatTeam] = useState<"home" | "away">("home");
  const [statPlayer, setStatPlayer] = useState("");
  const [statAction, setStatAction] = useState("");

  const changeSport = (sport: SportType) => {
    const fresh = getDefaultState(sport);
    update(fresh);
  };

  const resetGame = () => update(getDefaultState(state.sport));

  const addStat = () => {
    if (!statPlayer.trim() || !statAction) return;
    const entry: StatEntry = {
      id: crypto.randomUUID(),
      team: statTeam,
      player: statPlayer.trim(),
      action: statAction,
      period: state.period,
      clock: state.sport === "baseball" ? `${state.inningHalf === "top" ? "▲" : "▼"}${state.inning}` : state.clock,
      timestamp: Date.now(),
    };
    update({ statLog: [...state.statLog, entry] });
    setStatPlayer("");
  };

  const removeStat = (id: string) => {
    update({ statLog: state.statLog.filter((s) => s.id !== id) });
  };

  const clearStats = () => update({ statLog: [] });

  const ScoreControl = ({ side, label }: { side: "home" | "away"; label: string }) => {
    const scoreKey = side === "home" ? "homeScore" : "awayScore";
    const teamKey = side === "home" ? "homeTeam" : "awayTeam";
    const toKey = side === "home" ? "homeTimeouts" : "awayTimeouts";
    const foulsKey = side === "home" ? "homeFouls" : "awayFouls";

    const scoreIncrements = state.sport === "football" ? [1, 2, 3, 6, 7] :
      state.sport === "basketball" ? [1, 2, 3] : [1];

    return (
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">{label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={state[teamKey]}
            onChange={(e) => update({ [teamKey]: e.target.value.toUpperCase() })}
            className="text-center font-display font-bold"
          />
          <div className="text-center">
            <span className="text-4xl font-display font-bold text-primary">{state[scoreKey]}</span>
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {scoreIncrements.map((n) => (
              <Button key={n} size="sm" onClick={() => update({ [scoreKey]: state[scoreKey] + n })}>+{n}</Button>
            ))}
          </div>
          <div className="flex gap-1 justify-center">
            <Button size="sm" variant="outline" onClick={() => update({ [scoreKey]: Math.max(0, state[scoreKey] - 1) })}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => update({ [scoreKey]: 0 })}>Reset</Button>
          </div>

          {config.timeoutsPerHalf > 0 && (
            <div className="pt-2">
              <span className="text-xs text-muted-foreground">Timeouts: {state[toKey]}</span>
              <div className="flex gap-1 mt-1">
                <Button size="sm" variant="secondary" onClick={() => update({ [toKey]: Math.max(0, state[toKey] - 1) })}>
                  <Minus className="h-3 w-3" /> TO
                </Button>
                <Button size="sm" variant="secondary" onClick={() => update({ [toKey]: state[toKey] + 1 })}>
                  <Plus className="h-3 w-3" /> TO
                </Button>
              </div>
            </div>
          )}

          {state.sport === "basketball" && (
            <div className="pt-2">
              <span className="text-xs text-muted-foreground">Fouls: {state[foulsKey]}</span>
              <div className="flex gap-1 mt-1">
                <Button size="sm" variant="secondary" onClick={() => update({ [foulsKey]: Math.max(0, state[foulsKey] - 1) })}>
                  <Minus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => update({ [foulsKey]: state[foulsKey] + 1 })}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant={state.possession === side ? "default" : "outline"}
            className="w-full"
            onClick={() => update({ possession: state.possession === side ? null : side })}
          >
            Possession
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Scoreboard Control</h1>
        </div>
        <Link to="/scoreboard" target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3 w-3 mr-1" /> Open Display
          </Button>
        </Link>
      </div>

      {/* Sport Selector */}
      <Card className="mb-4">
        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
          <Select value={state.sport} onValueChange={(v) => changeSport(v as SportType)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="football">🏈 Football</SelectItem>
              <SelectItem value="basketball">🏀 Basketball</SelectItem>
              <SelectItem value="baseball">⚾ Baseball</SelectItem>
              <SelectItem value="hockey">🏒 Hockey</SelectItem>
              <SelectItem value="soccer">⚽ Soccer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={resetGame}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset Game
          </Button>
        </CardContent>
      </Card>

      {/* Team Controls */}
      <div className="flex gap-4 mb-4">
        <ScoreControl side="home" label="Home" />
        <ScoreControl side="away" label="Away" />
      </div>

      {/* Clock & Period */}
      {state.sport !== "baseball" && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Clock & {config.periodName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Input
                value={state.clock}
                onChange={(e) => update({ clock: e.target.value })}
                className="text-center font-mono text-2xl w-32"
              />
              <Button onClick={() => update({ clockRunning: !state.clockRunning })} variant={state.clockRunning ? "destructive" : "default"}>
                {state.clockRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {state.clockRunning ? "Stop" : "Start"}
              </Button>
              <Button variant="outline" onClick={() => update({ clock: config.defaultClock })}>
                Reset Clock
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{config.periodName}:</span>
              <Button size="sm" variant="outline" onClick={() => update({ period: Math.max(1, state.period - 1) })}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-display font-bold text-lg w-8 text-center">{state.period}</span>
              <Button size="sm" variant="outline" onClick={() => update({ period: state.period + 1 })}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {state.sport === "soccer" && (
              <Input
                placeholder="Stoppage time (e.g. +3)"
                value={state.stoppage}
                onChange={(e) => update({ stoppage: e.target.value })}
                className="w-40"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Football-specific */}
      {state.sport === "football" && (
        <Card className="mb-4">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-display">Down & Distance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Down:</span>
              {[1, 2, 3, 4].map((d) => (
                <Button key={d} size="sm" variant={state.down === d ? "default" : "outline"} onClick={() => update({ down: d })}>
                  {d}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">To Go:</span>
              <Input
                type="number"
                value={state.yardsToGo}
                onChange={(e) => update({ yardsToGo: parseInt(e.target.value) || 0 })}
                className="w-20 text-center"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Ball On:</span>
              <Input
                value={state.ballOn}
                onChange={(e) => update({ ballOn: e.target.value.toUpperCase() })}
                className="w-32 text-center"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baseball-specific */}
      {state.sport === "baseball" && (
        <Card className="mb-4">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-display">Baseball Controls</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Inning:</span>
              <Button size="sm" variant={state.inningHalf === "top" ? "default" : "outline"} onClick={() => update({ inningHalf: "top" })}>
                ▲ Top
              </Button>
              <Button size="sm" variant={state.inningHalf === "bottom" ? "default" : "outline"} onClick={() => update({ inningHalf: "bottom" })}>
                ▼ Bot
              </Button>
              <Button size="sm" variant="outline" onClick={() => update({ inning: Math.max(1, state.inning - 1) })}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{state.inning}</span>
              <Button size="sm" variant="outline" onClick={() => update({ inning: state.inning + 1 })}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Outs:</span>
              {[0, 1, 2, 3].map((o) => (
                <Button key={o} size="sm" variant={state.outs === o ? "default" : "outline"} onClick={() => update({ outs: o })}>
                  {o}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Balls:</span>
                {[0, 1, 2, 3].map((b) => (
                  <Button key={b} size="sm" variant={state.balls === b ? "default" : "outline"} onClick={() => update({ balls: b })}>
                    {b}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Strikes:</span>
                {[0, 1, 2].map((s) => (
                  <Button key={s} size="sm" variant={state.strikes === s ? "default" : "outline"} onClick={() => update({ strikes: s })}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hockey-specific */}
      {state.sport === "hockey" && (
        <Card className="mb-4">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-display">Hockey Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-8">
              <div>
                <span className="text-xs text-muted-foreground">Home SOG: {state.homeSOG}</span>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => update({ homeSOG: Math.max(0, state.homeSOG - 1) })}><Minus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => update({ homeSOG: state.homeSOG + 1 })}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Away SOG: {state.awaySOG}</span>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => update({ awaySOG: Math.max(0, state.awaySOG - 1) })}><Minus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => update({ awaySOG: state.awaySOG + 1 })}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <span className="text-xs text-muted-foreground">Home PIM: {state.homePenaltyMinutes}</span>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => update({ homePenaltyMinutes: Math.max(0, state.homePenaltyMinutes - 2) })}>-2</Button>
                  <Button size="sm" variant="outline" onClick={() => update({ homePenaltyMinutes: state.homePenaltyMinutes + 2 })}>+2</Button>
                  <Button size="sm" variant="outline" onClick={() => update({ homePenaltyMinutes: state.homePenaltyMinutes + 5 })}>+5</Button>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Away PIM: {state.awayPenaltyMinutes}</span>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => update({ awayPenaltyMinutes: Math.max(0, state.awayPenaltyMinutes - 2) })}>-2</Button>
                  <Button size="sm" variant="outline" onClick={() => update({ awayPenaltyMinutes: state.awayPenaltyMinutes + 2 })}>+2</Button>
                  <Button size="sm" variant="outline" onClick={() => update({ awayPenaltyMinutes: state.awayPenaltyMinutes + 5 })}>+5</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScoreboardControl;
