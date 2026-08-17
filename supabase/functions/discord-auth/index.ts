import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/panel.ts";

const DISCORD_API = "https://discord.com/api/v10";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const clientId = Deno.env.get("DISCORD_CLIENT_ID");
  const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) {
    return json({ error: "Discord login is not configured" }, 500);
  }

  // Public config: the OAuth client ID is not a secret.
  if (req.method === "GET") {
    return json({ clientId });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { code?: string; redirectUri?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const redirectUri =
    typeof body.redirectUri === "string" ? body.redirectUri.trim() : "";
  if (!code || !redirectUri) {
    return json({ error: "Missing code or redirectUri" }, 400);
  }

  // 1. Exchange the code for a Discord access token
  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    console.error("discord token exchange failed", tokenRes.status, detail);
    return json({ error: "Discord rejected the login attempt" }, 401);
  }
  const token = await tokenRes.json();

  // 2. Read the Discord profile (identify scope)
  const meRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    return json({ error: "Could not read Discord profile" }, 401);
  }
  const me = await meRes.json();

  const discordId: string = me.id;
  const tag: string = me.discriminator && me.discriminator !== "0"
    ? `${me.username}#${me.discriminator}`
    : (me.global_name || me.username);
  const avatarUrl = me.avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${me.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  // 3. Map the Discord identity onto a Supabase user (server-side only)
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `discord_${discordId}@discord.panel`;
  const appMeta = {
    discord_id: discordId,
    discord_tag: tag,
    discord_avatar: avatarUrl,
  };

  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID() + crypto.randomUUID(),
    app_metadata: appMeta,
    user_metadata: { discord_tag: tag, discord_avatar: avatarUrl },
  });
  if (created.data?.user) {
    userId = created.data.user.id;
  } else {
    for (let page = 1; page <= 10 && !userId; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const found = data?.users?.find((u) => u.email === email);
      if (found) userId = found.id;
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  if (!userId) {
    console.error("could not resolve user", created.error);
    return json({ error: "Could not create your panel account" }, 500);
  }

  // Keep the trusted identity fresh on every login
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: appMeta,
    user_metadata: { discord_tag: tag, discord_avatar: avatarUrl },
  });

  // 4. Mint a session the browser can redeem
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashedToken = link.data?.properties?.hashed_token;
  if (link.error || !hashedToken) {
    console.error("generateLink failed", link.error);
    return json({ error: "Could not start your session" }, 500);
  }

  return json({
    token_hash: hashedToken,
    discord: { id: discordId, tag, avatarUrl },
  });
});
