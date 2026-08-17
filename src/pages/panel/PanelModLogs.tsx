import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Plus } from "lucide-react";
import PanelLayout from "./PanelLayout";
import { callPanel } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type Case = {
  caseNumber?: number | string;
  id?: string;
  type?: string;
  moderatorTag?: string;
  moderator?: string;
  robloxUsername?: string;
  reason?: string;
  createdAt?: string;
  timestamp?: string;
};

const TYPES = ["warn", "kick", "ban"] as const;

const PanelModLogs = () => {
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTarget, setFilterTarget] = useState("");
  const [filterType, setFilterType] = useState("");

  const [type, setType] = useState<string>("warn");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [reason, setReason] = useState("");
  const [runInGame, setRunInGame] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callPanel<{ cases?: Case[] } | Case[]>("modlogs-list", {
        query: { robloxUsername: filterTarget || undefined, type: filterType || undefined, limit: "100" },
      });
      const list = Array.isArray(res) ? res : ((res as any)?.cases ?? []);
      const sorted = [...list].sort((a, b) => {
        const ad = new Date(a.createdAt || a.timestamp || 0).getTime();
        const bd = new Date(b.createdAt || b.timestamp || 0).getTime();
        return bd - ad;
      });
      setCases(sorted);
    } catch (e) {
      toast({ title: "Could not load mod logs", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterTarget, filterType, toast]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await callPanel("modlogs-create", {
        method: "POST",
        body: { type, robloxUsername, reason, runInGame },
      });
      toast({ title: "Case created" });
      setRobloxUsername(""); setReason(""); setRunInGame(false);
      await load();
    } catch (err) {
      toast({ title: "Could not create case", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelLayout title="Mod Logs">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> New case
          </h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-body"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Roblox username</Label>
              <Input value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="RobloxPlayer123" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox id="ingame" checked={runInGame} onCheckedChange={(v) => setRunInGame(Boolean(v))} />
              <Label htmlFor="ingame" className="font-body text-sm">Also run this in-game</Label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create case
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Roblox username</Label>
              <Input value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)} placeholder="Filter by username" className="w-48" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm font-body"
              >
                <option value="">All</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Apply
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 pr-4">Case</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Moderator</th>
                  <th className="py-2 pr-4">Roblox player</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cases.map((c, i) => (
                  <tr key={c.id ?? `${c.caseNumber}-${i}`}>
                    <td className="py-2 pr-4">#{c.caseNumber ?? "—"}</td>
                    <td className="py-2 pr-4 uppercase text-primary">{c.type}</td>
                    <td className="py-2 pr-4">{c.moderatorTag || c.moderator || "—"}</td>
                    <td className="py-2 pr-4">{c.robloxUsername || "—"}</td>
                    <td className="py-2 pr-4 max-w-xs truncate">{c.reason}</td>
                    <td className="py-2 text-muted-foreground">
                      {c.createdAt || c.timestamp ? new Date(c.createdAt || c.timestamp!).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {!loading && cases.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No cases found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PanelLayout>
  );
};

export default PanelModLogs;
