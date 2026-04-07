import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload as UploadIcon, X, FileIcon, Loader2 } from "lucide-react";

const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total (Resend limit)

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
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

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data:...;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSend = async () => {
    if (files.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({ title: "Total size exceeds 25 MB limit", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const attachments = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          content: await fileToBase64(f),
        }))
      );

      const { data, error } = await supabase.functions.invoke("send-file-email", {
        body: { attachments },
      });

      if (error) throw error;

      toast({ title: "Files sent successfully!" });
      setFiles([]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to send files", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-foreground">Upload &amp; Send Files</h1>

        {/* Drop zone */}
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
          <p className="text-muted-foreground text-sm">Click or drag files here</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-right">
              Total: {formatSize(totalSize)} / 25 MB
            </p>
          </div>
        )}

        <Button onClick={handleSend} disabled={sending || files.length === 0} className="w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
