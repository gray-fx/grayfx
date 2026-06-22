import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy, ExternalLink, Plus, Trash2, Tv, Smartphone } from "lucide-react";
import { createGame, deleteGame, listRecentGames, type GameRow, type GameKind } from "@/lib/game-sync";
import { getDefaultState } from "@/hooks/use-scoreboard";
import { defaultState as das5000Default } from "@/hooks/use-das5000";
import { toast } from "sonner";

const origin = () => window.location.origin + window.location.pathname.replace(/\/$/, "");

const linksFor = (code: string, kind: GameKind) => {
  const base = origin() + "/#";
  if (kind === "classic") {
    return {
      control: `${base}/g/${code}/control`,
      display: `${base}/g/${code}`,
      obs: `${base}/g/${code}?bg=transparent`,
    };
  }
  return {
    control: `${base}/d/${code}/control`,
    display: `${base}/d/${code}`,
    obs: `${base}/d/${code}?bg=transparent`,
  };
};

const copy = (s: string) => {
  navigator.clipboard.writeText(s).then(() => toast.success("Copied"));
};

export default function GamesLobby() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GameKind>("classic");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setGames(await listRecentGames()); } catch (e: any) { toast.error(e?.message || "Load failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      const initial = kind === "classic" ? getDefaultState() : das5000Default();
      const row = await createGame({
        kind,
        name: name.trim() || (kind === "classic" ? "Scoreboard" : "DAS5000"),
        pin: pin.trim(),
        state: initial,
      });
      setName(""); setPin("");
      await refresh();
      toast.success(`Game ${row.code} created`);
    } catch (e: any) {
      toast.error(e?.message || "Could not create");
    } finally { setBusy(false); }
  };

  const remove = async (g: GameRow) => {
    if (!confirm(`Delete game ${g.code}? This can't be undone.`)) return;
    try { await deleteGame(g.id); await refresh(); } catch (e: any) { toast.error(e?.message || "Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
        <h1 className="text-2xl font-display font-bold">Live Games</h1>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Create a new game</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday vs. Glasgow" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as GameKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic scoreboard</SelectItem>
                <SelectItem value="das5000">DAS5000 (Daktronics-style)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PIN (optional)</Label>
            <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Controller PIN" />
          </div>
          <div className="md:col-span-4">
            <Button onClick={create} disabled={busy} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-1" /> {busy ? "Creating…" : "Create game"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <div className="text-muted-foreground">Loading…</div>}
        {!loading && games.length === 0 && (
          <div className="text-muted-foreground text-center py-12">No games yet. Create one above.</div>
        )}
        {games.map((g) => {
          const L = linksFor(g.code, g.kind);
          return (
            <Card key={g.id}>
              <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_auto] items-center">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-2xl font-bold tracking-widest">{g.code}</span>
                    <span className="text-sm px-2 py-0.5 rounded bg-muted">{g.kind === "classic" ? "Classic" : "DAS5000"}</span>
                    {g.pin && <span className="text-xs px-2 py-0.5 rounded bg-muted">PIN set</span>}
                    <span className="text-sm text-muted-foreground">· {g.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(g.updated_at).toLocaleString()}
                  </div>
                  <div className="grid gap-2 mt-3 sm:grid-cols-3">
                    <LinkRow icon={<Smartphone className="h-4 w-4" />} label="Controller (phone)" url={L.control} />
                    <LinkRow icon={<Tv className="h-4 w-4" />} label="Display" url={L.display} />
                    <LinkRow icon={<ExternalLink className="h-4 w-4" />} label="OBS overlay" url={L.obs} />
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  <Link to={g.kind === "classic" ? `/g/${g.code}/control` : `/d/${g.code}/control`}>
                    <Button size="sm" className="w-full">Open controller</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => remove(g)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LinkRow({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <div className="flex items-center gap-1 border rounded px-2 py-1 bg-muted/30 min-w-0">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="text-xs truncate">{url}</div>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(url)}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}
