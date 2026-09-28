import { useCallback, useEffect, useState } from "react";
import { Copy, Heart, Loader2, Plus, Trash2, Upload, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Gallery { id: string; name: string; slug: string; event_date: string | null; password_hash: string; created_at: string; }
interface Photo { id: string; image_url: string; storage_path: string; file_name: string; }

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

export const galleryUrl = (slug: string) => `${window.location.origin}${window.location.pathname}#/gallery/${slug}`;

const AdminGalleriesTab = () => {
  const { toast } = useToast();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selected, setSelected] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [pw, setPw] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const [newPw, setNewPw] = useState("");

  const loadGalleries = useCallback(async () => {
    const { data } = await supabase.from("client_galleries").select("*").order("created_at", { ascending: false });
    setGalleries((data as Gallery[]) ?? []);
  }, []);

  const loadPhotos = useCallback(async (gid: string) => {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("client_gallery_photos").select("*").eq("gallery_id", gid).order("sort_order").order("created_at"),
      supabase.from("client_gallery_favorites").select("photo_id").eq("gallery_id", gid),
    ]);
    setPhotos((p as Photo[]) ?? []);
    setFavs(new Set((f ?? []).map((x) => x.photo_id)));
  }, []);

  useEffect(() => { loadGalleries(); }, [loadGalleries]);
  useEffect(() => { if (selected) loadPhotos(selected.id); }, [selected, loadPhotos]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const slug = `${slugify(name) || "gallery"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("client_galleries")
      .insert({ name: name.trim(), slug, event_date: date || null }).select().single();
    if (error || !data) {
      toast({ title: "Couldn't create gallery", description: error?.message, variant: "destructive" });
    } else {
      if (pw) await supabase.rpc("set_client_gallery_password", { _id: data.id, _pw: pw });
      setName(""); setDate(""); setPw("");
      await loadGalleries();
      setSelected(data as Gallery);
      toast({ title: "Gallery created" });
    }
    setCreating(false);
  };

  const uploadFiles = async (files: File[]) => {
    if (!selected) return;
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setUploading({ done: 0, total: imgs.length });
    let done = 0;
    const base = photos.length;
    const queue = imgs.map((f, i) => ({ f, i }));
    const worker = async () => {
      while (queue.length) {
        const { f, i } = queue.shift()!;
        const ext = f.name.split(".").pop() || "jpg";
        const path = `galleries/${selected.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("uploads").upload(path, f, { contentType: f.type });
        if (!error) {
          const { data } = supabase.storage.from("uploads").getPublicUrl(path);
          await supabase.from("client_gallery_photos").insert({
            gallery_id: selected.id, image_url: data.publicUrl, storage_path: path, file_name: f.name, sort_order: base + i,
          });
        }
        done++;
        setUploading({ done, total: imgs.length });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setUploading(null);
    loadPhotos(selected.id);
    toast({ title: `Uploaded ${done} photo${done === 1 ? "" : "s"}` });
  };

  const deletePhoto = async (p: Photo) => {
    if (p.storage_path) await supabase.storage.from("uploads").remove([p.storage_path]);
    await supabase.from("client_gallery_photos").delete().eq("id", p.id);
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
  };

  const deleteGallery = async (g: Gallery) => {
    if (!confirm(`Delete "${g.name}" and all its photos?`)) return;
    const { data } = await supabase.from("client_gallery_photos").select("storage_path").eq("gallery_id", g.id);
    const paths = (data ?? []).map((d) => d.storage_path).filter(Boolean);
    for (let i = 0; i < paths.length; i += 100) await supabase.storage.from("uploads").remove(paths.slice(i, i + 100));
    await supabase.from("client_galleries").delete().eq("id", g.id);
    setSelected(null);
    loadGalleries();
  };

  const savePw = async () => {
    if (!selected) return;
    await supabase.rpc("set_client_gallery_password", { _id: selected.id, _pw: newPw });
    setNewPw("");
    await loadGalleries();
    const { data } = await supabase.from("client_galleries").select("*").eq("id", selected.id).single();
    if (data) setSelected(data as Gallery);
    toast({ title: newPw ? "Password set" : "Password removed" });
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(galleryUrl(slug));
    toast({ title: "Link copied" });
  };

  if (selected) {
    const favPhotos = photos.filter((p) => favs.has(p.id));
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground font-body">← All galleries</button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{selected.name}</h2>
            <p className="text-xs text-muted-foreground font-body">
              {selected.event_date ?? "No date"} · {photos.length} photos · {selected.password_hash ? "Password protected" : "No password"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copyLink(selected.slug)}><Copy className="h-4 w-4 mr-1" />Copy link</Button>
            <Button size="sm" variant="outline" asChild>
              <a href={galleryUrl(selected.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteGallery(selected)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Change password (leave blank to remove)</Label>
            <Input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" />
          </div>
          <Button size="sm" onClick={savePw}><Lock className="h-4 w-4 mr-1" />Save</Button>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(Array.from(e.dataTransfer.files)); }}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-sm p-10 cursor-pointer transition-colors ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-body">Uploading {uploading.done} / {uploading.total}</p>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-primary" />
              <p className="text-sm font-body">Drop full-resolution JPEGs here or click to choose</p>
            </>
          )}
          <input type="file" accept="image/*" multiple className="hidden" disabled={!!uploading}
            onChange={(e) => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </label>

        {favPhotos.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold flex items-center gap-1.5"><Heart className="h-4 w-4 fill-primary text-primary" />Client favorites ({favPhotos.length})</h3>
            <p className="text-xs text-muted-foreground font-body break-all">{favPhotos.map((p) => p.file_name).join(", ")}</p>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(favPhotos.map((p) => p.file_name).join("\n")); toast({ title: "File names copied" }); }}>
              <Copy className="h-4 w-4 mr-1" />Copy file names
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square overflow-hidden rounded-sm bg-muted">
              <img src={p.image_url} alt={p.file_name} loading="lazy" className="w-full h-full object-cover" />
              {favs.has(p.id) && <Heart className="absolute top-1.5 left-1.5 h-4 w-4 fill-primary text-primary" />}
              <button onClick={() => deletePhoto(p)} className="absolute top-1.5 right-1.5 p-1 rounded-sm bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="space-y-3 border border-border rounded-sm p-4">
        <h2 className="font-display text-lg font-bold">New client gallery</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-3">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John & Jane Wedding" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Password (optional)</Label>
            <Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Leave blank for no password" />
          </div>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Create gallery
        </Button>
      </form>

      <div className="space-y-2">
        {galleries.length === 0 && <p className="text-sm text-muted-foreground font-body">No galleries yet.</p>}
        {galleries.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 border border-border rounded-sm p-3 hover:border-primary/50 transition-colors">
            <button className="text-left flex-1" onClick={() => setSelected(g)}>
              <p className="font-display font-semibold">{g.name}</p>
              <p className="text-xs text-muted-foreground font-body">{g.event_date ?? "No date"}{g.password_hash ? " · 🔒" : ""}</p>
            </button>
            <Button size="sm" variant="ghost" onClick={() => copyLink(g.slug)}><Copy className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGalleriesTab;
