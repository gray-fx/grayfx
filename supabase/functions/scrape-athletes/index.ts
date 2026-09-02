import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (compatible; GrayFXAthleteFinder/1.0)";
const BASE = "https://www.websites4sports.com";

// School year IDs on websites4sports (value => label)
const SEASONS: Record<string, string> = {
  "2026": "2025/2026",
  "2025": "2024/2025",
  "2024": "2023/2024",
  "2023": "2022/2023",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decode(s: string) {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

async function get(url: string, cookie?: string, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: cookie
        ? { "User-Agent": UA, cookie }
        : { "User-Agent": UA },
    });
    if (!res.ok) return null;
    return { html: await res.text(), setCookie: res.headers.get("set-cookie") ?? "" };
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function cookiePairs(setCookie: string) {
  // crude but sufficient: grab "name=value" from each cookie chunk
  return setCookie
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0].trim())
    .filter((c) => c.includes("="));
}

// -------------------- SCHOOLS --------------------
async function listSchools() {
  const res = await get(`${BASE}/Schools`);
  if (!res) return [];
  const schools: { name: string; url: string }[] = [];
  const rows = res.html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const link = row.match(/href=['"](https?:\/\/[^'"]*)['"][^>]*rel="nofollow"/i);
    if (!link) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(c[1]));
    const name = cells.find((c) => c.length > 2) || link[1];
    schools.push({ name, url: link[1].replace(/\/$/, "") });
  }
  // de-dupe by url
  const seen = new Set<string>();
  return schools.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

// -------------------- SPORT + ROSTER DISCOVERY --------------------
const NON_SPORT =
  /athletic code|administration|trainer|title ix|emergency|admission|prohibited|signings|transfer policy|booster|forms|physical|calendar|contact|staff|directions|handbook|alumni|sponsor|hall of fame|news/i;

async function discoverRosters(schoolUrl: string) {
  const home = await get(schoolUrl);
  if (!home) return [];

  const sports: { name: string; url: string }[] = [];
  const seenPage = new Set<string>();
  for (const m of home.html.matchAll(/href="(\/page\d+)"[^>]*>([\s\S]{0,150}?)<\/a>/g)) {
    const label = decode(m[2]);
    if (!label || NON_SPORT.test(label)) continue;
    if (seenPage.has(m[1])) continue;
    seenPage.add(m[1]);
    sports.push({ name: label, url: schoolUrl + m[1] });
  }

  const rosters: { url: string; sport: string; level: string }[] = [];
  // fetch sport pages in small parallel batches to find roster sub-pages
  for (let i = 0; i < sports.length; i += 6) {
    const batch = sports.slice(i, i + 6);
    const pages = await Promise.all(batch.map((s) => get(s.url, undefined, 12000)));
    pages.forEach((p, idx) => {
      if (!p) return;
      const sport = batch[idx].name;
      for (const m of p.html.matchAll(/href="(\/page\d+)"[^>]*>([\s\S]{0,120}?)<\/a>/g)) {
        const label = decode(m[2]);
        if (!/^roster/i.test(label)) continue;
        rosters.push({
          url: schoolUrl + m[1],
          sport,
          level: levelFromLabel(label),
        });
      }
    });
  }

  const seen = new Set<string>();
  return rosters.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}

function levelFromLabel(label: string) {
  const l = label.toLowerCase();
  if (/\bjv\b|junior varsity/.test(l)) return "JV";
  if (/\bfr\b|freshman/.test(l)) return "Freshman";
  if (/8th/.test(l)) return "8th Grade";
  if (/7th/.test(l)) return "7th Grade";
  if (/\bms\b|middle/.test(l)) return "Middle School";
  return "Varsity";
}

// -------------------- ROSTER PARSING --------------------
function parseRoster(html: string) {
  const players: { jersey: string; first: string; last: string; grade: string }[] = [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    if (/<th[\s>]/i.test(row)) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(c[1]));
    if (cells.length < 3) continue;
    const [jersey, first, last] = cells;
    if (!first || !last) continue;
    if (/first name/i.test(first)) continue;
    players.push({
      jersey: /^\d{1,3}$/.test(jersey) ? jersey : "",
      first,
      last,
      grade: cells[4] || cells[3] || "",
    });
  }
  return players;
}

/** Sets the site session to a given school year and returns the cookie header to reuse. */
async function seasonCookie(sampleUrl: string, origin: string, yearId: string) {
  const first = await get(sampleUrl);
  if (!first) return null;
  const token = first.html.match(
    /__RequestVerificationToken"[^>]*value="([^"]+)"/,
  )?.[1];
  const jar = cookiePairs(first.setCookie);
  if (!token) return jar.join("; ");

  const body = new URLSearchParams({
    SchoolYearID: yearId,
    __RequestVerificationToken: token,
  });
  try {
    const res = await fetch(`${origin}/UserSettings/SchoolYearChange`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        cookie: jar.join("; "),
      },
      body,
    });
    const more = cookiePairs(res.headers.get("set-cookie") ?? "");
    const merged = new Map<string, string>();
    for (const c of [...jar, ...more]) {
      const i = c.indexOf("=");
      merged.set(c.slice(0, i), c.slice(i + 1));
    }
    return [...merged].map(([k, v]) => `${k}=${v}`).join("; ");
  } catch {
    return jar.join("; ");
  }
}

// -------------------- HANDLER --------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "list-schools";

    if (action === "list-schools") {
      const schools = await listSchools();
      return json({ total: schools.length, schools });
    }

    // everything below requires the scrape password
    const expected = Deno.env.get("SCRAPE_PASSWORD") ?? "grayfx2026";
    if ((body.password ?? "") !== expected) {
      return json({ error: "Invalid scrape password" }, 401);
    }

    if (action === "discover") {
      const schools = await listSchools();
      const idx = Number(body.schoolIndex ?? 0);
      const school = schools[idx];
      if (!school) return json({ error: "School index out of range" }, 400);
      const rosterUrls = await discoverRosters(school.url);
      return json({
        school: school.name,
        schoolUrl: school.url,
        rosterUrls,
      });
    }

    if (action === "scrape-rosters") {
      const rosters: { url: string; sport: string; level: string }[] =
        (body.rosterUrls ?? []).map((r: any) =>
          typeof r === "string" ? { url: r, sport: "Unknown", level: "Varsity" } : r
        );
      const schoolName: string = body.schoolName ?? "Unknown";
      const schoolUrl: string = body.schoolUrl ?? "";
      if (!rosters.length) return json({ athletes: 0 });

      const origin = new URL(rosters[0].url).origin;
      const rows: any[] = [];

      for (const [yearId, seasonLabel] of Object.entries(SEASONS)) {
        const cookie = await seasonCookie(rosters[0].url, origin, yearId);
        if (!cookie) continue;

        const pages = await Promise.all(
          rosters.map((r) => get(r.url, cookie, 12000)),
        );

        pages.forEach((p, i) => {
          if (!p) return;
          // guard: make sure the site actually switched to this season
          const active = p.html.match(/selected="selected" value="(\d+)"/)?.[1];
          if (active && active !== yearId) return;

          for (const pl of parseRoster(p.html)) {
            rows.push({
              school_name: schoolName,
              school_url: schoolUrl || origin,
              sport: rosters[i].sport,
              level: rosters[i].level,
              season: seasonLabel,
              first_name: pl.first,
              last_name: pl.last,
              grade: pl.grade || null,
              jersey_number: pl.jersey || null,
            });
          }
        });
      }

      // de-dupe against the unique constraint before upserting
      const seen = new Set<string>();
      const unique = rows.filter((r) => {
        const k = `${r.school_url}|${r.sport}|${r.level}|${r.season}|${r.first_name}|${r.last_name}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (unique.length) {
        const { error } = await supabase.from("athletes").upsert(unique, {
          onConflict: "school_url,sport,level,season,first_name,last_name",
        });
        if (error) return json({ error: error.message }, 500);
      }

      return json({ athletes: unique.length });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
