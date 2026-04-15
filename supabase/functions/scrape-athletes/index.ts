import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// -------------------- FETCH --------------------
async function fetchWithTimeout(url: string, timeout = 10000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    clearTimeout(id);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

// -------------------- PARSE ROSTER --------------------
function parseRoster(html: string) {
  const players: any[] = [];

  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
      c[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim()
    );

    if (cells.length < 3) continue;

    const first = cells[1];
    const last = cells[2];

    if (!first || !last) continue;

    players.push({
      jersey: cells[0] || "",
      first,
      last,
      grade: cells[3] || "",
    });
  }

  return players;
}

// -------------------- SEASON DETECTION (NO RELIANCE ON SWITCH) --------------------
function detectSeason(html: string) {
  const seasons: Record<string, string> = {
    "2025": "24",
    "2024": "23",
    "2023": "22",
    "2022": "21",
  };

  const found: string[] = [];

  for (const year in seasons) {
    if (html.includes(year)) found.push(seasons[year]);
  }

  return found.length ? found : ["24"]; // fallback latest
}

// -------------------- MAIN SCRAPER --------------------
async function scrapeRoster(url: string, supabase: any) {
  const res = await fetchWithTimeout(url);
  if (!res) return 0;

  const html = await res.text();

  const players = parseRoster(html);

  if (!players.length) return 0;

  const seasons = detectSeason(html);

  const seen = new Set<string>();
  const rows: any[] = [];

  for (const season of seasons) {
    for (const p of players) {
      const key = `${season}-${p.first}-${p.last}-${p.jersey}`;

      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        first_name: p.first,
        last_name: p.last,
        jersey_number: p.jersey,
        grade: p.grade,
        season,
        source_url: url,
      });
    }
  }

  const { error } = await supabase.from("athletes").upsert(rows, {
    onConflict:
      "school_url,sport,level,season,first_name,last_name",
  });

  if (error) {
    console.log("DB error:", error.message);
  }

  return rows.length;
}

// -------------------- EDGE FUNCTION --------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { rosterUrl } = await req.json();

    if (!rosterUrl) {
      return new Response(JSON.stringify({ error: "Missing rosterUrl" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const total = await scrapeRoster(rosterUrl, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        totalInserted: total,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
