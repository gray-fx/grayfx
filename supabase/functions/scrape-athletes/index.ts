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

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const hiddenRegex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
  let match;
  while ((match = hiddenRegex.exec(html)) !== null) {
    const tag = match[0];
    const nameMatch = tag.match(/name=["']([^"']+)["']/);
    const valueMatch = tag.match(/value=["']([^"']*?)["']/);
    if (nameMatch) {
      fields[nameMatch[1]] = valueMatch ? valueMatch[1] : "";
    }
  }
  return fields;
}

function parseRosterTable(html: string) {
  const athletes: any[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const clean = cellMatch[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, "")
        .trim();
      cells.push(clean);
    }

    if (cells.length < 3) continue;

    athletes.push({
      jersey: cells[0] || "",
      firstName: cells[1] || "",
      lastName: cells[2] || "",
      grade: cells[3] || "",
    });
  }

  return athletes;
}

async function fetchWithTimeout(url: string, timeout = 8000, init?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    if (!resp.ok) return null;
    return resp;
  } catch {
    return null;
  }
}

function extractCookies(resp: Response): string {
  const cookies: string[] = [];
  resp.headers.forEach((v, k) => {
    if (k.toLowerCase() === "set-cookie") {
      const name = v.split(";")[0];
      if (name) cookies.push(name);
    }
  });
  return cookies.join("; ");
}

async function scrapeRoster(rosterUrl: string, supabase: any, schoolName: string, schoolUrl: string) {
  let totalAthletes = 0;

  for (const seasonVal of SEASON_VALUES) {
    try {
      // STEP 1: Initial GET
      const initResp = await fetchWithTimeout(rosterUrl);
      if (!initResp) continue;

      const initHtml = await initResp.text();
      const cookies = extractCookies(initResp);

      let html = initHtml;

      // STEP 2: Extract form fields
      const formFields = extractFormFields(initHtml);
      const formData = new URLSearchParams();

      for (const [k, v] of Object.entries(formFields)) {
        formData.append(k, v);
      }

      // 🔥 KEY FIX: ASP.NET event trigger
      formData.set(
        "__EVENTTARGET",
        "ctl00$MainContent$ctl01$Seasonswitcher1$ddlSchoolYear"
      );
      formData.set("__EVENTARGUMENT", "");

      formData.set(
        "ctl00$MainContent$ctl01$Seasonswitcher1$ddlSchoolYear",
        seasonVal
      );

      formData.set(
        "ctl00$MainContent$ctl01$Seasonswitcher1$btnSwitch",
        "Go"
      );

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": rosterUrl,
        "User-Agent": "Mozilla/5.0",
      };

      if (cookies) headers["Cookie"] = cookies;

      // STEP 3: POST request
      const postResp = await fetchWithTimeout(rosterUrl, 10000, {
        method: "POST",
        headers,
        body: formData.toString(),
      });

      if (postResp) {
        html = await postResp.text();
      }

      // STEP 4: Verify season switched
      const seasonCheck = html.match(
        /<option[^>]+selected[^>]+value=["'](\d+)["']/i
      );

      if (!seasonCheck || seasonCheck[1] !== seasonVal) {
        console.log(`❌ Season switch failed: ${seasonVal}`);
        continue;
      }

      // STEP 5: Parse roster
      const parsed = parseRosterTable(html);
      if (parsed.length === 0) continue;

      const season = SEASON_LABELS[seasonVal];

      const rows = parsed.map((a) => ({
        school_name: schoolName,
        school_url: schoolUrl,
        sport: "Unknown",
        level: "Unknown",
        season,
        first_name: a.firstName,
        last_name: a.lastName,
        grade: a.grade || null,
        jersey_number: a.jersey || null,
      }));

      const { error } = await supabase
        .from("athletes")
        .upsert(rows, {
          onConflict:
            "school_url,sport,level,season,first_name,last_name",
        });

      if (!error) {
        totalAthletes += parsed.length;
        console.log(`✅ ${season}: ${parsed.length} athletes`);
      } else {
        console.log("DB error:", error.message);
      }
    } catch (e) {
      console.log("Error:", e);
    }
  }

  return totalAthletes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { rosterUrl, schoolName, schoolUrl } = body;

    if (!rosterUrl) {
      return new Response(JSON.stringify({ error: "Missing rosterUrl" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const count = await scrapeRoster(
      rosterUrl,
      supabase,
      schoolName,
      schoolUrl
    );

    return new Response(JSON.stringify({ athletes: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
