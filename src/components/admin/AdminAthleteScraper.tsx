import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RefreshCw, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ROSTER_BATCH_SIZE = 8;

interface RosterRef {
  url: string;
  sport: string;
  level: string;
}

/** Drop this inside AdminPanel.tsx, e.g. <ScrapeAthletesPanel /> */
const ScrapeAthletesPanel = () => {
  const [yearsBack, setYearsBack] = useState(4);
  const [password, setPassword] = useState("");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState("");
  const [report, setReport] = useState<
    Record<string, { saved: number; skipped: Record<string, number> }>
  >({});
  const { toast } = useToast();

  const run = async () => {
    const years = Math.min(Math.max(Math.floor(yearsBack) || 1, 1), 12);
    if (
      !window.confirm(
        `Scrape every school for the last ${years} school year${years > 1 ? "s" : ""}? This can take a long time.`,
      )
    )
      return;

    setScraping(true);
    setProgress("Starting scrape...");
    setReport({});
    const agg: Record<string, { saved: number; skipped: Record<string, number> }> = {};
    try {
      const { data: listData } = await supabase.functions.invoke("scrape-athletes", {
        body: { action: "list-schools" },
      });
      const totalSchools: number = listData?.total || 0;
      if (!totalSchools) throw new Error("Could not load school list");

      let totalAthletes = 0;

      for (let i = 0; i < totalSchools; i++) {
        setProgress(`[${i + 1}/${totalSchools}] Discovering rosters... (${totalAthletes} athletes so far)`);
        const { data: d, error: dErr } = await supabase.functions.invoke("scrape-athletes", {
          body: { action: "discover", schoolIndex: i, password },
        });
        if (dErr) throw dErr;
        if (d?.error) throw new Error(d.error);

        const rosterUrls: RosterRef[] = d.rosterUrls || [];
        for (let j = 0; j < rosterUrls.length; j += ROSTER_BATCH_SIZE) {
          const batch = rosterUrls.slice(j, j + ROSTER_BATCH_SIZE);
          setProgress(
            `[${i + 1}/${totalSchools}] ${d.school}: rosters ${j + 1}-${j + batch.length}/${rosterUrls.length} (${totalAthletes} athletes)`,
          );
          const { data: s, error: sErr } = await supabase.functions.invoke("scrape-athletes", {
            body: {
              action: "scrape-rosters",
              rosterUrls: batch,
              schoolName: d.school,
              schoolUrl: d.schoolUrl,
              yearsBack: years,
              password,
            },
          });
          if (sErr) throw sErr;
          if (s?.error) throw new Error(s.error);
          totalAthletes += s.athletes || 0;
          for (const [season, e] of Object.entries(s.log || {}) as [string, any][]) {
            const a = (agg[season] ||= { saved: 0, skipped: {} });
            a.saved += e.saved || 0;
            for (const msg of e.skipped || []) {
              // group by reason, ignoring the sport/level after the colon
              const reason = String(msg).split(":")[0];
              a.skipped[reason] = (a.skipped[reason] || 0) + 1;
            }
          }
          setReport({ ...agg });
        }
      }

      setProgress(`Done! ${totalSchools} schools, ${totalAthletes} athlete records across ${years} season(s).`);
      toast({ title: "Scraping complete", description: `${totalAthletes} athlete records saved.` });
    } catch (err: any) {
      setProgress(`Error: ${err.message}`);
      toast({ title: "Scrape error", description: err.message, variant: "destructive" });
    } finally {
      setScraping(false);
    }
  };

  return (
    <Card className="p-5 bg-card border-border space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Athlete Roster Scraper</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Pulls rosters from websites4sports. Run manually and infrequently (e.g. once per season).
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="yearsBack">Years back</Label>
          <Input
            id="yearsBack"
            type="number"
            min={1}
            max={12}
            value={yearsBack}
            onChange={(e) => setYearsBack(Number(e.target.value))}
            className="w-28"
            disabled={scraping}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="scrapePw">Scrape password</Label>
          <Input
            id="scrapePw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-56"
            disabled={scraping}
          />
        </div>
        <Button onClick={run} disabled={scraping || !password} className="gap-2">
          {scraping && <RefreshCw className="h-4 w-4 animate-spin" />}
          {scraping ? "Scraping..." : "Run scrape"}
        </Button>
      </div>

      {progress && <p className="text-sm text-muted-foreground">{progress}</p>}

      {Object.keys(report).length > 0 && (
        <div className="text-sm space-y-1">
          <p className="font-medium">Per-season results</p>
          {Object.entries(report)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([season, r]) => (
              <p key={season} className="text-muted-foreground">
                <strong className="text-foreground">{season}</strong>: {r.saved} saved
                {Object.entries(r.skipped).map(([reason, n]) => (
                  <span key={reason}> · {n}× {reason}</span>
                ))}
              </p>
            ))}
        </div>
      )}
    </Card>
  );
};

export default ScrapeAthletesPanel;
