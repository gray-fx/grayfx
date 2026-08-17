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

  const caller = await getCallerDiscordId(req);
  if ("error" in caller) return caller.error;
  const env = panelEnv();
  if ("error" in env) return env.error;

  const url = new URL(req.url);
  const robloxUsername = url.searchParams.get("robloxUsername") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;
  const limit = url.searchParams.get("limit") ?? "50";

  if (type && !TYPES.includes(type)) {
    return json({ error: "Invalid case type" }, 400);
  }
  if (robloxUsername && !/^[A-Za-z0-9_]{3,20}$/.test(robloxUsername)) {
    return json({ error: "Invalid Roblox username" }, 400);
  }
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

  return await forward({
    path: "/api/modlogs",
    method: "GET",
    baseUrl: env.baseUrl,
    secret: env.secret,
    query: {
      guildId: env.guildId,
      discordUserId: caller.discordUserId,
      robloxUsername,
      type,
      limit: String(parsedLimit),
    },
  });
});
