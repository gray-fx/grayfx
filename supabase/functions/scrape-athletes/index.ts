import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEASON_VALUES = ["24", "23", "22", "21"];
const SEASON_LABELS: Record<string, string> = {
  "24": "2025/2026",
  "23": "2024/2025",
  "22": "2023/2024",
  "21": "2022/2023",
};

function safeJson(req: Request) {
  return req.json().catch(() => ({}));
}

async function fetchWithTimeout(url: string, timeout = 8000, init?: RequestInit) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return resp.ok ? resp : null;
  } catch (e) {
    console.log("Fetch failed:", url);
    return null;
  }
}

function extractFormFields(html: string) {
  const fields: Record<string, string> = {};
  const regex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html))) {
    const name = m[0].match(/name=["']([^"']+)["']/)?.[1];
    const value = m[0].match(/value=["']([^"']*?)["']/)?.[1] || "";
    if (name) fields[name] = value;
  }
  return fields;
}

function extractCookies(resp: Response) {
  const cookies: string[] = [];
  resp.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") {
      cookies.push(v.split(";")[0]);
    }
  });
  return cookies.join("; ");
}

function parseRoster(html: string) {
  const players: any[] = [];
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (c) =>
        c[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, "")
          .trim()
    );

    if (cells.length >= 3) {
      players.push({
        jersey: cells[0],
        first: cells[1],
        last: cells[2],
        grade: cells[3] || "",
      });
    }
  }

  return players;
}

async function scrapeRoster(url: string, supabase: any) {
  let total = 0;

  for (const seasonVal of SEASON_VALUES) {
    try {
      const init = await fetchWithTimeout(url);
      if (!init) continue;

      const html = await init.text();
      const cookies = extractCookies(init);

      const fields = extractFormFields(html);
      const form = new URLSearchParams();

      Object.entries(fields).forEach(([k, v]) => form.append(k, v));

      // 🔥 FIX
      form.set("__EVENTTARGET", "ctl00$MainContent$ctl01$Seasonswitcher1$ddlSchoolYear");
      form.set("__EVENTARGUMENT", "");
      form.set("ctl00$MainContent$ctl01$Seasonswitcher1$ddlSchoolYear", seasonVal);

      const res = await fetchWithTimeout(url, 10000, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          "Referer": url,
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: form.toString(),
      });

      if (!res) continue;

      const newHtml = await res.text();

      const check = newHtml.match(/selected[^>]+value=["'](\d+)["']/i);
      if (!check || check[1] !== seasonVal) {
        console.log("Season failed:", seasonVal);
        continue;
      }

      const players = parseRoster(newHtml);
      if (!players.length) continue;

      const season = SEASON_LABELS[seasonVal];

      const { error } = await supabase.from("athletes").insert(
        players.map((p) => ({
          first_name: p.first,
          last_name: p.last,
          jersey_number: p.jersey,
          grade: p.grade,
          season,
        }))
      );

      if (!error) total += players.length;
    } catch (e) {
      console.log("Season error:", e);
    }
  }

  return total;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const envUrl = Deno.env.get("SUPABASE_URL");
    const envKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!envUrl || !envKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(envUrl, envKey);

    const body = await safeJson(req);
    const { rosterUrl } = body;

    if (!rosterUrl) {
      return new Response(JSON.stringify({ error: "Missing rosterUrl" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("Scraping:", rosterUrl);

    const total = await scrapeRoster(rosterUrl, supabase);

    return new Response(JSON.stringify({ success: true, total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("FATAL:", e);

    return new Response(
      JSON.stringify({
        error: "Edge function crashed",
        details: e.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
