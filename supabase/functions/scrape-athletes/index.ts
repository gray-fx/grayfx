import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// All schools from websites4sports.com
const SCHOOLS = [
  { name: "AI duPont HS", url: "https://www.tigerssports.com" },
  { name: "Appoquinimink HS", url: "https://www.jaguars-sports.com" },
  { name: "Brandywine HS", url: "https://www.bulldogssports.com" },
  { name: "Christiana HS", url: "https://www.vikingssports.com" },
  { name: "Concord HS", url: "https://www.raiderssports.com" },
  { name: "Delcastle HS", url: "https://www.cougarssports.com" },
  { name: "Glasgow HS", url: "https://www.dragonssports.com" },
  { name: "Hodgson Vo-Tech", url: "https://www.silvereaglessports.com" },
  { name: "Howard HS of Tech", url: "https://www.wildcatssports.com" },
  { name: "John Dickinson School", url: "https://www.ramssports.com" },
  { name: "McKean HS", url: "https://www.highlanderssports.com" },
  { name: "Middletown HS", url: "https://www.cavalierssports.com" },
  { name: "Mt. Pleasant HS", url: "https://www.greenknightssports.com" },
  { name: "Newark HS", url: "https://www.yellowjacketssports.com" },
  { name: "Odessa HS", url: "https://www.odessaducks.com" },
  { name: "St. Georges Tech HS", url: "https://www.hawkssports.com" },
  { name: "William Penn HS", url: "https://www.colonialssports.com" },
  { name: "Padua Academy", url: "https://www.pandassports.com" },
  { name: "Ursuline Academy", url: "https://www.uaraiderssports.com" },
  { name: "Archmere Academy", url: "https://www.aukssports.com" },
  { name: "Charter School of Wilmington", url: "https://www.forcessports.com" },
  { name: "Conrad School", url: "https://www.conradsports.com" },
  { name: "DE Military Academy", url: "https://www.seahawkssports.com" },
  { name: "MOT Charter HS", url: "https://www.motchartersports.com" },
  { name: "Newark Charter School", url: "https://www.ncspatriotssports.com" },
  { name: "St. Elizabeth HS", url: "https://www.vikings-sports.com" },
  { name: "Delmarva Christian HS", url: "https://www.royalssports.com" },
  { name: "Caesar Rodney HS", url: "https://www.riderssports.com" },
  { name: "Cape Henlopen HS", url: "https://www.capevikingssports.com" },
  { name: "Delmar HS/MS", url: "https://www.wildcats-sports.com" },
  { name: "Dover HS", url: "https://www.senatorssports.com" },
  { name: "Indian River HS", url: "https://www.indians-sports.com" },
  { name: "Lake Forest HS", url: "https://www.spartans-sports.com" },
  { name: "Laurel HS", url: "https://www.bulldogs-sports.com" },
  { name: "Milford HS", url: "https://www.buccaneers-sports.com" },
  { name: "Polytech HS", url: "https://www.pantherssports.com" },
  { name: "Seaford HS", url: "https://www.bluejayssports.com" },
  { name: "Smyrna HS", url: "https://www.eagles-sports.com" },
  { name: "Sussex Academy", url: "https://www.sussexacademysports.com" },
  { name: "Sussex Central HS", url: "https://www.goldenknightssports.com" },
  { name: "Sussex Tech", url: "https://www.ravens-sports.com" },
  { name: "Woodbridge HS", url: "https://www.blueraiders-sports.com" },
  { name: "Independence School", url: "https://www.patriots-sports.com" },
  { name: "Sanford School", url: "https://www.warriors-sports.com" },
  { name: "St. Andrew's School", url: "https://www.sas-saints.com" },
  { name: "Tatnall School", url: "https://www.hornets-sports.com" },
  { name: "Tower Hill School", url: "https://www.hillerssports.com" },
  { name: "Wilm Friends School", url: "https://www.quakerssports.com" },
  { name: "Caravel Academy", url: "https://www.buccaneerssports.com" },
  { name: "First State Military Academy", url: "https://www.fsmasports.com" },
  { name: "Holy Cross HS", url: "https://www.crusaderssports.com" },
  { name: "Red Lion CA", url: "https://www.redlionssports.com" },
  { name: "Saint Mark's HS", url: "https://www.spartanssports.com" },
  { name: "Salesianum School", url: "https://www.salliessports.com" },
  { name: "Wilm Christian School", url: "https://www.wcswarriorssports.com" },
  // Middle Schools
  { name: "Campus Community MS", url: "https://www.cougarsmiddlesports.com" },
  { name: "MOT Charter MS", url: "https://www.motmiddlesports.com" },
  { name: "Cantwell's Bridge MS", url: "https://www.cbmscobras.com" },
  { name: "Everett Meredith MS", url: "https://www.emmscrusaders.com" },
  { name: "Redding MS", url: "https://www.llrmseagles.com" },
  { name: "Waters MS", url: "https://www.agwsharks.com" },
  { name: "PS duPont MS", url: "https://www.psdupontmiddlesports.com" },
  { name: "Springer MS", url: "https://www.springermiddlesports.com" },
  { name: "Talley MS", url: "https://www.talleymiddlesports.com" },
  { name: "Dover AFB MS", url: "https://www.doverafbmiddlesports.com" },
  { name: "Fifer MS", url: "https://www.fifermiddlesports.com" },
  { name: "Magnolia MS", url: "https://www.magnoliamiddlesports.com" },
  { name: "Postlethwait MS", url: "https://www.postlethwaitmiddlesports.com" },
  { name: "Beacon MS", url: "https://www.beaconmiddlesports.com" },
  { name: "Mariner MS", url: "https://www.marinermiddlesports.com" },
  { name: "Dover MS", url: "https://www.dovermiddlesports.com" },
  { name: "Bayard MS", url: "https://www.bayardmiddlesports.com" },
  { name: "Gauger MS", url: "https://www.gaugermiddlesports.com" },
  { name: "Kirk MS", url: "https://www.kirkmiddlesports.com" },
  { name: "Shue MS", url: "https://www.shuemiddlesports.com" },
  { name: "George Read MS", url: "https://www.knights-sports.com" },
  { name: "Gunning Bedford MS", url: "https://www.panthers-sports.com" },
  { name: "McCullough MS", url: "https://www.mustangs-sports.com" },
  { name: "Georgetown MS", url: "https://www.georgetownmiddlesports.com" },
  { name: "Selbyville MS", url: "https://www.selbyvillemiddlesports.com" },
  { name: "Sussex Central MS", url: "https://www.sussexcentralmiddlesports.com" },
  { name: "Chipman MS", url: "https://www.chipmanmiddlesports.com" },
  { name: "Laurel Intermediate MS", url: "https://www.laurelmiddlesports.com" },
  { name: "Milford MS", url: "https://www.milfordmiddlesports.com" },
  { name: "AI duPont MS", url: "https://www.tigers-sports.com" },
  { name: "HB duPont MS", url: "https://www.hbwarriors-sports.com" },
  { name: "Skyline MS", url: "https://www.skylinejaguars-sports.com" },
  { name: "Stanton MS", url: "https://www.falcons-sports.com" },
  { name: "Seaford MS", url: "https://www.seafordmiddlesports.com" },
  { name: "Clayton MS", url: "https://www.claytonmiddlesports.com" },
  { name: "Smyrna MS", url: "https://www.smyrnamiddlesports.com" },
  // MD Schools
  { name: "Bennett HS (MD)", url: "https://www.jmbsports.com" },
  { name: "Cambridge-South Dorchester HS (MD)", url: "https://www.csdathletics.com" },
  { name: "Colonel Richardson HS (MD)", url: "https://www.colonelrichardsonsports.com" },
  { name: "Crisfield HS (MD)", url: "https://www.crisfieldcrabbers.com" },
  { name: "Easton HS (MD)", url: "https://www.eastonwarriors.com" },
  { name: "Kent County HS (MD)", url: "https://www.kchsathletics.com" },
  { name: "Kent Island HS (MD)", url: "https://www.kihsathletics.com" },
  { name: "Mardela HS (MD)", url: "https://www.mardelawarriors.com" },
  { name: "North Caroline HS (MD)", url: "https://www.nchsbulldogs.com" },
  { name: "North Dorchester HS (MD)", url: "https://www.ndhseagles.com" },
  { name: "Parkside HS (MD)", url: "https://www.parksideramssports.com" },
  { name: "Pocomoke HS (MD)", url: "https://www.pocomokewarriors.com" },
  { name: "Queen Anne's County HS (MD)", url: "https://www.qachsathletics.com" },
  { name: "Snow Hill HS (MD)", url: "https://www.snowhilleagles.com" },
  { name: "St. Michaels HS (MD)", url: "https://www.smsaints.com" },
  { name: "Stephen Decatur HS (MD)", url: "https://www.decaturseahawks.com" },
  { name: "Washington HS (MD)", url: "https://www.whsjaguars.com" },
  { name: "Wicomico HS (MD)", url: "https://www.wihisports.com" },
  // More schools
  { name: "Calvary Christian Academy", url: "https://www.calvarychristiansports.com" },
  { name: "Delaware Valley Classical School", url: "https://www.dvcssports.com" },
  { name: "Greenwood Mennonite School", url: "https://www.gmsflamesathletics.com" },
  { name: "Early College School @ DSU", url: "https://www.ecshornets.com" },
  { name: "Gunston School (MD)", url: "https://www.gunstonsports.com" },
  { name: "Worcester Prep School (MD)", url: "https://www.worcesterprepsports.com" },
];

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const regex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1].trim();
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    // Skip javascript:, mailto:, tel: links
    if (/^(javascript|mailto|tel):/i.test(href)) continue;
    // Handle relative URLs (no leading slash, no protocol)
    if (!href.startsWith("http://") && !href.startsWith("https://")) {
      if (href.startsWith("/")) {
        href = baseUrl + href;
      } else {
        href = baseUrl + "/" + href;
      }
    }
    links.push({ href, text });
  }
  return links;
}

function parseRosterTable(html: string): { jersey: string; firstName: string; lastName: string; grade: string }[] {
  const athletes: { jersey: string; firstName: string; lastName: string; grade: string }[] = [];
  
  // Find roster tables - look for tables with Jersey#, First Name, Last Name headers
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const table = tableMatch[0];
    if (!table.toLowerCase().includes("first name") && !table.toLowerCase().includes("firstname")) continue;
    
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    let isHeader = true;
    
    while ((rowMatch = rowRegex.exec(table)) !== null) {
      if (isHeader) { isHeader = false; continue; }
      
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]*>/g, "").trim());
      }
      
      // Typical format: (image), Jersey#, First Name, Last Name, Grade
      if (cells.length >= 4) {
        const hasImage = cells[0] === "" || cells[0].length === 0;
        const offset = hasImage ? 1 : 0;
        const jersey = cells[offset] || "";
        const firstName = cells[offset + 1] || "";
        const lastName = cells[offset + 2] || "";
        const grade = cells[offset + 3] || "";
        
        if (firstName && lastName && firstName !== "First Name") {
          athletes.push({ jersey, firstName, lastName, grade });
        }
      }
    }
  }
  
  return athletes;
}

function extractSeason(html: string): string {
  // Look for the selected option in season dropdown
  const selectedRegex = /<option[^>]+selected[^>]*>([^<]+)<\/option>/i;
  const match = selectedRegex.exec(html);
  if (match) return match[1].trim();
  
  // Fallback: look for season options
  const optionRegex = /<option[^>]*>(\d{4}\/\d{4})<\/option>/;
  const fallback = optionRegex.exec(html);
  if (fallback) return fallback[1];
  
  return "Unknown";
}

function extractSportAndLevel(html: string, url: string): { sport: string; level: string } {
  // Try to get from page title/heading
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const h1Match = h1Regex.exec(html);
  if (h1Match) {
    const title = h1Match[1].replace(/<[^>]*>/g, "").trim();
    // Parse "Football - Varsity Roster" or "Basketball - JV Roster"
    const parts = title.split(" - ");
    if (parts.length >= 2) {
      const sport = parts[0].trim();
      const levelPart = parts[1].replace(/roster/i, "").trim();
      return { sport, level: levelPart || "Varsity" };
    }
    // Just sport name with "Roster"
    const rosterMatch = title.match(/(.+?)\s+Roster/i);
    if (rosterMatch) return { sport: rosterMatch[1].trim(), level: "Varsity" };
  }
  
  return { sport: "Unknown", level: "Unknown" };
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

async function scrapeSchool(
  school: { name: string; url: string },
  supabase: any
): Promise<{ school: string; athletes: number; errors: string[] }> {
  const errors: string[] = [];
  let totalAthletes = 0;
  
  // Step 1: Fetch homepage to find sport pages
  const homeHtml = await fetchWithTimeout(school.url);
  if (!homeHtml) {
    return { school: school.name, athletes: 0, errors: ["Could not fetch homepage"] };
  }
  
  const links = extractLinks(homeHtml, school.url);
  
  // Step 2: Find roster links - they typically contain "Roster" in the text
  const rosterLinks = links.filter(l => /roster/i.test(l.text));
  
  // If no direct roster links, find sport pages and look for rosters there
  const sportPages = links.filter(l => /page\d+/.test(l.href) && !rosterLinks.some(r => r.href === l.href));
  
  if (rosterLinks.length === 0) {
    // Get unique sport page links and look for roster sub-pages
    const sportUrls = new Set<string>();
    for (const link of sportPages) {
      if (sportUrls.size >= 30) break; // limit
      sportUrls.add(link.href);
    }
    
    for (const sportUrl of sportUrls) {
      const sportHtml = await fetchWithTimeout(sportUrl);
      if (!sportHtml) continue;
      
      const subLinks = extractLinks(sportHtml, school.url);
      const subRosters = subLinks.filter(l => /roster/i.test(l.text));
      rosterLinks.push(...subRosters);
    }
  }
  
  // Deduplicate roster links
  const uniqueRosterUrls = [...new Set(rosterLinks.map(l => l.href))];
  
  console.log(`${school.name}: Found ${uniqueRosterUrls.length} roster pages`);
  
  // Step 3: Scrape each roster page
  for (const rosterUrl of uniqueRosterUrls) {
    try {
      const rosterHtml = await fetchWithTimeout(rosterUrl);
      if (!rosterHtml) {
        errors.push(`Could not fetch ${rosterUrl}`);
        continue;
      }
      
      const { sport, level } = extractSportAndLevel(rosterHtml, rosterUrl);
      const season = extractSeason(rosterHtml);
      const athletes = parseRosterTable(rosterHtml);
      
      if (athletes.length === 0) continue;
      
      // Batch upsert
      const rows = athletes.map(a => ({
        school_name: school.name,
        school_url: school.url,
        sport,
        level,
        season,
        first_name: a.firstName,
        last_name: a.lastName,
        grade: a.grade || null,
        jersey_number: a.jersey || null,
      }));
      
      const { error } = await supabase
        .from("athletes")
        .upsert(rows, { onConflict: "school_url,sport,level,season,first_name,last_name" });
      
      if (error) {
        errors.push(`DB error for ${sport} ${level}: ${error.message}`);
      } else {
        totalAthletes += athletes.length;
      }
    } catch (e) {
      errors.push(`Error scraping ${rosterUrl}: ${e.message}`);
    }
  }
  
  return { school: school.name, athletes: totalAthletes, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const body = await req.json().catch(() => ({}));
    const { action, schoolIndex, batchSize = 3 } = body;
    
    if (action === "list-schools") {
      return new Response(JSON.stringify({ schools: SCHOOLS.map((s, i) => ({ index: i, ...s })) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (action === "scrape-batch") {
      const start = schoolIndex || 0;
      const end = Math.min(start + batchSize, SCHOOLS.length);
      const results = [];
      
      for (let i = start; i < end; i++) {
        console.log(`Scraping ${SCHOOLS[i].name} (${i + 1}/${SCHOOLS.length})...`);
        const result = await scrapeSchool(SCHOOLS[i], supabase);
        results.push(result);
      }
      
      return new Response(JSON.stringify({
        results,
        nextIndex: end < SCHOOLS.length ? end : null,
        totalSchools: SCHOOLS.length,
        processed: end,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (action === "scrape-single") {
      const school = SCHOOLS[schoolIndex];
      if (!school) {
        return new Response(JSON.stringify({ error: "Invalid school index" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const result = await scrapeSchool(school, supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (action === "stats") {
      const { count } = await supabase
        .from("athletes")
        .select("*", { count: "exact", head: true });
      
      const { data: schools } = await supabase
        .from("athletes")
        .select("school_name")
        .limit(1000);
      
      const uniqueSchools = new Set(schools?.map((s: any) => s.school_name));
      
      return new Response(JSON.stringify({
        totalAthletes: count,
        totalSchools: uniqueSchools.size,
        availableSchools: SCHOOLS.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: "Invalid action. Use: list-schools, scrape-batch, scrape-single, stats" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
