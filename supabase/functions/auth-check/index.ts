import {
  corsHeaders,
  forward,
  getCallerDiscordId,
  json,
  panelEnv,
} from "../_shared/panel.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const caller = await getCallerDiscordId(req);
  if ("error" in caller) return caller.error;
  const env = panelEnv();
  if ("error" in env) return env.error;

  return await forward({
    path: "/api/auth/check",
    method: "POST",
    baseUrl: env.baseUrl,
    secret: env.secret,
    body: { guildId: env.guildId, discordUserId: caller.discordUserId },
  });
});
