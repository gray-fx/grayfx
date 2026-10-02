import { useState, useCallback, useEffect } from "react";

type Stage = "upload" | "cull" | "unfollow";
type Decision = "unfollow" | "keep";

// ---------- Parsing (unchanged) ----------

function extractUsernameFromHref(href: string): string | null {
  try {
    let url = new URL(href);
    if (url.hostname.includes("l.instagram.com") && url.searchParams.has("u")) {
      url = new URL(url.searchParams.get("u")!);
    }
    const segment = url.pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function extractUsername(item: any): string | null {
  const data = item?.string_list_data;
  if (Array.isArray(data)) {
    for (const entry of data) {
      if (entry?.value) return entry.value.trim().toLowerCase();
      if (entry?.href) {
        const username = extractUsernameFromHref(entry.href);
        if (username) return username;
      }
    }
  }
  if (item?.title) return item.title.trim().toLowerCase();
  return null;
}

function parseList(json: any, key: string): string[] {
  const list = Array.isArray(json) ? json : json?.[key] || [];
  const out: string[] = [];
  for (const item of list) {
    const u = extractUsername(item);
    if (u) out.push(u);
  }
  return out;
}

const parseFollowing = (json: any) => parseList(json, "relationships_following");
const parseFollowers = (json: any) => parseList(json, "relationships_followers");

// ---------- Saved keep list (persists in this browser via localStorage) ----------

const KEEP_KEY = "unfollowFinder:keepList";

function loadKeep(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEEP_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((u) => typeof u === "string").map((u) => u.trim().toLowerCase())
      : [];
  } catch {
    return [];
  }
}

function saveKeep(list: string[]) {
  try {
    localStorage.setItem(KEEP_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable or full; the list just won't persist
  }
}

// ---------- UI helpers ----------

const fileInputClass =
  "block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-border file:bg-muted file:text-foreground file:cursor-pointer";
const primaryBtn =
  "px-6 py-3 rounded border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-40 disabled:cursor-not-allowed";
const ghostBtn =
  "px-4 py-2 border border-border rounded hover:bg-muted transition disabled:opacity-30";

// Instagram doesn't expose pic/bio/follower counts via any public API, and the
// export JSON doesn't contain them. The profile embed page is the only
// client-side option; it shows avatar, bio and counts when Instagram allows it.
function ProfilePreview({ username }: { username: string }) {
  return (
    <div className="w-full max-w-sm space-y-2">
      <iframe
        key={username}
        src={`https://www.instagram.com/${username}/embed`}
        title={`@${username}`}
        className="w-full h-[420px] rounded border border-border bg-muted"
        loading="lazy"
      />
      <p className="text-xs text-muted-foreground text-center">
        Preview blank or login wall?{" "}
        <a
          href={`https://www.instagram.com/${username}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open on Instagram
        </a>
      </p>
    </div>
  );
}

export default function UnfollowFinder() {
  const [stage, setStage] = useState<Stage>("upload");
  const [followingFiles, setFollowingFiles] = useState<File[]>([]);
  const [followerFiles, setFollowerFiles] = useState<File[]>([]);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [cullIndex, setCullIndex] = useState(0);

  const [unfollowList, setUnfollowList] = useState<string[]>([]);
  const [unfollowIndex, setUnfollowIndex] = useState(0);

  const [savedKeep, setSavedKeepState] = useState<string[]>(loadKeep);
  const [skipSaved, setSkipSaved] = useState(true);

  // Every change to the saved list is written straight to localStorage.
  const setSavedKeep = useCallback((updater: (prev: string[]) => string[]) => {
    setSavedKeepState((prev) => {
      const next = updater(prev);
      saveKeep(next);
      return next;
    });
  }, []);

  function exportKeep() {
    const blob = new Blob([JSON.stringify(savedKeep, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "keep-list.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importKeep(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("Expected an array of usernames");
      const incoming = parsed
        .filter((u) => typeof u === "string")
        .map((u: string) => u.trim().toLowerCase());
      setSavedKeep((prev) => [...new Set([...prev, ...incoming])]);
    } catch (e) {
      console.error("Failed to import keep list", e);
    }
  }

  const handleCompare = useCallback(async () => {
    const readFiles = async (files: File[]) => {
      const results: any[] = [];
      for (const file of files) results.push(JSON.parse(await file.text()));
      return results;
    };
    try {
      const following = new Set<string>();
      const followers = new Set<string>();
      (await readFiles(followingFiles)).forEach((j) =>
        parseFollowing(j).forEach((u) => following.add(u))
      );
      (await readFiles(followerFiles)).forEach((j) =>
        parseFollowers(j).forEach((u) => followers.add(u))
      );
      const skip = new Set(skipSaved ? savedKeep : []);
      setCandidates([...following].filter((u) => !followers.has(u) && !skip.has(u)));
      setDecisions({});
      setCullIndex(0);
      setStage("cull");
    } catch (e) {
      console.error("Failed to parse files", e);
    }
  }, [followingFiles, followerFiles, skipSaved, savedKeep]);

  // ---------- Stage 1 ----------

  const decide = useCallback(
    (d: Decision) => {
      const user = candidates[cullIndex];
      if (!user) return;
      setDecisions((prev) => ({ ...prev, [user]: d }));
      // Keep adds to the saved list; unfollow removes (covers re-deciding someone previously kept).
      setSavedKeep((prev) =>
        d === "keep" ? (prev.includes(user) ? prev : [...prev, user]) : prev.filter((u) => u !== user)
      );
      setCullIndex((i) => i + 1);
    },
    [candidates, cullIndex, setSavedKeep]
  );

  const undo = useCallback(() => {
    if (cullIndex === 0) return;
    const prevUser = candidates[cullIndex - 1];
    if (decisions[prevUser] === "keep") {
      setSavedKeep((prev) => prev.filter((u) => u !== prevUser));
    }
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[prevUser];
      return next;
    });
    setCullIndex((i) => i - 1);
  }, [candidates, cullIndex, decisions, setSavedKeep]);

  // Keyboard: ← keep, → unfollow, backspace undo
  useEffect(() => {
    if (stage !== "cull") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") decide("keep");
      else if (e.key === "ArrowRight") decide("unfollow");
      else if (e.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, decide, undo]);

  const keepList = candidates.filter((u) => decisions[u] === "keep");
  const toUnfollow = candidates.filter((u) => decisions[u] === "unfollow");
  const cullDone = cullIndex >= candidates.length;

  function startUnfollowing() {
    setUnfollowList(toUnfollow);
    setUnfollowIndex(0);
    setStage("unfollow");
  }

  function reset() {
    setStage("upload");
    setCandidates([]);
    setDecisions({});
    setUnfollowList([]);
  }

  // ---------- Stage 2 ----------

  const currentUser = unfollowList[unfollowIndex];
  const profileUrl = currentUser ? `https://www.instagram.com/${currentUser}` : "";

  function goToProfileAndNext() {
    window.open(profileUrl, "_blank");
    if (unfollowIndex < unfollowList.length - 1) setUnfollowIndex((i) => i + 1);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
      <a href="#/" className="self-start text-sm text-muted-foreground hover:text-foreground mb-6">
        ← Back
      </a>
      <h1 className="text-3xl font-bold mb-8">Not Following Back Finder</h1>

      {/* UPLOAD */}
      {stage === "upload" && (
        <div className="w-full max-w-lg space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Following JSON (up to 2 files)</label>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={(e) => setFollowingFiles(Array.from(e.target.files || []).slice(0, 2))}
              className={fileInputClass}
            />
            {followingFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {followingFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Followers JSON (up to 2 files)</label>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={(e) => setFollowerFiles(Array.from(e.target.files || []).slice(0, 2))}
              className={fileInputClass}
            />
            {followerFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {followerFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>
          <div className="rounded border border-border p-4 space-y-3">
            <p className="text-sm font-medium">
              Saved keep list: {savedKeep.length} user{savedKeep.length !== 1 ? "s" : ""}
            </p>
            {savedKeep.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipSaved}
                  onChange={(e) => setSkipSaved(e.target.checked)}
                />
                Skip these users when culling
              </label>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <button onClick={exportKeep} disabled={savedKeep.length === 0} className={ghostBtn}>
                Export
              </button>
              <label className={`${ghostBtn} cursor-pointer`}>
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    importKeep(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={() => {
                  if (window.confirm("Clear your saved keep list?")) setSavedKeep(() => []);
                }}
                disabled={savedKeep.length === 0}
                className={ghostBtn}
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Saved in this browser. Export a copy if you clear site data or switch devices.
            </p>
          </div>

          <button
            onClick={handleCompare}
            disabled={followingFiles.length === 0 || followerFiles.length === 0}
            className={`w-full ${primaryBtn}`}
          >
            Compare
          </button>
        </div>
      )}

      {/* STAGE 1: CULL */}
      {stage === "cull" && candidates.length === 0 && (
        <div className="text-center space-y-4">
          <p className="text-lg">Everyone you follow follows you back! 🎉</p>
          <button onClick={reset} className={ghostBtn}>Start Over</button>
        </div>
      )}

      {stage === "cull" && candidates.length > 0 && !cullDone && (
        <div className="flex flex-col items-center space-y-5 w-full">
          <p className="text-sm text-muted-foreground">
            Stage 1 of 2: decide who to unfollow · {cullIndex + 1} / {candidates.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {toUnfollow.length} to unfollow · {keepList.length} kept
          </p>

          <p className="text-2xl font-semibold">@{candidates[cullIndex]}</p>
          <ProfilePreview username={candidates[cullIndex]} />

          <div className="flex gap-4">
            <button onClick={() => decide("keep")} className={primaryBtn}>
              ← Keep
            </button>
            <button onClick={() => decide("unfollow")} className={primaryBtn}>
              Unfollow →
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={undo} disabled={cullIndex === 0} className={ghostBtn}>
              Undo
            </button>
            <button
              onClick={startUnfollowing}
              disabled={toUnfollow.length === 0}
              className={ghostBtn}
            >
              Finish early ({toUnfollow.length})
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Shortcuts: ← keep, → unfollow, Backspace undo
          </p>
        </div>
      )}

      {stage === "cull" && candidates.length > 0 && cullDone && (
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">Culling done</p>
          <p className="text-muted-foreground">
            {toUnfollow.length} to unfollow · {keepList.length} kept
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={undo} className={ghostBtn}>Undo last</button>
            <button
              onClick={startUnfollowing}
              disabled={toUnfollow.length === 0}
              className={primaryBtn}
            >
              Continue to unfollowing →
            </button>
          </div>
          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">
            Start Over
          </button>
        </div>
      )}

      {/* STAGE 2: UNFOLLOW */}
      {stage === "unfollow" && (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-muted-foreground text-sm">
            Stage 2 of 2: {unfollowList.length} user{unfollowList.length !== 1 ? "s" : ""} to unfollow
          </p>
          <p className="text-xs text-muted-foreground">
            {unfollowIndex + 1} / {unfollowList.length}
          </p>

          <p className="text-2xl font-semibold">@{currentUser}</p>

          <button onClick={goToProfileAndNext} className={primaryBtn}>
            Open Profile →
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => setUnfollowIndex((i) => Math.max(0, i - 1))}
              disabled={unfollowIndex === 0}
              className={ghostBtn}
            >
              ← Prev
            </button>
            <button
              onClick={() => setUnfollowIndex((i) => Math.min(unfollowList.length - 1, i + 1))}
              disabled={unfollowIndex === unfollowList.length - 1}
              className={ghostBtn}
            >
              Next →
            </button>
          </div>

          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setStage("cull")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to culling
            </button>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
