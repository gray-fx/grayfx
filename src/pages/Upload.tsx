import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload as UploadIcon, X, FileIcon, Loader2 } from "lucide-react";

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const handleSend = async () => {
    if (files.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const folder = senderName.trim()
        ? `${sanitize(senderName.trim())}-${batchId}`
        : batchId;

      const uploaded: { name: string; size: number; path: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
        const path = `${folder}/${sanitize(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (upErr) throw upErr;
        uploaded.push({ name: file.name, size: file.size, path });
      }

      setProgress("Sending notification…");
      const { error: notifyErr } = await supabase.functions.invoke(
        "send-file-email",
        {
          body: {
            sender: senderName.trim() || "Anonymous",
            folder,
            files: uploaded,
          },
        }
      );
      if (notifyErr) console.error("notify error:", notifyErr);

      toast({ title: "Files uploaded successfully!" });
      setFiles([]);
      setSenderName("");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Upload &amp; Send Files
        </h1>

        <Input
          placeholder="Your name (optional)"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          disabled={sending}
        />

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <UploadIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Click or drag files here
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2"
              >
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">
                  {f.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatSize(f.size)}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-right">
              Total: {formatSize(totalSize)}
            </p>
          </div>
        )}

        {progress && (
          <p className="text-sm text-center text-muted-foreground">{progress}</p>
        )}

        <Button
          onClick={handleSend}
          disabled={sending || files.length === 0}
          className="w-full"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
