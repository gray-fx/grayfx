import {
  corsHeaders,
  forward,
  getCallerDiscordId,
  json,
  panelEnv,
} from "../_shared/panel.ts";

const TYPES = ["warn", "kick", "ban", "timeout"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const caller = await getCallerDiscordId(req);
  if ("error" in caller) return caller.error;
  const env = panelEnv();
  if ("error" in env) return env.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const type = String(body.type ?? "");
  const targetTag = String(body.targetTag ?? "").trim();
  const targetId = body.targetId ? String(body.targetId).trim() : "";
  const reason = String(body.reason ?? "").trim();
  const runInGame = Boolean(body.runInGame);

  const errors: string[] = [];
  if (!TYPES.includes(type)) errors.push("Case type must be warn, kick, ban or timeout");
  if (targetTag.length < 2 || targetTag.length > 64) errors.push("Target Discord tag is required");
  if (targetId && !/^[0-9]{5,25}$/.test(targetId)) errors.push("Target Discord ID must be numeric");
  if (reason.length < 3 || reason.length > 1000) errors.push("Reason must be 3-1000 characters");
  if (errors.length) return json({ error: errors.join(". ") }, 400);

  return await forward({
    path: "/api/modlogs",
    method: "POST",
    baseUrl: env.baseUrl,
    secret: env.secret,
    body: {
      guildId: env.guildId,
      discordUserId: caller.discordUserId,
      type,
      targetId: targetId || null,
      targetTag,
      reason,
      runInGame,
    },
  });
});
