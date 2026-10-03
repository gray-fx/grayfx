import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Users, School, Trophy, ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AthleteRecord {
  id: string;
  school_name: string;
  school_url: string;
  sport: string;
  level: string;
  season: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  jersey_number: string | null;
  position: string | null;
  extra: Record<string, string> | null;
}

const JERSEY_KEY = /jersey|uniform|(^|\s)(#|no|num|number)(\s|$)/i;

/** Jersey number for one roster entry: the real column, else any jersey-like key in extra. */
const jerseyOf = (r: AthleteRecord) => {
  if (r.jersey_number && /^\d{1,3}$/.test(r.jersey_number)) return r.jersey_number;
  for (const [k, v] of Object.entries(r.extra ?? {})) {
    if (JERSEY_KEY.test(k) && /^\d{1,3}$/.test(String(v).trim())) return String(v).trim();
  }
  return "";
};

const LEVEL_ORDER = ["Varsity", "JV", "Freshman", "Middle School", "8th Grade", "7th Grade"];

const levelClass = (level: string) =>
  level === "Varsity"
    ? "bg-primary/20 text-primary"
    : level === "JV"
      ? "bg-accent/20 text-accent"
      : "bg-muted text-muted-foreground";

/** Sports x seasons matrix for one athlete. */
const AthleteTimeline = ({ name, records }: { name: string; records: AthleteRecord[] }) => {
  const seasons = useMemo(
    () => [...new Set(records.map((r) => r.season))].sort(),
    [records],
  );
  const sports = useMemo(
    () => [...new Set(records.map((r) => r.sport))].sort(),
    [records],
  );

  const bySeason = (season: string) => records.filter((r) => r.season === season);
  const schoolsFor = (season: string) => [...new Set(bySeason(season).map((r) => r.school_name))];
  const gradeFor = (season: string) => bySeason(season).find((r) => r.grade)?.grade ?? "—";
  const cell = (sport: string, season: string) =>
    bySeason(season)
      .filter((r) => r.sport === sport)
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

  // any extra info (height, weight, hometown...) per season
  const extras = (season: string) => {
    const merged: Record<string, string> = {};
    bySeason(season).forEach((r) => Object.assign(merged, r.extra ?? {}));
    // jersey numbers are per sport, so they're shown next to level, not here
    return Object.entries(merged).filter(([k]) => !JERSEY_KEY.test(k));
  };
  const hasExtras = seasons.some((s) => extras(s).length > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 w-32 text-muted-foreground font-medium"> </th>
            {seasons.map((s) => (
              <th key={s} className="text-left p-2 font-semibold">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="p-2 text-muted-foreground">School</td>
            {seasons.map((s) => (
              <td key={s} className="p-2">
                {schoolsFor(s).map((sc) => (
                  <div key={sc} className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-primary shrink-0" />
                    {sc}
                  </div>
                ))}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <td className="p-2 text-muted-foreground">Grade</td>
            {seasons.map((s) => (
              <td key={s} className="p-2 font-medium">{gradeFor(s)}</td>
            ))}
          </tr>
          {sports.map((sport) => (
            <tr key={sport} className="border-b border-border">
              <td className="p-2 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
                  {sport}
                </span>
              </td>
              {seasons.map((s) => {
                const items = cell(sport, s);
                return (
                  <td key={s} className="p-2 align-top">
                    {items.length === 0 ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : (
                      items.map((r) => (
                        <div key={r.id} className="mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelClass(r.level)}`}>
                            {r.level}
                          </span>
                          {(jerseyOf(r) || r.position) && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {jerseyOf(r) && `#${jerseyOf(r)}`}
                              {jerseyOf(r) && r.position && " · "}
                              {r.position}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {hasExtras && (
            <tr>
              <td className="p-2 text-muted-foreground align-top">Other info</td>
              {seasons.map((s) => (
                <td key={s} className="p-2 align-top text-xs text-muted-foreground">
                  {extras(s).map(([k, v]) => (
                    <div key={k}>
                      <span className="capitalize">{k}</span>: {v}
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3">
        Showing {records.length} roster entr{records.length === 1 ? "y" : "ies"} for {name}.
      </p>
    </div>
  );
};

const AthleteFinder = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AthleteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    try {
      const parts = trimmed.split(/\s+/);
      let dbQuery = supabase.from("athletes").select("*");
      if (parts.length === 1) {
        dbQuery = dbQuery.or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`);
      } else {
        dbQuery = dbQuery
          .ilike("first_name", `%${parts[0]}%`)
          .ilike("last_name", `%${parts.slice(1).join(" ")}%`);
      }
      const { data, error } = await dbQuery
        .order("last_name")
        .order("first_name")
        .order("season", { ascending: false })
        .limit(1000);
      if (error) throw error;
      setResults((data as AthleteRecord[]) || []);
    } catch (err: any) {
      toast({ title: "Search Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  // One card per person: same name + school, merging a name across schools only
  // when the seasons don't overlap (a transfer). Overlapping seasons = different people.
  const grouped = useMemo(() => {
    const byKey: Record<string, AthleteRecord[]> = {};
    results.forEach((r) => {
      (byKey[`${r.first_name} ${r.last_name}|${r.school_url}`] ||= []).push(r);
    });
    const clusters: { name: string; records: AthleteRecord[]; seasons: Set<string> }[] = [];
    Object.entries(byKey).forEach(([key, recs]) => {
      const name = key.split("|")[0];
      const seasons = new Set(recs.map((r) => r.season));
      const target = clusters.find(
        (c) => c.name === name && ![...seasons].some((x) => c.seasons.has(x)),
      );
      if (target) {
        target.records.push(...recs);
        seasons.forEach((x) => target.seasons.add(x));
      } else {
        clusters.push({ name, records: recs, seasons });
      }
    });
    return clusters;
  }, [results]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-montserrat">Athlete Finder</h1>
            <p className="text-sm text-muted-foreground">
              Search Delaware & Maryland high school and middle school sports rosters
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search athlete name (e.g. John Smith)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-12 text-lg bg-card border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()} className="h-12 px-6">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
          </Button>
        </div>

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try a different name or make sure the database has been populated.
            </p>
          </div>
        )}

        {grouped.map(({ name, records }, idx) => {
          const schools = [...new Set(records.map((r) => r.school_name))];
          const sports = [...new Set(records.map((r) => r.sport))];
          return (
            <Card
              key={`${name}-${idx}`}
              onClick={() => setSelected(idx)}
              className="mb-4 bg-card border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
            >
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold font-montserrat flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {schools.join(", ")} · {sports.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {records.length} roster{records.length > 1 ? "s" : ""} · tap for 4-year chart
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-montserrat">
              {selected !== null && grouped[selected]?.name}
            </DialogTitle>
          </DialogHeader>
          {selected !== null && grouped[selected] && (
            <AthleteTimeline name={grouped[selected].name} records={grouped[selected].records} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AthleteFinder;
