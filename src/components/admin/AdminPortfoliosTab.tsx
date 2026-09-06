import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, Star, Check, X, Pencil, ExternalLink } from "lucide-react";
import {
  usePortfolios,
  usePortfolioPhotos,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
  useAddPortfolioPhotos,
  useUpdatePortfolioPhoto,
  useDeletePortfolioPhoto,
  uploadPortfolioImage,
} from "@/hooks/use-portfolios";

const AdminPortfoliosTab = () => {
  const { toast } = useToast();
  const { data: portfolios, isLoading } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const deletePortfolio = useDeletePortfolio();
  const addPhotos = useAddPortfolioPhotos();
  const updatePhoto = useUpdatePortfolioPhoto();
  const deletePhoto = useDeletePortfolioPhoto();

  const [newName, setNewName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedId && portfolios && portfolios.length > 0) {
      setSelectedId(portfolios.find((p) => p.is_primary)?.id ?? portfolios[0].id);
    }
  }, [portfolios, selectedId]);

  const selected = portfolios?.find((p) => p.id === selectedId) ?? null;
  const { data: photos } = usePortfolioPhotos(selected?.id);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Give the portfolio a name", variant: "destructive" });
      return;
    }
    try {
      const created = await createPortfolio.mutateAsync({
        name: newName.trim(),
        is_primary: !portfolios || portfolios.length === 0,
      });
      setNewName("");
      setSelectedId(created.id);
      toast({ title: "Portfolio created" });
    } catch (err: any) {
      toast({ title: "Could not create", description: err.message, variant: "destructive" });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await updatePortfolio.mutateAsync({ id, is_primary: true });
      toast({ title: "Set as primary" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await deletePortfolio.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      toast({ title: "Portfolio deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    const files = Array.from(fileRef.current?.files ?? []);
    if (!selected || files.length === 0) {
      toast({ title: "Pick a portfolio and at least one image", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const start = photos?.length ?? 0;
      const rows = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadPortfolioImage(files[i]);
        rows.push({ portfolio_id: selected.id, image_url: url, caption: "", sort_order: start + i });
      }
      await addPhotos.mutateAsync(rows);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: `Added ${rows.length} photo${rows.length > 1 ? "s" : ""}` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveCaption = async () => {
    if (!editingId) return;
    try {
      await updatePhoto.mutateAsync({ id: editingId, caption: editCaption });
      setEditingId(null);
      toast({ title: "Caption saved" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 p-4 border border-border rounded-lg">
        <h3 className="font-display text-lg font-semibold text-foreground">New Portfolio</h3>
        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Fall 2026 Football" />
          <Button onClick={handleCreate} disabled={createPortfolio.isPending} size="sm">
            {createPortfolio.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {portfolios && portfolios.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground">Portfolios</h3>
          <div className="space-y-2">
            {portfolios.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                  selectedId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.name}
                    {p.is_primary && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">Primary</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">/#/portfolio/{p.slug}</p>
                </div>
                <a
                  href={`#/portfolio/${p.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Open portfolio"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {!p.is_primary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(p.id);
                    }}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePortfolio(p.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <h3 className="font-display text-lg font-semibold text-foreground">Add Photos to “{selected.name}”</h3>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Images</Label>
              <input ref={fileRef} type="file" accept="image/*" multiple className="text-sm text-foreground block" />
            </div>
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload
            </Button>
          </div>

          {photos && photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((ph) => (
                <div key={ph.id} className="relative group rounded-md overflow-hidden border border-border">
                  <img src={ph.image_url} alt={ph.caption} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-2">
                    {editingId === ph.id ? (
                      <div className="space-y-1">
                        <Input
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Caption"
                          className="h-7 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={saveCaption}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground truncate">{ph.caption || "No caption"}</p>
                    )}
                  </div>
                  {editingId !== ph.id && (
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingId(ph.id);
                          setEditCaption(ph.caption);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0"
                        onClick={() => deletePhoto.mutate(ph.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPortfoliosTab;
