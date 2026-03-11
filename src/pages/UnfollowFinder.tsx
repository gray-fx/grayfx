import { useState, useCallback } from "react";

type UserEntry = { username: string };

function parseFollowing(json: any): string[] {
  const usernames: string[] = [];
  const list = json?.relationships_following || [];
  for (const item of list) {
    if (item.title) usernames.push(item.title.toLowerCase());
  }
  return usernames;
}

function parseFollowers(json: any): string[] {
  const usernames: string[] = [];
  const list = Array.isArray(json) ? json : [];
  for (const item of list) {
    const data = item?.string_list_data;
    if (Array.isArray(data)) {
      for (const entry of data) {
        if (entry.value) usernames.push(entry.value.toLowerCase());
      }
    }
  }
  return usernames;
}

export default function UnfollowFinder() {
  const [followingFiles, setFollowingFiles] = useState<File[]>([]);
  const [followerFiles, setFollowerFiles] = useState<File[]>([]);
  const [notFollowingBack, setNotFollowingBack] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasResults, setHasResults] = useState(false);

  const handleCompare = useCallback(async () => {
    const readFiles = async (files: File[]) => {
      const results: any[] = [];
      for (const file of files) {
        const text = await file.text();
        results.push(JSON.parse(text));
      }
      return results;
    };

    try {
      const followingJsons = await readFiles(followingFiles);
      const followerJsons = await readFiles(followerFiles);

      const allFollowing = new Set<string>();
      const allFollowers = new Set<string>();

      for (const json of followingJsons) {
        parseFollowing(json).forEach((u) => allFollowing.add(u));
      }
      for (const json of followerJsons) {
        parseFollowers(json).forEach((u) => allFollowers.add(u));
      }

      const result = [...allFollowing].filter((u) => !allFollowers.has(u));
      setNotFollowingBack(result);
      setCurrentIndex(0);
      setHasResults(true);
    } catch (e) {
      console.error("Failed to parse files", e);
    }
  }, [followingFiles, followerFiles]);

  const currentUser = notFollowingBack[currentIndex];
  const profileUrl = currentUser ? `https://www.instagram.com/${currentUser}` : "";

  function goToProfileAndNext() {
    window.open(profileUrl, "_blank");
    if (currentIndex < notFollowingBack.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
      <a href="#/" className="self-start text-sm text-muted-foreground hover:text-foreground mb-6">
        ← Back
      </a>
      <h1 className="text-3xl font-bold mb-8">Not Following Back Finder</h1>

      {!hasResults ? (
        <div className="w-full max-w-lg space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Following JSON (up to 2 files)
            </label>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 2);
                setFollowingFiles(files);
              }}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-border file:bg-muted file:text-foreground file:cursor-pointer"
            />
            {followingFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {followingFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Followers JSON (up to 2 files)
            </label>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 2);
                setFollowerFiles(files);
              }}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-border file:bg-muted file:text-foreground file:cursor-pointer"
            />
            {followerFiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {followerFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>

          <button
            onClick={handleCompare}
            disabled={followingFiles.length === 0 || followerFiles.length === 0}
            className="w-full py-3 rounded border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare
          </button>
        </div>
      ) : notFollowingBack.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-lg">Everyone you follow follows you back! 🎉</p>
          <button
            onClick={() => setHasResults(false)}
            className="px-4 py-2 border border-border rounded hover:bg-muted transition"
          >
            Start Over
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-muted-foreground text-sm">
            {notFollowingBack.length} user{notFollowingBack.length !== 1 ? "s" : ""} not following back
          </p>

          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {notFollowingBack.length}
          </p>

          <p className="text-2xl font-semibold">@{currentUser}</p>

          <button
            onClick={goToProfileAndNext}
            className="px-6 py-3 rounded border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition"
          >
            Open Profile →
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-border rounded hover:bg-muted transition disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(notFollowingBack.length - 1, i + 1))}
              disabled={currentIndex === notFollowingBack.length - 1}
              className="px-4 py-2 border border-border rounded hover:bg-muted transition disabled:opacity-30"
            >
              Next →
            </button>
          </div>

          <button
            onClick={() => {
              setHasResults(false);
              setNotFollowingBack([]);
            }}
            className="text-sm text-muted-foreground hover:text-foreground mt-4"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
