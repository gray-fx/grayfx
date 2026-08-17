import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Loader2, RefreshCw, Pencil, Save, Upload, X } from "lucide-react";
import mammoth from "mammoth";
import PanelLayout from "./PanelLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Section = { id: string; title: string; level: 1 | 2 };

function slugify(text: string, seen: Set<string>) {
  let base = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
  let id = base, i = 2;
  while (seen.has(id)) { id = `${base}-${i++}`; }
  seen.add(id);
  return id;
}

/** Walks the rendered HTML and stamps ids on H1/H2 so "jump to section" works. */
function buildSections(container: HTMLElement): Section[] {
  const seen = new Set<string>();
  const nodes = Array.from(container.querySelectorAll("h1, h2"));
  return nodes.map((el) => {
    const level = el.tagName === "H1" ? 1 : 2;
    const title = el.textContent?.trim() || "Untitled";
    const id = slugify(title, seen);
    el.id = id;
    return { id, title, level: level as 1 | 2 };
  });
}

const PanelStaffGuide = () => {
  const { toast } = useToast();
  const [html, setHtml] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedByTag, setUpdatedByTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftHtml, setDraftHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff_guide")
        .select("content_html, updated_at, updated_by_tag")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;

      setHtml(data?.content_html ?? "");
      setUpdatedAt(data?.updated_at ?? null);
      setUpdatedByTag(data?.updated_by_tag ?? null);

      // Try an UPDATE with no real change to probe whether RLS allows it
      // for this user, i.e. whether they're staff. Harmless no-op write.
      const { error: probeErr } = await supabase
        .from("staff_guide")
        .update({ content_html: data?.content_html ?? "" })
        .eq("id", 1);
      setCanEdit(!probeErr);
    } catch (e) {
      toast({ title: "Could not load the staff guide", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && html && contentRef.current) {
      const s = buildSections(contentRef.current);
      setSections(s);
      if (s.length && !activeId) setActiveId(s[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, html]);

  const jumpTo = (id: string) => {
    setActiveId(id);
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const lastUpdatedLabel = useMemo(
    () => (updatedAt ? new Date(updatedAt).toLocaleString() : null),
    [updatedAt],
  );

  const startEditing = () => {
    setDraftHtml(html);
    setEditing(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = html; }, 0);
  };

  const cancelEditing = () => setEditing(false);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const save = async () => {
    setSaving(true);
    try {
      const content = editorRef.current?.innerHTML ?? draftHtml;
      const { data: userData } = await supabase.auth.getUser();
      const appMeta = (userData.user?.app_metadata ?? {}) as Record<string, any>;

      const { error } = await supabase
        .from("staff_guide")
        .update({
          content_html: content,
          updated_at: new Date().toISOString(),
          updated_by_discord_id: appMeta.discord_id ?? null,
          updated_by_tag: appMeta.discord_tag ?? null,
        })
        .eq("id", 1);
      if (error) throw error;

      setHtml(content);
      setEditing(false);
      toast({ title: "Staff guide saved" });
      await load();
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const importDocx = async (file: File) => {
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (editorRef.current) {
        editorRef.current.innerHTML = result.value;
      }
      setDraftHtml(result.value);
      if (result.messages?.length) {
        console.warn("mammoth import warnings", result.messages);
      }
      toast({ title: "Document imported", description: "Review the content, then click Save." });
    } catch (e) {
      toast({ title: "Could not import .docx", description: (e as Error).message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <PanelLayout title="Staff Guide">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Staff Guide
            </h2>
            <div className="flex items-center gap-3">
              {lastUpdatedLabel && (
                <span className="font-body text-xs text-muted-foreground">
                  Last updated {lastUpdatedLabel}{updatedByTag ? ` by ${updatedByTag}` : ""}
                </span>
              )}
              {!editing && (
                <>
                  <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                  </Button>
                  {canEdit && (
                    <Button size="sm" onClick={startEditing}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  )}
                </>
              )}
              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) importDocx(f); }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                    {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Import .docx
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {!editing && sections.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-body text-xs uppercase tracking-widest text-muted-foreground shrink-0">
                Jump to section
              </span>
              <Select value={activeId} onValueChange={jumpTo}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="Table of contents" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.level === 2 ? <span className="pl-4">{s.title}</span> : s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editing && (
            <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("formatBlock", "H1")}>H1</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("formatBlock", "H2")}>H2</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("formatBlock", "H3")}>H3</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("formatBlock", "P")}>P</Button>
              <span className="w-px h-5 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" className="font-bold" onClick={() => exec("bold")}>B</Button>
              <Button type="button" variant="ghost" size="sm" className="italic" onClick={() => exec("italic")}>I</Button>
              <Button type="button" variant="ghost" size="sm" className="underline" onClick={() => exec("underline")}>U</Button>
              <span className="w-px h-5 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}>• List</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("insertOrderedList")}>1. List</Button>
              <span className="w-px h-5 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                const url = window.prompt("Link URL");
                if (url) exec("createLink", url);
              }}>Link</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                const url = window.prompt("Image URL");
                if (url) exec("insertImage", url);
              }}>Image</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                exec("insertHTML", "<table><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>");
              }}>Table</Button>
              <span className="w-px h-5 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("undo")}>Undo</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => exec("redo")}>Redo</Button>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : editing ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="staff-guide-content font-body text-sm leading-relaxed max-w-none min-h-[300px] outline-none [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_img]:max-w-full [&_img]:rounded-md"
            />
          ) : html ? (
            <div
              ref={contentRef}
              className="staff-guide-content font-body text-sm leading-relaxed max-w-none [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:scroll-mt-24 [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_img]:max-w-full [&_img]:rounded-md"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="font-body text-sm text-muted-foreground text-center py-10">
              {canEdit ? 'No staff guide content yet. Click "Edit" to write one or import a .docx.' : "No staff guide content yet."}
            </p>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default PanelStaffGuide;
