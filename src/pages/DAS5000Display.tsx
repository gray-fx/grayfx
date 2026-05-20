import { useDAS5000, formatClock } from "@/hooks/use-das5000";
import { SevenSegNumber, SegText } from "@/components/das5000/SevenSeg";
import { useEffect, useState } from "react";

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

  const RED = "#ff2a2a";
  const AMBER = "#ffb800";
  const GREEN = "#1cff5a";

  const Label = ({ children, className = "" }: any) => (
    <div className={`text-yellow-300 font-black tracking-widest text-center uppercase ${className}`}
      style={{ fontFamily: "Impact, 'Arial Black', sans-serif", textShadow: "0 0 8px rgba(255,184,0,0.4)" }}>
      {children}
    </div>
  );

  const Panel = ({ children, className = "" }: any) => (
    <div className={`bg-black border-4 border-zinc-800 rounded-lg p-4 ${className}`}
      style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.7)" }}>
      {children}
    </div>
  );

  const TeamBlock = ({ name, score, color, dotsBonus, dotsDouble }: any) => (
    <div className="flex flex-col items-center gap-2 flex-1">
      <Label className="text-3xl md:text-5xl truncate w-full px-2">{name}</Label>
      <SevenSegNumber value={score} digits={3} height={160} color={color} />
      {(dotsBonus || dotsDouble) && (
        <div className="flex gap-2 mt-1">
          <div className="w-4 h-4 rounded-full" style={{ background: dotsBonus ? AMBER : "#222", boxShadow: dotsBonus ? `0 0 10px ${AMBER}` : "none" }} />
          <div className="w-4 h-4 rounded-full" style={{ background: dotsDouble ? RED : "#222", boxShadow: dotsDouble ? `0 0 10px ${RED}` : "none" }} />
        </div>
      )}
    </div>
  );

  // === LAYOUTS ===
  const renderBasketball = (withFouls: boolean) => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-6 items-stretch">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED}
          dotsBonus={state.bonus === "home"} dotsDouble={state.doubleBonus === "home"} />
        <div className="flex flex-col items-center justify-between gap-4 border-x-2 border-zinc-800 px-4">
          <div>
            <Label className="text-xl">Period</Label>
            <SevenSegNumber value={state.period} digits={1} height={80} color={AMBER} />
          </div>
          <div>
            <Label className="text-xl">{state.countUp ? "Time" : "Clock"}</Label>
            <SegText text={clockStr} height={120} color={RED} />
          </div>
          {state.showShotClock && (
            <div>
              <Label className="text-xl">Shot</Label>
              <SevenSegNumber value={Math.ceil(state.shotClockMs / 1000)} digits={2} height={60} color={AMBER} />
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className={`w-6 h-6 rounded-full ${state.possession === "home" ? "bg-amber-400" : "bg-zinc-800"}`}
              style={state.possession === "home" ? { boxShadow: `0 0 12px ${AMBER}` } : {}} />
            <Label className="text-sm">POSS</Label>
            <div className={`w-6 h-6 rounded-full ${state.possession === "guest" ? "bg-amber-400" : "bg-zinc-800"}`}
              style={state.possession === "guest" ? { boxShadow: `0 0 12px ${AMBER}` } : {}} />
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED}
          dotsBonus={state.bonus === "guest"} dotsDouble={state.doubleBonus === "guest"} />
      </div>
      <div className="grid grid-cols-3 gap-6 mt-6 pt-4 border-t-2 border-zinc-800">
        <div className="flex justify-around">
          <div className="text-center"><Label className="text-base">Fouls</Label><SevenSegNumber value={state.homeFouls} digits={2} height={50} color={AMBER} /></div>
          <div className="text-center"><Label className="text-base">TOL</Label><SevenSegNumber value={state.homeTOL} digits={1} height={50} color={GREEN} /></div>
        </div>
        <div className="text-center text-zinc-600 text-xs uppercase tracking-widest">All Sport 5000</div>
        <div className="flex justify-around">
          <div className="text-center"><Label className="text-base">TOL</Label><SevenSegNumber value={state.guestTOL} digits={1} height={50} color={GREEN} /></div>
          <div className="text-center"><Label className="text-base">Fouls</Label><SevenSegNumber value={state.guestFouls} digits={2} height={50} color={AMBER} /></div>
        </div>
      </div>
      {withFouls && (
        <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t-2 border-zinc-800">
          <PlayerFoulCol title={state.homeName} players={state.homePlayers} />
          <PlayerFoulCol title={state.guestName} players={state.guestPlayers} />
        </div>
      )}
    </Panel>
  );

  const renderFootball = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-6">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-4">
          <div><Label>Qtr</Label><SevenSegNumber value={state.period} digits={1} height={70} color={AMBER} /></div>
          <div><Label>Clock</Label><SegText text={clockStr} height={120} color={RED} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><Label>Down</Label><SevenSegNumber value={state.down} digits={1} height={50} color={AMBER} /></div>
            <div className="text-center"><Label>To Go</Label><SevenSegNumber value={state.distance} digits={2} height={50} color={AMBER} /></div>
            <div className="text-center"><Label>Ball On</Label><SevenSegNumber value={state.ballOn} digits={2} height={50} color={AMBER} /></div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const renderHockey = () => (
    <Panel className="w-full max-w-[1600px]">
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col items-center gap-3">
          <Label className="text-4xl">{state.homeName}</Label>
          <SevenSegNumber value={state.homeScore} digits={2} height={150} color={RED} />
          <div className="text-center"><Label>SOG</Label><SevenSegNumber value={state.homeSOG} digits={2} height={50} color={AMBER} /></div>
          <div className="text-center"><Label>Penalty</Label><SegText text={formatClock(state.homePenaltyMs)} height={50} color={AMBER} /></div>
        </div>
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-4">
          <div><Label>Period</Label><SevenSegNumber value={state.period} digits={1} height={70} color={AMBER} /></div>
          <div><Label>Clock</Label><SegText text={clockStr} height={130} color={RED} /></div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Label className="text-4xl">{state.guestName}</Label>
          <SevenSegNumber value={state.guestScore} digits={2} height={150} color={RED} />
          <div className="text-center"><Label>SOG</Label><SevenSegNumber value={state.guestSOG} digits={2} height={50} color={AMBER} /></div>
          <div className="text-center"><Label>Penalty</Label><SegText text={formatClock(state.guestPenaltyMs)} height={50} color={AMBER} /></div>
        </div>
      </div>
    </Panel>
  );

  const renderSoccer = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-6 items-center">
        <TeamBlock name={state.homeName} score={state.homeScore} color={GREEN} />
        <div className="flex flex-col items-center gap-4 border-x-2 border-zinc-800 px-4">
          <div><Label>Half</Label><SevenSegNumber value={state.period} digits={1} height={60} color={AMBER} /></div>
          <div><Label>Time</Label><SegText text={clockStr} height={130} color={GREEN} /></div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={GREEN} />
      </div>
    </Panel>
  );

  const renderBaseball = () => (
    <Panel className="w-full max-w-[1400px]">
      <div className="grid grid-cols-3 gap-6">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <div className="flex flex-col items-center gap-3 border-x-2 border-zinc-800 px-4">
          <div className="flex items-center gap-3">
            <Label>Inn</Label>
            <SegText text={`${state.inningHalf}${state.inning}`} height={70} color={AMBER} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center"><Label>B</Label><SevenSegNumber value={state.balls} digits={1} height={50} color={GREEN} /></div>
            <div className="text-center"><Label>S</Label><SevenSegNumber value={state.strikes} digits={1} height={50} color={AMBER} /></div>
            <div className="text-center"><Label>O</Label><SevenSegNumber value={state.outs} digits={1} height={50} color={RED} /></div>
          </div>
        </div>
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const renderMinimal = () => (
    <Panel className="w-full max-w-[1200px]">
      <div className="grid grid-cols-3 gap-6 items-center">
        <TeamBlock name={state.homeName} score={state.homeScore} color={RED} />
        <SegText text={clockStr} height={140} color={AMBER} />
        <TeamBlock name={state.guestName} score={state.guestScore} color={RED} />
      </div>
    </Panel>
  );

  const layoutMap: Record<string, JSX.Element> = {
    "indoor-bball": renderBasketball(false),
    "indoor-bball-fouls": renderBasketball(true),
    "outdoor-football": renderFootball(),
    "hockey": renderHockey(),
    "soccer": renderSoccer(),
    "baseball": renderBaseball(),
    "minimal": renderMinimal(),
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8"
      style={{ background: "radial-gradient(ellipse at center, #0a0a0a 0%, #000 80%)" }}>
      {hornFlash && (
        <div className="fixed inset-0 pointer-events-none animate-pulse" style={{ background: "rgba(255,200,0,0.15)" }} />
      )}
      {layoutMap[state.layout] || renderMinimal()}
    </div>
  );
}

function PlayerFoulCol({ title, players }: { title: string; players: any[] }) {
  return (
    <div>
      <div className="text-yellow-300 font-black text-center text-xl uppercase mb-2"
        style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>
        {title} • Player Fouls
      </div>
      <div className="grid grid-cols-5 gap-2">
        {players.length === 0 && <div className="col-span-5 text-zinc-600 text-xs text-center">No players logged</div>}
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
