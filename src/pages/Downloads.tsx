import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, Folder, FileIcon, Trash2 } from "lucide-react";

interface FileEntry {
  name: string;
  size: number;
  url: string;
  path: string;
}
interface BatchEntry {
  folder: string;
  createdAt: string | null;
  files: FileEntry[];
}

export default function Downloads() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("downloads_unlocked") === "1"
  );
  const [pwInput, setPwInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<BatchEntry[]>([]);

  const verifyPassword = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "download_password")
        .maybeSingle();
      if (error) throw error;
      const stored = (data?.value as any)?.password;
      if (stored && pwInput === stored) {
        sessionStorage.setItem("downloads_unlocked", "1");
        setUnlocked(true);
      } else {
        toast({ title: "Incorrect password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data: folders, error: folderErr } = await supabase.storage
        .from("uploads")
        .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      if (folderErr) throw folderErr;

      const result: BatchEntry[] = [];
      for (const folder of folders ?? []) {
        if (folder.name === ".emptyFolderPlaceholder") continue;
        const { data: items, error: itemErr } = await supabase.storage
          .from("uploads")
          .list(folder.name, { limit: 1000 });
        if (itemErr) continue;

        const files: FileEntry[] = (items ?? [])
          .filter((it) => it.name !== ".emptyFolderPlaceholder")
          .map((it) => {
            const path = `${folder.name}/${it.name}`;
            const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
            return {
              name: it.name,
              size: (it.metadata as any)?.size ?? 0,
              url: pub.publicUrl,
              path,
            };
          });

        result.push({
          folder: folder.name,
          createdAt: (folder as any).created_at ?? null,
          files,
        });
      }
      setBatches(result);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) loadFiles();
  }, [unlocked]);

  const formatSize = (b: number) => {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const deleteBatch = async (folder: string, paths: string[]) => {
    if (!confirm(`Delete entire batch "${folder}"?`)) return;
    const { error } = await supabase.storage.from("uploads").remove(paths);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      loadFiles();
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Downloads</h1>
          <Input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
          />
          <Button onClick={verifyPassword} disabled={verifying} className="w-full">
            {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Uploaded Files</h1>
          <Button onClick={loadFiles} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : batches.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No uploads yet.</p>
        ) : (
          <div className="space-y-6">
            {batches.map((b) => (
              <div key={b.folder} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.folder}</p>
                      {b.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBatch(b.folder, b.files.map((f) => f.path))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {b.files.map((f) => (
                    <a
                      key={f.path}
                      href={f.url}
                      download={f.name}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatSize(f.size)}
                      </span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
