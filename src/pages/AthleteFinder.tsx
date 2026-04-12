import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Users, School, Trophy, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AthleteRecord {
  id: string;
  school_name: string;
  sport: string;
  level: string;
  season: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  jersey_number: string | null;
}

const AthleteFinder = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AthleteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState("");
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
        // Single word: search first or last name
        dbQuery = dbQuery.or(
          `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`
        );
      } else {
        // Multi word: search first + last name combo
        dbQuery = dbQuery
          .ilike("first_name", `%${parts[0]}%`)
          .ilike("last_name", `%${parts.slice(1).join(" ")}%`);
      }

      const { data, error } = await dbQuery
        .order("last_name")
        .order("first_name")
        .order("season", { ascending: false })
        .limit(500);

      if (error) throw error;
      setResults((data as AthleteRecord[]) || []);
    } catch (err: any) {
      toast({
        title: "Search Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeProgress("Starting scrape...");

    try {
      let nextIndex: number | null = 0;
      let totalProcessed = 0;
      let totalAthletes = 0;

      while (nextIndex !== null) {
        setScrapeProgress(
          `Scraping schools ${nextIndex + 1}-${nextIndex + 3}... (${totalAthletes} athletes found so far)`
        );

        const { data, error } = await supabase.functions.invoke(
          "scrape-athletes",
          {
            body: {
              action: "scrape-batch",
              schoolIndex: nextIndex,
              batchSize: 3,
            },
          }
        );

        if (error) throw error;

        nextIndex = data.nextIndex;
        totalProcessed = data.processed;
        for (const r of data.results) {
          totalAthletes += r.athletes;
        }
      }

      setScrapeProgress(`Done! Scraped ${totalProcessed} schools, found ${totalAthletes} athletes.`);
      toast({
        title: "Scraping Complete",
        description: `Found ${totalAthletes} athletes across ${totalProcessed} schools.`,
      });
    } catch (err: any) {
      setScrapeProgress(`Error: ${err.message}`);
      toast({
        title: "Scrape Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  // Group results by athlete name
  const grouped = results.reduce<Record<string, AthleteRecord[]>>((acc, r) => {
    const key = `${r.first_name} ${r.last_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-montserrat">
              Athlete Finder
            </h1>
            <p className="text-sm text-muted-foreground">
              Search Delaware & Maryland high school and middle school sports
              rosters
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Bar */}
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
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="h-12 px-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Admin scrape trigger */}
        <div className="mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrape}
            disabled={scraping}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Scraping..." : "Scrape All Schools"}
          </Button>
          {scrapeProgress && (
            <p className="text-sm text-muted-foreground mt-2">
              {scrapeProgress}
            </p>
          )}
        </div>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try a different name or make sure the database has been populated
              by scraping schools first.
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([name, records]) => (
          <Card key={name} className="mb-6 bg-card border-border overflow-hidden">
            <div className="bg-secondary px-5 py-3 border-b border-border">
              <h2 className="text-lg font-bold font-montserrat flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Found in {records.length} roster{records.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="divide-y divide-border">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <School className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{r.school_name}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Trophy className="h-4 w-4 text-accent shrink-0" />
                    <span>{r.sport}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-sm font-medium">
                    {r.level}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {r.season}
                  </span>
                  {r.grade && (
                    <span className="text-sm">
                      Grade: <strong>{r.grade}</strong>
                    </span>
                  )}
                  {r.jersey_number && (
                    <span className="text-sm text-muted-foreground">
                      #{r.jersey_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AthleteFinder;
