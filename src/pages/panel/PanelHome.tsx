import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, Square, RefreshCw, Search, Plus, Terminal } from "lucide-react";
import PanelLayout from "./PanelLayout";
import { callPanel } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type SessionInfo = {
  active?: boolean;
  startedAt?: number | string | null;
  startedBy?: string | null;
};

type SessionStatusResponse = {
  session?: SessionInfo;
  summary?: string;
};

type ModStat = { moderatorId?: string; moderatorTag?: string; total?: number };

type Case = {
  id?: number | string;
  type?: string;
  moderatorTag?: string;
  robloxUsername?: string;
  reason?: string;
  timestamp?: number | string;
};

const TYPES = ["warn", "kick", "ban", "timeout"] as const;

const PanelHome = () => {
  const { toast } = useToast();

  // Session state
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Mod stats
  const [stats, setStats] = useState<ModStat[]>([]);

  // Mod logs
  const [cases, setCases] = useState<Case[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filterUsername, setFilterUsername] = useState("");
  const [filterType, setFilterType] = useState("");

  // New case form
  const [type, setType] = useState<string>("warn");
  const [robloxUsername, setRobloxUsername] = useState("");
  const [reason, setReason] = useState("");
  const [runInGame, setRunInGame] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Run command
  const [command, setCommand] = useState("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResponse, setCommandResponse] = useState("");

  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const res = await callPanel<SessionStatusResponse>("session-status");
      setSession(res?.session ?? null);
    } catch (e) {
      toast({ title: "Session status failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSessionLoading(false);
    }
  }, [toast]);

  const loadStats = useCallback(async () => {
    try {
      const res = await callPanel<{ stats?: ModStat[] } | ModStat[]>("modlogs-stats");
      const v = res as any;
      setStats(Array.isArray(v) ? v : (v?.stats ?? []));
    } catch (e) {
      toast({ title: "Stats failed", description: (e as Error).message, variant: "destructive" });
    }
  }, [toast]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await callPanel<{ cases?: Case[] } | Case[]>("modlogs-list", {
        query: { robloxUsername: filterUsername || undefined, type: filterType || undefined, limit: "100" },
      });
      const list = Array.isArray(res) ? res : ((res as any)?.cases ?? []);
      const sorted = [...list].sort((a, b) => {
        const ad = new Date(a.timestamp ?? 0).getTime();
        const bd = new Date(b.timestamp ?? 0).getTime();
        return bd - ad;
      });
      setCases(sorted);
    } catch (e) {
      toast({ title: "Could not load mod logs", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLogsLoading(false);
    }
  }, [filterUsername, filterType, toast]);

  useEffect(() => {
    loadSession();
    loadStats();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (fn: "session-start" | "session-end") => {
    setActing(true);
    try {
      await callPanel(fn, { method: "POST" });
      toast({ title: fn === "session-start" ? "Session started" : "Session ended" });
      await loadSession();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await callPanel("modlogs-create", {
        method: "POST",
        body: { type, robloxUsername, reason, runInGame },
      });
      toast({ title: "Case created" });
      setRobloxUsername(""); setReason(""); setRunInGame(false);
      await Promise.all([loadLogs(), loadStats()]);
    } catch (err) {
      toast({ title: "Could not create case", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const runCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommandLoading(true);
    setCommandResponse("");
    try {
      const res = await callPanel("run-command", { method: "POST", body: { command } });
      setCommandResponse(JSON.stringify(res, null, 2));
      toast({ title: "Command sent" });
    } catch (err) {
      setCommandResponse(JSON.stringify({ error: (err as Error).message }, null, 2));
      toast({ title: "Command failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setCommandLoading(false);
    }
  };

  const active = Boolean(session?.active);

  return (
    <PanelLayout title="Moderator Panel">
      <div className="space-y-6">
        {/* Session control */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold">Session status</h2>
              {sessionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-3" />
              ) : (
                <div className="mt-3 space-y-1 font-body text-sm">
                  <p className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-muted-foreground"}`} />
                    {active ? "Active" : "Inactive"}
                  </p>
                  {active && (
                    <>
                      <p className="text-muted-foreground">
                        Started by: {session?.startedBy ? `<@${session.startedBy}>` : "unknown"}
                      </p>
                      <p className="text-muted-foreground">
                        Start time: {session?.startedAt ? new Date(session.startedAt).toLocaleString() : "unknown"}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={loadSession} disabled={sessionLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => act("session-start")} disabled={acting || sessionLoading || active}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Start Session
            </Button>
            <Button variant="secondary" onClick={() => act("session-end")} disabled={acting || sessionLoading || !active}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              End Session
            </Button>
          </div>
        </section>

        {/* Mod stats */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Cases per moderator</h2>
          {stats.length === 0 ? (
            <p className="mt-3 font-body text-sm text-muted-foreground">No case data yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {stats.map((s, i) => (
                <li key={`${s.moderatorId}-${i}`} className="flex items-center justify-between py-2 font-body text-sm">
                  <span>{s.moderatorTag || s.moderatorId || "Unknown"}</span>
                  <span className="font-display font-semibold">{s.total ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* New case */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> New case
          </h2>
          <form onSubmit={submitCase} className="grid gap-4 sm:grid-cols-2">
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

        {/* Mod logs */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-semibold">Mod logs</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Roblox username</Label>
              <Input value={filterUsername} onChange={(e) => setFilterUsername(e.target.value)} placeholder="Filter by username" className="w-48" />
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
            <Button variant="secondary" onClick={loadLogs} disabled={logsLoading}>
              {logsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
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
                  <tr key={c.id ?? i}>
                    <td className="py-2 pr-4">#{c.id ?? "—"}</td>
                    <td className="py-2 pr-4 uppercase text-primary">{c.type}</td>
                    <td className="py-2 pr-4">{c.moderatorTag || "—"}</td>
                    <td className="py-2 pr-4">{c.robloxUsername || "—"}</td>
                    <td className="py-2 pr-4 max-w-xs truncate">{c.reason}</td>
                    <td className="py-2 text-muted-foreground">
                      {c.timestamp ? new Date(c.timestamp).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {!logsLoading && cases.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No cases found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Run command */}
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" /> Raw in-game command
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Commands run against the live server. Double-check before sending.
          </p>
          <form onSubmit={runCommand} className="flex gap-3">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder=":pm Player Hello"
              required
              className="font-mono"
            />
            <Button type="submit" disabled={commandLoading || !command.trim()}>
              {commandLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send
            </Button>
          </form>
          {commandResponse && (
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs font-mono text-foreground">
              {commandResponse}
            </pre>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default PanelHome;
