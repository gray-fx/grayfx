import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// -------------------- FETCH --------------------
async function fetchWithTimeout(url: string, init?: RequestInit, timeout = 10000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(id);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

// -------------------- VIEWSTATE --------------------
function extractHiddenFields(html: string) {
  const fields: Record<string, string> = {};

  const regex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const name = match[0].match(/name=["']([^"']+)["']/)?.[1];
    const value = match[0].match(/value=["']([^"']*?)["']/)?.[1] || "";
    if (name) fields[name] = value;
  }

  return fields;
}

// -------------------- ROSTER PARSER --------------------
function parseRoster(html: string) {
  const players: any[] = [];

  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c =>
      c[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, "")
        .trim()
    );

    if (cells.length >= 3) {
      players.push({
        jersey: cells[0] || "",
        first: cells[1] || "",
        last: cells[2] || "",
        grade: cells[3] || "",
      });
    }
  }

  return players;
}

// -------------------- COOKIE HANDLING --------------------
function extractCookies(resp: Response) {
  const cookies: string[] = [];

  resp.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") {
      cookies.push(v.split(";")[0]);
    }
  });

  return cookies.join("; ");
}

// -------------------- SEASON SWITCH (CRITICAL FIX) --------------------
async function switchSeason(
  url: string,
  html: string,
  cookies: string,
  seasonVal: string
) {
  const fields = extractHiddenFields(html);

  const seasonField =
    Object.keys(fields).find(k =>
      k.toLowerCase().includes("schoolyear") ||
      k.toLowerCase().includes("season")
    ) || "";

  if (!seasonField) return null;

  const form = new URLSearchParams();

  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  // 🔥 IMPORTANT WebForms trigger
  form.set("__EVENTTARGET", seasonField);
  form.set("__EVENTARGUMENT", "");
  form.set(seasonField, seasonVal);

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies,
      "User-Agent": "Mozilla/5.0",
      "Referer": url,
    },
    body: form.toString(),
  });

  if (!res) return null;

  return await res.text();
}

// -------------------- MAIN SCRAPER --------------------
async function scrapeRoster(url: string, supabase: any) {
  let total = 0;

  // 1. initial page load
  const init = await fetchWithTimeout(url);
  if (!init) return 0;

  let html = await init.text();
  const cookies = extractCookies(init);

  const seasons = ["24", "23", "22", "21"];

  for (const season of seasons) {
    console.log("Switching season:", season);

    const newHtml = await switchSeason(url, html, cookies, season);

    if (!newHtml) {
      console.log("❌ Season switch failed:", season);
      continue;
    }

    html = newHtml;

    const players = parseRoster(html);

    if (!players.length) {
      console.log("⚠️ No players found for:", season);
      continue;
    }

    const { error } = await supabase.from("athletes").insert(
      players.map(p => ({
        first_name: p.first,
        last_name: p.last,
        jersey_number: p.jersey,
        grade: p.grade,
        season,
        source_url: url,
      }))
    );

    if (!error) {
      total += players.length;
      console.log(`✅ ${season}: ${players.length}`);
    } else {
      console.log("DB error:", error.message);
    }
  }

  return total;
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

    const body = await req.json().catch(() => ({}));
    const { rosterUrl } = body;

    if (!rosterUrl) {
      return new Response(
        JSON.stringify({ error: "Missing rosterUrl" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Scraping:", rosterUrl);

    const total = await scrapeRoster(rosterUrl, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        totalAthletes: total,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("FATAL ERROR:", e);

    return new Response(
      JSON.stringify({
        error: "Edge function crashed",
        details: e.message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
