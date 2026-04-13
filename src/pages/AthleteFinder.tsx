import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Users, School, Trophy, ArrowLeft, RefreshCw, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [scrapePassword, setScrapePassword] = useState("");
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
        dbQuery = dbQuery.or(
          `first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`
        );
      } else {
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

  const handleScrapeStart = () => {
    setShowPasswordDialog(true);
    setScrapePassword("");
  };

  const handleScrapeConfirm = async () => {
    setShowPasswordDialog(false);
    setScraping(true);
    setScrapeProgress("Starting scrape...");

    try {
      // Get school list
      const { data: listData } = await supabase.functions.invoke("scrape-athletes", {
        body: { action: "list-schools" },
      });
      const totalSchools = listData?.total || 115;
      let totalAthletes = 0;
      const ROSTER_BATCH_SIZE = 8;

      for (let i = 0; i < totalSchools; i++) {
        // Phase 1: Discover roster URLs
        setScrapeProgress(`[${i + 1}/${totalSchools}] Discovering rosters... (${totalAthletes} athletes so far)`);

        const { data: discoverData, error: discoverErr } = await supabase.functions.invoke("scrape-athletes", {
          body: { action: "discover", schoolIndex: i, password: scrapePassword },
        });

        if (discoverErr) throw discoverErr;
        if (discoverData?.error) throw new Error(discoverData.error);

        const rosterUrls: string[] = discoverData.rosterUrls || [];
        if (rosterUrls.length === 0) continue;

        // Phase 2: Scrape roster URLs in batches
        for (let j = 0; j < rosterUrls.length; j += ROSTER_BATCH_SIZE) {
          const batch = rosterUrls.slice(j, j + ROSTER_BATCH_SIZE);
          setScrapeProgress(
            `[${i + 1}/${totalSchools}] ${discoverData.school}: rosters ${j + 1}-${j + batch.length}/${rosterUrls.length} (${totalAthletes} athletes)`
          );

          const { data: scrapeData, error: scrapeErr } = await supabase.functions.invoke("scrape-athletes", {
            body: {
              action: "scrape-rosters",
              rosterUrls: batch,
              schoolName: discoverData.school,
              schoolUrl: discoverData.schoolUrl,
              password: scrapePassword,
            },
          });

          if (scrapeErr) throw scrapeErr;
          if (scrapeData?.error) throw new Error(scrapeData.error);
          totalAthletes += scrapeData.athletes || 0;
        }
      }

      setScrapeProgress(`Done! Scraped ${totalSchools} schools, found ${totalAthletes} athletes across 4 seasons.`);
      toast({ title: "Scraping Complete", description: `Found ${totalAthletes} athletes.` });
    } catch (err: any) {
      setScrapeProgress(`Error: ${err.message}`);
      toast({ title: "Scrape Error", description: err.message, variant: "destructive" });
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-montserrat">Athlete Finder</h1>
            <p className="text-sm text-muted-foreground">
              Search Delaware & Maryland high school and middle school sports rosters (last 4 years)
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
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Admin scrape trigger */}
        <div className="mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrapeStart}
            disabled={scraping}
            className="gap-2"
          >
            {scraping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {scraping ? "Scraping..." : "Scrape All Schools"}
          </Button>
          {scrapeProgress && (
            <p className="text-sm text-muted-foreground mt-2">{scrapeProgress}</p>
          )}
        </div>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try a different name or make sure the database has been populated.
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
                  <span className="text-muted-foreground text-sm">{r.season}</span>
                  {r.grade && (
                    <span className="text-sm">
                      Grade: <strong>{r.grade}</strong>
                    </span>
                  )}
                  {r.jersey_number && (
                    <span className="text-sm text-muted-foreground">#{r.jersey_number}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Scrape Password</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Password..."
            value={scrapePassword}
            onChange={(e) => setScrapePassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScrapeConfirm()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScrapeConfirm} disabled={!scrapePassword}>
              Start Scraping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AthleteFinder;
