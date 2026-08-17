import { corsHeaders, getCallerDiscordId, json } from "../_shared/panel.ts";

/**
 * Serves the staff guide by pulling the live HTML export of a published
 * Google Doc (File -> Share -> Publish to web) so edits in the doc show up
 * on the panel without a redeploy. Set STAFF_GUIDE_DOC_ID to the document's
 * ID (the long string in the doc's URL between /d/ and /edit).
 *
 * We fetch server-side (not from the browser) because Google's export
 * endpoint doesn't send CORS headers, and to avoid ever exposing the raw
 * doc URL/ID to the client.
 */

type Section = { id: string; title: string; level: 1 | 2 };

function slugify(text: string, seen: Map<string, number>): string {
  let base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "section";
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/** Strips Google's export chrome down to the doc body, tags h1/h2 with ids, and collects a TOC. */
function processDocHtml(html: string): { html: string; sections: Section[] } {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;

  // Drop inline <style>/<script> blocks and Google's generated width/margin
  // wrapper styles that fight with our own layout.
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
  body = body.replace(/\sstyle="[^"]*"/gi, "");
  body = body.replace(/\sid="[^"]*"/gi, "");
  body = body.replace(/\sclass="[^"]*"/gi, "");

  const seen = new Map<string, number>();
  const sections: Section[] = [];

  body = body.replace(/<(h1|h2)([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attrs: string, inner: string) => {
    const title = inner.replace(/<[^>]+>/g, "").trim();
    if (!title) return `<${tag}${attrs}>${inner}</${tag}>`;
    const id = slugify(title, seen);
    sections.push({ id, title, level: tag.toLowerCase() === "h1" ? 1 : 2 });
    return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
  });

  return { html: body, sections };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const caller = await getCallerDiscordId(req);
  if ("error" in caller) return caller.error;

  const docId = Deno.env.get("STAFF_GUIDE_DOC_ID");
  if (!docId) return json({ error: "Staff guide is not configured (STAFF_GUIDE_DOC_ID not set)" }, 500);

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

  let res: Response;
  try {
    res = await fetch(exportUrl);
  } catch (e) {
    return json({ error: `Could not reach Google Docs: ${(e as Error).message}` }, 502);
  }

  if (!res.ok) {
    return json(
      { error: `Google Docs returned ${res.status}. Make sure the doc is published to the web (or shared "Anyone with the link can view").` },
      502,
    );
  }

  const raw = await res.text();
  const { html, sections } = processDocHtml(raw);

  return json({ html, sections, fetchedAt: new Date().toISOString() });
});
