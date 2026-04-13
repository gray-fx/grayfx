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

// Season values for the last 4 school years
// The dropdown value maps to school years: 24=2025/2026, 23=2024/2025, 22=2023/2024, 21=2022/2023
const SEASON_VALUES = ["24", "23", "22", "21"];
const SEASON_LABELS: Record<string, string> = {
  "24": "2025/2026",
  "23": "2024/2025",
  "22": "2023/2024",
  "21": "2022/2023",
};

// The scrape password - checked against site_settings
const SCRAPE_PASSWORD_KEY = "scrape_password";

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const regex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1].trim();
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (/^(javascript|mailto|tel):/i.test(href)) continue;
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

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  // Extract __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION, __EVENTTARGET etc.
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

function parseRosterTable(html: string): { jersey: string; firstName: string; lastName: string; grade: string }[] {
  const athletes: { jersey: string; firstName: string; lastName: string; grade: string }[] = [];
  
  // Find the specific roster table by ID or by structure
  const tableRegex = /<table[^>]*id="[^"]*gvRoster"[^>]*>[\s\S]*?<\/table>/gi;
  let tableMatch = tableRegex.exec(html);
  
  // Fallback: find tables with roster headers
  if (!tableMatch) {
    const genericTableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    let m;
    while ((m = genericTableRegex.exec(html)) !== null) {
      const table = m[0].toLowerCase();
      if (table.includes("first name") || table.includes("firstname") || table.includes("jersey")) {
        tableMatch = m;
        break;
      }
    }
  }
  
  if (!tableMatch) return athletes;
  const table = tableMatch[0];
  
  // Determine column order from header row
  const headerRegex = /<thead[^>]*>[\s\S]*?<\/thead>/i;
  const headerMatch = headerRegex.exec(table);
  
  let jerseyCol = -1, firstNameCol = -1, lastNameCol = -1, gradeCol = -1;
  
  if (headerMatch) {
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;
    let colIdx = 0;
    while ((thMatch = thRegex.exec(headerMatch[0])) !== null) {
      const text = thMatch[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim().toLowerCase();
      if (text.includes("jersey") || text === "#") jerseyCol = colIdx;
      else if (text.includes("first name") || text.includes("firstname")) firstNameCol = colIdx;
      else if (text.includes("last name") || text.includes("lastname")) lastNameCol = colIdx;
      else if (text.includes("grade") || text.includes("grad year") || text.includes("yr")) gradeCol = colIdx;
      colIdx++;
    }
  }
  
  // Default column layout if headers not detected: [image, jersey, firstName, lastName, grade]
  if (firstNameCol === -1) {
    jerseyCol = 1;
    firstNameCol = 2;
    lastNameCol = 3;
    gradeCol = 4;
  }
  
  // Parse data rows from tbody
  const tbodyRegex = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i;
  const tbodyMatch = tbodyRegex.exec(table);
  const bodyHtml = tbodyMatch ? tbodyMatch[1] : table;
  
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(bodyHtml)) !== null) {
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const clean = cellMatch[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim();
      cells.push(clean);
    }
    
    if (cells.length < 4) continue;
    
    const jersey = (cells[jerseyCol] || "").trim();
    const firstName = (cells[firstNameCol] || "").trim();
    const lastName = (cells[lastNameCol] || "").trim();
    const grade = (cells[gradeCol] || "").trim();
    
    // Skip header rows that leaked through
    if (/^(first\s*name|jersey|#)$/i.test(firstName)) continue;
    if (/^(last\s*name)$/i.test(lastName)) continue;
    
    // Skip empty rows
    if (!firstName && !lastName) continue;
    
    // Handle managers: "Smith Manager" or first name being a number while last name contains "Manager"
    if (/manager/i.test(lastName) || /manager/i.test(firstName)) {
      // This is a manager, not a player - parse their actual name
      // Common patterns: firstName="3", lastName="Smith Manager" → skip jersey, name is "Smith"
      // Or firstName="Manager", lastName="Smith"
      const managerCleanLast = lastName.replace(/\s*manager\s*/i, "").trim();
      const managerCleanFirst = firstName.replace(/\s*manager\s*/i, "").trim();
      
      if (managerCleanFirst && managerCleanLast) {
        athletes.push({ jersey: "", firstName: managerCleanFirst, lastName: managerCleanLast, grade });
      } else if (managerCleanLast) {
        // firstName might be a jersey number mistakenly, lastName has the real name
        // e.g. firstName="5", lastName="Johnson Manager"
        if (/^\d+$/.test(firstName)) {
          athletes.push({ jersey: "", firstName: managerCleanLast, lastName: "", grade });
        } else {
          athletes.push({ jersey: "", firstName: firstName, lastName: managerCleanLast, grade });
        }
      }
      continue;
    }
    
    athletes.push({ jersey, firstName, lastName, grade });
  }
  
  return athletes;
}

function extractSeason(html: string): string {
  const selectedRegex = /<option[^>]+selected[^>]*value=["'](\d+)["'][^>]*>([^<]+)<\/option>/i;
  const match = selectedRegex.exec(html);
  if (match) return match[2].trim();
  
  // Try without value attribute order
  const selectedRegex2 = /<option[^>]+selected[^>]*>([^<]+)<\/option>/i;
  const match2 = selectedRegex2.exec(html);
  if (match2) return match2[1].trim();
  
  return "Unknown";
}

function extractSportAndLevel(html: string): { sport: string; level: string } {
  // Look for the roster title: "Football - Varsity Roster" or "Basketball - Boys - Varsity Roster"
  const titleRegex = /<span[^>]*id="[^"]*lblRosterTitle"[^>]*>([\s\S]*?)<\/span>/i;
  const titleMatch = titleRegex.exec(html);
  
  let titleText = "";
  if (titleMatch) {
    titleText = titleMatch[1].replace(/<[^>]*>/g, "").trim();
  } else {
    // Fallback to h1
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
    const h1Match = h1Regex.exec(html);
    if (h1Match) {
      titleText = h1Match[1].replace(/<[^>]*>/g, "").trim();
    }
  }
  
  if (!titleText) return { sport: "Unknown", level: "Unknown" };
  
  // Remove "Roster" from the end
  titleText = titleText.replace(/\s*roster\s*$/i, "").trim();
  
  // Split on " - "
  const parts = titleText.split(/\s*-\s*/);
  
  if (parts.length === 1) {
    return { sport: parts[0], level: "Varsity" };
  }
  
  // Last part is the level, everything before is the sport
  const rawLevel = parts[parts.length - 1].trim();
  const rawSport = parts.slice(0, -1).join(" - ").trim();
  
  // Normalize level abbreviations
  const level = normalizeLevel(rawLevel);
  
  // Check if the "level" is actually a gender indicator (Boys/Girls)
  // In that case, it should be part of the sport name
  if (/^(boys|girls|men|women)$/i.test(level)) {
    // The gender is the last part, but there's no actual level
    // Try to get level from the sub-tab text instead
    const sport = normalizeSportName(rawSport, level);
    // Try extracting level from the page's sub-tab
    const tabLevel = extractLevelFromTab(html);
    return { sport, level: tabLevel || "Varsity" };
  }
  
  // Check if sport name has gender prefix embedded
  // e.g. parts = ["Basketball", "Boys", "Varsity"] → sport="Boys Basketball", level="Varsity"
  if (parts.length >= 3) {
    const possibleGender = parts[parts.length - 2].trim();
    if (/^(boys|girls|men|women)$/i.test(possibleGender)) {
      const baseSport = parts.slice(0, -2).join(" - ").trim();
      const sport = normalizeSportName(baseSport, possibleGender);
      return { sport, level };
    }
  }
  
  // Standard case: "Football - Varsity" → sport="Football", level="Varsity"
  const sport = normalizeSportName(rawSport, null);
  return { sport, level };
}

function normalizeSportName(baseSport: string, gender: string | null): string {
  if (!gender) return baseSport;
  // "Basketball" + "Boys" → "Boys Basketball"
  // "Soccer" + "Girls" → "Girls Soccer"
  const g = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  return `${g} ${baseSport}`;
}

function normalizeLevel(raw: string): string {
  const l = raw.trim();
  if (/^v$/i.test(l) || /^varsity$/i.test(l)) return "Varsity";
  if (/^jv$/i.test(l) || /^junior\s*varsity$/i.test(l)) return "JV";
  if (/^fr$/i.test(l) || /^fresh/i.test(l) || /^freshman$/i.test(l)) return "Freshman";
  if (/^dev/i.test(l)) return "Developmental";
  if (/^ms$/i.test(l) || /^middle/i.test(l)) return "Middle School";
  return l;
}

function extractLevelFromTab(html: string): string | null {
  // Look for the selected/active sub-tab that contains "Roster"
  // Pattern: <a ... class="SelectedTab">&gt;Roster-V</a> or <td class="TabBg">...<a>Roster - JV</a>
  const selectedTabRegex = /<td[^>]*class="[^"]*TabBg[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = selectedTabRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").replace(/&gt;/g, "").trim();
    if (/roster/i.test(text)) {
      // Extract level from "Roster-V", "Roster - JV", "Roster - Fr"
      const levelPart = text.replace(/roster\s*[-–]\s*/i, "").trim();
      if (levelPart) return normalizeLevel(levelPart);
    }
  }
  
  // Also check SelectedTab class
  const selectedRegex = /<a[^>]*class="[^"]*SelectedTab[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = selectedRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, "").replace(/&gt;/g, "").trim();
    if (/roster/i.test(text)) {
      const levelPart = text.replace(/roster\s*[-–]\s*/i, "").trim();
      if (levelPart) return normalizeLevel(levelPart);
    }
  }
  
  return null;
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

// Concurrency-limited parallel execution
async function parallelMap<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency = 5): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }
  
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchRosterForSeason(
  rosterUrl: string,
  seasonValue: string,
  defaultHtml: string
): Promise<{ html: string; season: string } | null> {
  const formFields = extractFormFields(defaultHtml);
  
  // Check if this season is already the selected one
  const selectedMatch = defaultHtml.match(/<option[^>]+selected[^>]+value=["'](\d+)["']/i);
  if (selectedMatch && selectedMatch[1] === seasonValue) {
    return { html: defaultHtml, season: SEASON_LABELS[seasonValue] || extractSeason(defaultHtml) };
  }
  
  // POST to switch season
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(formFields)) {
      formData.append(key, value);
    }
    formData.set("ctl00$MainContent$ctl01$Seasonswitcher1$ddlSchoolYear", seasonValue);
    formData.set("ctl00$MainContent$ctl01$Seasonswitcher1$btnSwitch", "Go");
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(rosterUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(id);
    
    if (!resp.ok) return null;
    const html = await resp.text();
    return { html, season: SEASON_LABELS[seasonValue] || extractSeason(html) };
  } catch {
    return null;
  }
}

async function scrapeRosterPage(
  rosterUrl: string,
  school: { name: string; url: string },
  supabase: any
): Promise<{ athletes: number; errors: string[] }> {
  const errors: string[] = [];
  let totalAthletes = 0;
  
  const defaultHtml = await fetchWithTimeout(rosterUrl);
  if (!defaultHtml) return { athletes: 0, errors: [`Could not fetch ${rosterUrl}`] };
  
  const { sport, level } = extractSportAndLevel(defaultHtml);
  
  // Scrape each of the last 4 seasons sequentially (they share form state)
  for (const seasonVal of SEASON_VALUES) {
    try {
      const result = await fetchRosterForSeason(rosterUrl, seasonVal, defaultHtml);
      if (!result) continue;
      
      const season = result.season;
      const athletes = parseRosterTable(result.html);
      if (athletes.length === 0) continue;
      
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
        errors.push(`DB error for ${sport} ${level} ${season}: ${error.message}`);
      } else {
        totalAthletes += athletes.length;
      }
    } catch (e) {
      errors.push(`Error season ${seasonVal}: ${e.message}`);
    }
  }
  
  return { athletes: totalAthletes, errors };
}

async function scrapeSchool(
  school: { name: string; url: string },
  supabase: any
): Promise<{ school: string; athletes: number; errors: string[] }> {
  const errors: string[] = [];
  let totalAthletes = 0;
  
  const homeHtml = await fetchWithTimeout(school.url);
  if (!homeHtml) {
    return { school: school.name, athletes: 0, errors: ["Could not fetch homepage"] };
  }
  
  const links = extractLinks(homeHtml, school.url);
  
  // Collect sport page links from sidebar
  const sportPageLinks = links.filter(l => /page\d+/.test(l.href));
  const uniqueSportUrls = [...new Set(sportPageLinks.map(l => l.href))];
  
  const rosterLinks: { href: string; text: string }[] = [];
  const homeRosterLinks = links.filter(l => /roster/i.test(l.text));
  rosterLinks.push(...homeRosterLinks);
  
  // Visit sport pages in parallel to find roster sub-tabs (concurrency 5)
  const sportPages = await parallelMap(uniqueSportUrls, async (sportUrl) => {
    const sportHtml = await fetchWithTimeout(sportUrl);
    if (!sportHtml) return [];
    const subLinks = extractLinks(sportHtml, school.url);
    return subLinks.filter(l => /roster/i.test(l.text));
  }, 5);
  
  for (const pageRosters of sportPages) {
    rosterLinks.push(...pageRosters);
  }
  
  const uniqueRosterUrls = [...new Set(rosterLinks.map(l => l.href))];
  console.log(`${school.name}: Found ${uniqueRosterUrls.length} roster pages`);
  
  // Scrape roster pages in parallel (concurrency 3 since each does 4 season POSTs)
  const rosterResults = await parallelMap(uniqueRosterUrls, async (rosterUrl) => {
    return scrapeRosterPage(rosterUrl, school, supabase);
  }, 3);
  
  for (const r of rosterResults) {
    totalAthletes += r.athletes;
    errors.push(...r.errors);
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
    const { action, schoolIndex, batchSize = 2, password } = body;
    
    if (action === "list-schools") {
      return new Response(JSON.stringify({ schools: SCHOOLS.map((s, i) => ({ index: i, ...s })) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Password check for scrape actions
    if (action === "scrape-batch" || action === "scrape-single") {
      // Get stored password from site_settings
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SCRAPE_PASSWORD_KEY)
        .single();
      
      const storedPassword = setting?.value?.password;
      if (storedPassword && password !== storedPassword) {
        return new Response(JSON.stringify({ error: "Invalid scrape password" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
