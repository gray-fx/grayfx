import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Loader2, RefreshCw } from "lucide-react";
import PanelLayout from "./PanelLayout";
import { callPanel } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Section = { id: string; title: string; level: 1 | 2 };

type StaffGuideResponse = {
  html?: string;
  sections?: Section[];
  fetchedAt?: string;
};

const PanelStaffGuide = () => {
  const { toast } = useToast();
  const [html, setHtml] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callPanel<StaffGuideResponse>("staff-guide");
      setHtml(res?.html ?? "");
      setSections(res?.sections ?? []);
      setFetchedAt(res?.fetchedAt ?? null);
      if (res?.sections?.length) setActiveId(res.sections[0].id);
    } catch (e) {
      toast({ title: "Could not load the staff guide", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const jumpTo = (id: string) => {
    setActiveId(id);
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const lastUpdatedLabel = useMemo(
    () => (fetchedAt ? new Date(fetchedAt).toLocaleString() : null),
    [fetchedAt],
  );

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
                  Synced from Google Docs · {lastUpdatedLabel}
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>

          {sections.length > 0 && (
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
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : html ? (
            <div
              ref={contentRef}
              className="staff-guide-content font-body text-sm leading-relaxed max-w-none [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:scroll-mt-24 [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_img]:max-w-full [&_img]:rounded-md"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="font-body text-sm text-muted-foreground text-center py-10">
              No staff guide content yet.
            </p>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default PanelStaffGuide;
