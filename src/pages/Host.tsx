import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Copy, Loader2, ExternalLink } from "lucide-react";

type Hosted = { name: string; url: string };

export default function Host() {
  const [items, setItems] = useState<Hosted[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    try {
      const done: Hosted[] = [];
      for (const file of Array.from(fileList)) {
        const path = `hosted/${crypto.randomUUID()}-${sanitize(file.name)}`;
        const { error } = await supabase.storage
          .from("uploads")
          .upload(path, file, {
            cacheControl: "31536000",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (error) throw error;
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        done.push({ name: file.name, url: data.publicUrl });
      }
      setItems((prev) => [...done, ...prev]);
      toast({ title: `Hosted ${done.length} file${done.length > 1 ? "s" : ""}` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">Image Host</h1>
          <p className="font-body text-sm text-muted-foreground">
            Upload a file and get a permanent direct link you can use anywhere.
          </p>
        </header>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {busy ? (
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-3" />
          ) : (
            <UploadIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          )}
          <p className="font-body text-sm text-muted-foreground">
            {busy ? "Uploading…" : "Click or drag files here"}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </div>

        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.url} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-3">
                  {/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(item.name) && (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="font-body text-sm text-foreground truncate flex-1">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={item.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-foreground"
                  />
                  <Button size="sm" variant="secondary" onClick={() => copy(item.url)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
