import {
  corsHeaders,
  forward,
  getCallerDiscordId,
  json,
  panelEnv,
} from "../_shared/panel.ts";

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

  const command = String(body.command ?? "").trim();
  if (command.length < 1 || command.length > 500) {
    return json({ error: "Command must be 1-500 characters" }, 400);
  }

  return await forward({
    path: "/api/command",
    method: "POST",
    baseUrl: env.baseUrl,
    secret: env.secret,
    body: { guildId: env.guildId, discordUserId: caller.discordUserId, command },
  });
});
