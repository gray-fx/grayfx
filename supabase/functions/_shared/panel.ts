import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Resolves the caller's Discord user ID from their Supabase session. Never trusts client input. */
export async function getCallerDiscordId(
  req: Request,
): Promise<{ discordUserId: string } | { error: Response }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: json({ error: "Not authenticated" }, 401) };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: json({ error: "Invalid session" }, 401) };
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const identity = (data.user.identities ?? []).find(
    (i: { provider: string }) => i.provider === "discord",
  );
  const discordUserId =
    (identity?.id as string | undefined) ??
    (meta.provider_id as string | undefined) ??
    (meta.sub as string | undefined);

  if (!discordUserId) {
    return { error: json({ error: "No linked Discord account" }, 403) };
  }
  return { discordUserId };
}

export function panelEnv():
  | { baseUrl: string; secret: string; guildId: string }
  | { error: Response } {
  const baseUrl = Deno.env.get("PANEL_API_BASE_URL");
  const secret = Deno.env.get("PANEL_API_SECRET");
  const guildId = Deno.env.get("PANEL_GUILD_ID");
  if (!baseUrl || !secret || !guildId) {
    return { error: json({ error: "Panel API is not configured" }, 500) };
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), secret, guildId };
}

/** Forwards a request to the panel backend and passes its JSON + status through. */
export async function forward(opts: {
  path: string;
  method: "GET" | "POST";
  baseUrl: string;
  secret: string;
  query?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}): Promise<Response> {
  const url = new URL(`${opts.baseUrl}${opts.path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        "x-panel-secret": opts.secret,
      },
      body: opts.method === "POST" ? JSON.stringify(opts.body ?? {}) : undefined,
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      return json(
        { error: `Upstream returned non-JSON response (${res.status})` },
        502,
      );
    }
    return json(parsed, res.status);
  } catch (e) {
    return json(
      { error: `Could not reach panel API: ${(e as Error).message}` },
      502,
    );
  }
}
