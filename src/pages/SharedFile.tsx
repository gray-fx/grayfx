import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, FileIcon, Folder } from "lucide-react";

interface F { name: string; url: string; size: number }

const formatSize = (b: number) => {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export default function SharedFile() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<F[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("share_links")
        .select("kind,path")
        .eq("code", (code ?? "").toLowerCase())
        .maybeSingle();
      if (!data) { setFiles(null); setLoading(false); return; }
      const pub = (p: string) => supabase.storage.from("uploads").getPublicUrl(p).data.publicUrl;
      if (data.kind === "file") {
        const name = data.path.split("/").pop() ?? data.path;
        setTitle(name);
        setFiles([{ name, url: pub(data.path), size: 0 }]);
      } else {
        setTitle(data.path);
        const { data: items } = await supabase.storage.from("uploads").list(data.path, { limit: 1000 });
        setFiles(
          (items ?? [])
            .filter((i) => i.name !== ".emptyFolderPlaceholder")
            .map((i) => ({ name: i.name, url: pub(`${data.path}/${i.name}`), size: (i.metadata as any)?.size ?? 0 }))
        );
      }
      setLoading(false);
    })();
  }, [code]);

  const isImg = (n: string) => /\.(png|jpe?g|gif|webp|avif)$/i.test(n);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto mt-24 text-muted-foreground" />
        ) : !files ? (
          <p className="text-center text-muted-foreground mt-24">This link doesn't exist.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold truncate">{title}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((f) => (
                <a key={f.url} href={f.url} download={f.name} target="_blank" rel="noreferrer"
                  className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                  {isImg(f.name) && <img src={f.url} alt={f.name} loading="lazy" className="w-full h-56 object-cover" />}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
