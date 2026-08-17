import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, Square, RefreshCw } from "lucide-react";
import PanelLayout from "./PanelLayout";
import { callPanel } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SessionStatus = {
  active?: boolean;
  startedBy?: string | null;
  startedByTag?: string | null;
  startedAt?: string | null;
};

type ModStat = { moderator?: string; moderatorTag?: string; count?: number };

const PanelDashboard = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [stats, setStats] = useState<ModStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.allSettled([
        callPanel<SessionStatus>("session-status"),
        callPanel<{ stats?: ModStat[] } | ModStat[]>("modlogs-stats"),
      ]);
      if (s.status === "fulfilled") setStatus(s.value);
      else toast({ title: "Session status failed", description: s.reason.message, variant: "destructive" });

      if (st.status === "fulfilled") {
        const v = st.value as any;
        setStats(Array.isArray(v) ? v : (v?.stats ?? []));
      } else {
        toast({ title: "Stats failed", description: st.reason.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: "session-start" | "session-end") => {
    setActing(true);
    try {
      await callPanel(fn, { method: "POST" });
      toast({ title: fn === "session-start" ? "Session started" : "Session ended" });
      await load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const active = Boolean(status?.active);

  return (
    <PanelLayout title="Dashboard">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold">Session status</h2>
              {loading ? (
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
                        Started by: {status?.startedByTag || status?.startedBy || "unknown"}
                      </p>
                      <p className="text-muted-foreground">
                        Start time: {status?.startedAt ? new Date(status.startedAt).toLocaleString() : "unknown"}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => act("session-start")} disabled={acting || loading || active}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Start Session
            </Button>
            <Button variant="secondary" onClick={() => act("session-end")} disabled={acting || loading || !active}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              End Session
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Cases per moderator</h2>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-3" />
          ) : stats.length === 0 ? (
            <p className="mt-3 font-body text-sm text-muted-foreground">No case data yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {stats.map((s, i) => (
                <li key={`${s.moderator}-${i}`} className="flex items-center justify-between py-2 font-body text-sm">
                  <span>{s.moderatorTag || s.moderator || "Unknown"}</span>
                  <span className="font-display font-semibold">{s.count ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default PanelDashboard;
