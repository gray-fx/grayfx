import { supabase } from "@/integrations/supabase/client";

export const DISCORD_CLIENT_ID_STORAGE = "panel:returnTo";

/** Where Discord sends the user back. Must be registered as a redirect URI in the Discord app. */
export const discordRedirectUri = () => `${window.location.origin}/`;

export class PanelError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

type CallOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  query?: Record<string, string | undefined>;
};

/** Calls a panel edge function and normalizes error responses. */
export async function callPanel<T = unknown>(
  fn: string,
  opts: CallOptions = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new PanelError("You are not signed in", 401);

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v) search.set(k, v);
  }
  const qs = search.toString();

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: opts.method === "POST" ? JSON.stringify(opts.body ?? {}) : undefined,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new PanelError(payload?.error || `Request failed (${res.status})`, res.status);
  }
  return payload as T;
}

export type PanelUser = {
  discordId: string;
  tag: string;
  avatarUrl: string;
};

export function panelUserFromSession(user: {
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
} | null): PanelUser | null {
  if (!user) return null;
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  if (!app.discord_id) return null;
  return {
    discordId: app.discord_id,
    tag: app.discord_tag ?? meta.discord_tag ?? "Unknown",
    avatarUrl: app.discord_avatar ?? meta.discord_avatar ?? "",
  };
}
