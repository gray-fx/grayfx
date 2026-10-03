import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (compatible; GrayFXAthleteFinder/1.0)";
const BASE = "https://www.websites4sports.com";

/**
 * Build the list of school years to scrape.
 * websites4sports year IDs are the ENDING year (2026 => 2025/2026).
 * A school year starts in ~July, so from July onward the "current" year is next year's ID.
 * Seasons the site doesn't have yet are skipped by the "active year" guard below.
 */
function buildSeasons(yearsBack: number, latestYearId?: number) {
  const now = new Date();
  const latest =
    latestYearId ?? (now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear());
  const n = Math.min(Math.max(Math.floor(yearsBack) || 4, 1), 12);
  const out: Record<string, string> = {};
  for (let i = 0; i < n; i++) {
    const end = latest - i;
    out[String(end)] = `${end - 1}/${end}`;
  }
  return out;
}

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
      headers: cookie ? { "User-Agent": UA, cookie } : { "User-Agent": UA },
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
  for (let i = 0; i < sports.length; i += 6) {
    const batch = sports.slice(i, i + 6);
    const pages = await Promise.all(batch.map((s) => get(s.url, undefined, 12000)));
    pages.forEach((p, idx) => {
      if (!p) return;
      const sport = batch[idx].name;
      for (const m of p.html.matchAll(/href="(\/page\d+)"[^>]*>([\s\S]{0,120}?)<\/a>/g)) {
        const label = decode(m[2]);
        if (!/^roster/i.test(label)) continue;
        rosters.push({ url: schoolUrl + m[1], sport, level: levelFromLabel(label) });
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

// -------------------- ROSTER PARSING (per-table, header driven) --------------------

type Field = "jersey" | "first" | "last" | "full" | "grade" | "position";

interface Player {
  jersey: string;
  first: string;
  last: string;
  grade: string;
  position: string;
  extra: Record<string, string>;
}

const HEADER_MAP: [RegExp, Field][] = [
  [/^(#|no|num|number|jersey|jersey no|jersey number|jersey num|uniform|uni)$/, "jersey"],
  [/^(first|first name|fname|given name)$/, "first"],
  [/^(last|last name|lname|surname|family name)$/, "last"],
  [/^(name|player|player name|athlete|athlete name|student|full name)$/, "full"],
  [/^(grade|gr|class|cl|yr|year|school year|grade level)$/, "grade"],
  [/^(pos|position|positions)$/, "position"],
];

function normHeader(h: string) {
  return h.toLowerCase().replace(/[^a-z0-9# ]/g, "").replace(/\s+/g, " ").trim();
}

function fieldForHeader(h: string): Field | null {
  const n = normHeader(h);
  for (const [re, f] of HEADER_MAP) if (re.test(n)) return f;
  return null;
}

const GRADE_WORDS: Record<string, string> = {
  fr: "9", fresh: "9", freshman: "9",
  so: "10", soph: "10", sophomore: "10",
  jr: "11", junior: "11",
  sr: "12", senior: "12",
};

function normalizeGrade(raw: string) {
  const v = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!v) return "";
  if (GRADE_WORDS[v]) return GRADE_WORDS[v];
  const num = v.match(/^(\d{1,2})(st|nd|rd|th)?(grade)?$/);
  if (num && +num[1] >= 5 && +num[1] <= 12) return num[1];
  return raw.trim();
}

const isGradeLike = (v: string) =>
  /^(5|6|7|8|9|10|11|12)(st|nd|rd|th)?$/i.test(v.trim()) ||
  /^(fr|fresh|freshman|so|soph|sophomore|jr|junior|sr|senior)\.?$/i.test(v.trim());
const isNumberLike = (v: string) => /^\d{1,3}$/.test(v.trim());
const isNameLike = (v: string) => /^[A-Za-z][A-Za-z.'\- ]{0,40}$/.test(v.trim()) && !isGradeLike(v);

function splitFull(full: string) {
  const f = full.trim();
  if (f.includes(",")) {
    const [last, ...rest] = f.split(",");
    return { first: rest.join(",").trim(), last: last.trim() };
  }
  const parts = f.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

interface TableData {
  headers: string[] | null;
  rows: string[][];
}

function extractTables(html: string): TableData[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const out: TableData[] = [];
  for (const t of tables) {
    const trs = t.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    let headers: string[] | null = null;
    const rows: string[][] = [];
    for (const tr of trs) {
      const ths = [...tr.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((c) => decode(c[1]));
      const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => decode(c[1]));
      if (ths.length >= 2 && !headers) {
        headers = ths;
        continue;
      }
      if (tds.length) rows.push(tds);
    }
    // header row written as <td>s: first row mostly recognised header words
    if (!headers && rows.length) {
      const known = rows[0].filter((c) => fieldForHeader(c)).length;
      if (known >= 2) headers = rows.shift()!;
    }
    if (rows.length) out.push({ headers, rows });
  }
  return out;
}

/** Map columns to fields using the table's own header labels. */
function mapFromHeaders(headers: string[]) {
  const map: Record<number, Field> = {};
  const used = new Set<Field>();
  headers.forEach((h, i) => {
    const f = fieldForHeader(h);
    if (f && !used.has(f)) {
      map[i] = f;
      used.add(f);
    }
  });
  return map;
}

/** No usable headers: infer each column's role from its values. */
function mapFromContent(rows: string[][]) {
  const cols = Math.max(...rows.map((r) => r.length));
  const sample = rows.slice(0, 60);
  const stats = Array.from({ length: cols }, (_, i) => {
    const vals = sample.map((r) => (r[i] ?? "").trim()).filter(Boolean);
    const n = Math.max(vals.length, 1);
    return {
      i,
      numShare: vals.filter(isNumberLike).length / n,
      gradeShare: vals.filter(isGradeLike).length / n,
      nameShare: vals.filter(isNameLike).length / n,
      distinct: new Set(vals).size,
      commaShare: vals.filter((v) => v.includes(",")).length / n,
      spaceShare: vals.filter((v) => /\S\s+\S/.test(v)).length / n,
    };
  });
  const map: Record<number, Field> = {};
  const taken = new Set<number>();

  // grade: grade-like values with few distinct values
  const grade = stats
    .filter((s) => s.gradeShare > 0.6 && s.distinct <= 8)
    .sort((a, b) => b.gradeShare - a.gradeShare)[0];
  if (grade) { map[grade.i] = "grade"; taken.add(grade.i); }

  // jersey: numeric column with many distinct values
  const jersey = stats
    .filter((s) => !taken.has(s.i) && s.numShare > 0.6 && s.distinct > 6)
    .sort((a, b) => b.numShare - a.numShare)[0];
  if (jersey) { map[jersey.i] = "jersey"; taken.add(jersey.i); }

  // names
  const nameCols = stats.filter((s) => !taken.has(s.i) && s.nameShare > 0.7);
  const full = nameCols.find((s) => s.commaShare > 0.5 || s.spaceShare > 0.6);
  if (full) {
    map[full.i] = "full";
  } else if (nameCols.length >= 2) {
    map[nameCols[0].i] = "first";
    map[nameCols[1].i] = "last";
  }
  return map;
}

function parseRoster(html: string): Player[] {
  const players: Player[] = [];
  for (const table of extractTables(html)) {
    let map = table.headers ? mapFromHeaders(table.headers) : {};
    const hasName = (m: Record<number, Field>) => {
      const f = new Set(Object.values(m));
      return f.has("full") || (f.has("first") && f.has("last"));
    };
    if (!hasName(map)) {
      if (table.rows.length < 2) continue;
      map = mapFromContent(table.rows);
      if (!hasName(map)) continue;
    }

    for (const cells of table.rows) {
      const rec: Partial<Record<Field, string>> = {};
      const extra: Record<string, string> = {};
      cells.forEach((c, i) => {
        const f = map[i];
        if (f) rec[f] = c;
        else if (c && table.headers?.[i]) extra[normHeader(table.headers[i]) || `col${i}`] = c;
      });

      let first = rec.first ?? "";
      let last = rec.last ?? "";
      if (rec.full) ({ first, last } = splitFull(rec.full));
      first = first.trim();
      last = last.trim();

      // sanity checks: reject header repeats, empty rows, and numeric "names"
      if (!first || !last) continue;
      if (!/[A-Za-z]/.test(first) || !/[A-Za-z]/.test(last)) continue;
      if (/^(first|last|name|player)/i.test(first) && /^(last|name)/i.test(last)) continue;

      const jersey = (rec.jersey ?? "").trim();
      players.push({
        jersey: /^\d{1,3}$/.test(jersey) ? jersey : "",
        first,
        last,
        grade: normalizeGrade(rec.grade ?? ""),
        position: (rec.position ?? "").trim(),
        extra,
      });
    }
    if (players.length) break; // first table that yields a roster wins
  }
  return players;
}

/** Sets the site session to a given school year and returns the cookie header to reuse. */
async function seasonCookie(sampleUrl: string, origin: string, yearId: string) {
  const first = await get(sampleUrl);
  if (!first) return null;
  const token = first.html.match(/__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1];
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
    const expected = Deno.env.get("SCRAPE_PASSWORD");
    if (!expected) return json({ error: "SCRAPE_PASSWORD secret is not set" }, 500);
    if ((body.password ?? "") !== expected) {
      return json({ error: "Invalid scrape password" }, 401);
    }

    if (action === "discover") {
      const schools = await listSchools();
      const idx = Number(body.schoolIndex ?? 0);
      const school = schools[idx];
      if (!school) return json({ error: "School index out of range" }, 400);
      const rosterUrls = await discoverRosters(school.url);
      return json({ school: school.name, schoolUrl: school.url, rosterUrls });
    }

    if (action === "scrape-rosters") {
      const rosters: { url: string; sport: string; level: string }[] =
        (body.rosterUrls ?? []).map((r: any) =>
          typeof r === "string" ? { url: r, sport: "Unknown", level: "Varsity" } : r
        );
      const schoolName: string = body.schoolName ?? "Unknown";
      const schoolUrl: string = body.schoolUrl ?? "";
      const seasons = buildSeasons(Number(body.yearsBack ?? 4), body.latestYearId);
      if (!rosters.length) return json({ athletes: 0 });

      const origin = new URL(rosters[0].url).origin;
      const rows: any[] = [];
      // per-season diagnostics so the admin panel can show WHY data is missing
      const log: Record<string, { saved: number; skipped: string[] }> = {};
      // fingerprint of each roster page per season, to catch "site didn't actually switch years"
      const sigs = new Map<string, Set<string>>();

      for (const [yearId, seasonLabel] of Object.entries(seasons)) {
        const entry = (log[seasonLabel] = { saved: 0, skipped: [] as string[] });
        const cookie = await seasonCookie(rosters[0].url, origin, yearId);
        if (!cookie) {
          entry.skipped.push("could not start session");
          continue;
        }

        const pages = await Promise.all(rosters.map((r) => get(r.url, cookie, 12000)));
        pages.forEach((p, i) => {
          const tag = `${rosters[i].sport} ${rosters[i].level}`;
          if (!p) {
            entry.skipped.push(`fetch failed: ${tag}`);
            return;
          }
          // guard: if the page reports selected school years and none is the one we asked for, skip
          const selectedYears = [...p.html.matchAll(/selected="selected"[^>]*value="(\d{4})"|value="(\d{4})"[^>]*selected="selected"/g)]
            .map((m) => m[1] ?? m[2]);
          if (selectedYears.length && !selectedYears.includes(yearId)) {
            entry.skipped.push(`site stayed on ${selectedYears[0]}: ${tag}`);
            return;
          }

          const players = parseRoster(p.html);
          if (!players.length) {
            entry.skipped.push(`0 players parsed: ${tag}`);
            return;
          }

          // identical roster already seen for another season => the year didn't really change
          const sig = players.map((x) => `${x.first}|${x.last}|${x.jersey}|${x.grade}`).sort().join(";");
          const known = sigs.get(rosters[i].url) ?? new Set<string>();
          if (known.has(sig)) {
            entry.skipped.push(`same as another season: ${tag}`);
            return;
          }
          known.add(sig);
          sigs.set(rosters[i].url, known);

          entry.saved += players.length;
          for (const pl of players) {
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
              position: pl.position || null,
              extra: Object.keys(pl.extra).length ? pl.extra : null,
            });
          }
        });
      }

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
      return json({ athletes: unique.length, log });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
