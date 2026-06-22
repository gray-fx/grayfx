import { supabase } from "@/integrations/supabase/client";

export type GameKind = "classic" | "das5000";

export type GameRow = {
  id: string;
  code: string;
  kind: GameKind;
  name: string;
  pin: string;
  state: any;
  created_at: string;
  updated_at: string;
};

const randCode = (len = 6) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

export async function listRecentGames(): Promise<GameRow[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as GameRow[];
}

export async function getGameByCode(code: string): Promise<GameRow | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as GameRow) ?? null;
}

export async function createGame(params: {
  kind: GameKind;
  name?: string;
  pin?: string;
  state?: any;
}): Promise<GameRow> {
  let attempt = 0;
  while (attempt < 5) {
    const code = randCode();
    const { data, error } = await supabase
      .from("games")
      .insert({
        code,
        kind: params.kind,
        name: params.name ?? "",
        pin: params.pin ?? "",
        state: params.state ?? {},
      })
      .select("*")
      .single();
    if (!error && data) return data as GameRow;
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
    attempt++;
  }
  throw new Error("Could not allocate a unique game code");
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) throw error;
}

export async function updateGameState(id: string, state: any): Promise<void> {
  const { error } = await supabase
    .from("games")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Throttled writer: batches rapid updates into a single call per `intervalMs`. */
export function makeThrottledWriter<T>(
  write: (value: T) => Promise<void> | void,
  intervalMs = 250,
) {
  let pending: T | null = null;
  let hasPending = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastRun = 0;

  const run = async () => {
    if (!hasPending) return;
    const value = pending as T;
    hasPending = false;
    pending = null;
    lastRun = Date.now();
    try {
      await write(value);
    } catch (e) {
      console.error("throttled write failed", e);
    }
  };

  return (value: T) => {
    pending = value;
    hasPending = true;
    const now = Date.now();
    const since = now - lastRun;
    if (since >= intervalMs) {
      if (timer) { clearTimeout(timer); timer = null; }
      void run();
    } else if (!timer) {
      timer = setTimeout(() => { timer = null; void run(); }, intervalMs - since);
    }
  };
}
