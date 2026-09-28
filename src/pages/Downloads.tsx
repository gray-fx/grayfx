import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, Folder, FileIcon, Trash2, Share2, Eye, X } from "lucide-react";

const isImage = (n: string) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(n);
const isVideo = (n: string) => /\.(mp4|webm|mov|m4v|ogv)$/i.test(n);
const isAudio = (n: string) => /\.(mp3|wav|ogg|m4a|flac)$/i.test(n);
const isPreviewable = (n: string) => isImage(n) || isVideo(n) || isAudio(n);

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
  const [preview, setPreview] = useState<FileEntry | null>(null);

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

  const createShare = async (kind: "file" | "folder", path: string) => {
    const raw = prompt("Enter a code for the share link (e.g. justin):");
    if (!raw) return;
    const code = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (!code) return;
    const { error } = await supabase.from("share_links").insert({ code, kind, path });
    if (error) {
      toast({
        title: "Couldn't create link",
        description: error.code === "23505" ? "That code is already taken." : error.message,
        variant: "destructive",
      });
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#/file/${code}`;
    try { await navigator.clipboard.writeText(url); } catch {}
    toast({ title: "Share link copied", description: url });
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
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => createShare("folder", b.folder)}>
                      <Share2 className="h-4 w-4 mr-1" /> Share folder
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteBatch(b.folder, b.files.map((f) => f.path))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {b.files.map((f) => (
                    <div key={f.path} className="flex items-center gap-1">
                      <a
                        href={f.url}
                        download={f.name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatSize(f.size)}
                        </span>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </a>
                      {isPreviewable(f.name) && (
                        <Button size="sm" variant="ghost" title="Preview" onClick={() => setPreview(f)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" title="Share file" onClick={() => createShare("file", f.path)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
              <p className="font-medium truncate">{preview.name}</p>
              <div className="flex items-center gap-1 shrink-0">
                <a href={preview.url} download={preview.name} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </a>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 p-4">
              {isImage(preview.name) && (
                <img src={preview.url} alt={preview.name} className="max-w-full max-h-[70vh] object-contain" />
              )}
              {isVideo(preview.name) && (
                <video src={preview.url} controls autoPlay className="max-w-full max-h-[70vh]" />
              )}
              {isAudio(preview.name) && (
                <audio src={preview.url} controls autoPlay className="w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
