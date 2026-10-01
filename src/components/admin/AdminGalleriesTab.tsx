import { useCallback, useEffect, useState } from "react";
import exifr from "exifr";
import { Copy, Heart, Loader2, Plus, Trash2, Upload, ExternalLink, Lock, Link2, Eye, EyeOff, Image as CoverIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Gallery { id: string; name: string; slug: string; event_date: string | null; password_hash: string; created_at: string; is_visible: boolean; cover_photo_id: string | null; }
interface Photo { id: string; image_url: string; storage_path: string; file_name: string; taken_at: string | null; }

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
  const [newCode, setNewCode] = useState("");
  const [homepage, setHomepage] = useState({ title: "Client Galleries", intro: "Find your gallery, revisit every moment, and download your favorites in full quality.", logoUrl: "", contactLabel: "Contact", contactUrl: "", footer: "Photography by GrayFX" });
  const [savingHomepage, setSavingHomepage] = useState(false);

  const loadGalleries = useCallback(async () => {
    const { data } = await supabase.from("client_galleries").select("*").order("created_at", { ascending: false });
    setGalleries((data as Gallery[]) ?? []);
  }, []);

  const loadPhotos = useCallback(async (gid: string) => {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("client_gallery_photos").select("*").eq("gallery_id", gid).order("taken_at", { ascending: true, nullsFirst: false }).order("file_name"),
      supabase.from("client_gallery_favorites").select("photo_id").eq("gallery_id", gid),
    ]);
    setPhotos((p as Photo[]) ?? []);
    setFavs(new Set((f ?? []).map((x) => x.photo_id)));
  }, []);

  useEffect(() => {
    loadGalleries();
    supabase.from("site_settings").select("value").eq("key", "gallery_homepage").maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === "object") setHomepage((current) => ({ ...current, ...(data.value as typeof current) }));
    });
  }, [loadGalleries]);
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
        let taken: string | null = null;
        try {
          const meta = await exifr.parse(f, ["DateTimeOriginal", "CreateDate"]);
          const d = meta?.DateTimeOriginal || meta?.CreateDate;
          if (d instanceof Date && !isNaN(d.getTime())) taken = d.toISOString();
        } catch { /* no exif */ }
        if (!taken && f.lastModified) taken = new Date(f.lastModified).toISOString();
        const { error } = await supabase.storage.from("uploads").upload(path, f, { contentType: f.type });
        if (!error) {
          const { data } = supabase.storage.from("uploads").getPublicUrl(path);
          await supabase.from("client_gallery_photos").insert({
            gallery_id: selected.id, image_url: data.publicUrl, storage_path: path, file_name: f.name, sort_order: base + i, taken_at: taken,
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
    if (!confirm(`Remove ${p.file_name || "this photo"} from the gallery?`)) return;
    if (p.storage_path) await supabase.storage.from("uploads").remove([p.storage_path]);
    await supabase.from("client_gallery_favorites").delete().eq("photo_id", p.id);
    await supabase.from("client_gallery_photos").delete().eq("id", p.id);
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
  };

  const saveCode = async () => {
    if (!selected) return;
    const code = slugify(newCode);
    if (!code) return;
    const { error } = await supabase.from("client_galleries").update({ slug: code }).eq("id", selected.id);
    if (error) {
      toast({ title: "Code unavailable", description: error.code === "23505" ? "That code is already used." : error.message, variant: "destructive" });
      return;
    }
    setSelected({ ...selected, slug: code });
    setNewCode("");
    loadGalleries();
    navigator.clipboard.writeText(galleryUrl(code));
    toast({ title: "Link updated & copied", description: galleryUrl(code) });
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

  const updateGallery = async (changes: Partial<Pick<Gallery, "is_visible" | "cover_photo_id">>) => {
    if (!selected) return;
    const { error } = await supabase.from("client_galleries").update(changes).eq("id", selected.id);
    if (error) {
      toast({ title: "Couldn't update gallery", description: error.message, variant: "destructive" });
      return;
    }
    setSelected({ ...selected, ...changes });
    setGalleries((items) => items.map((gallery) => gallery.id === selected.id ? { ...gallery, ...changes } : gallery));
  };

  const saveHomepage = async () => {
    setSavingHomepage(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "gallery_homepage", value: homepage, is_active: true, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSavingHomepage(false);
    toast(error ? { title: "Couldn't save homepage", description: error.message, variant: "destructive" } : { title: "Gallery homepage saved" });
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
            <Label className="text-xs">Link code (current: {selected.slug})</Label>
            <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. justin" />
          </div>
          <Button size="sm" onClick={saveCode}><Link2 className="h-4 w-4 mr-1" />Set code</Button>
        </div>

        <div className="flex items-center justify-between gap-4 border-y border-border py-4">
          <div><Label htmlFor="gallery-visible">Show on gallery homepage</Label><p className="mt-1 text-xs text-muted-foreground">Turning this off keeps the direct link working.</p></div>
          <Switch id="gallery-visible" checked={selected.is_visible} onCheckedChange={(checked) => updateGallery({ is_visible: checked })} />
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
            <div key={p.id} className={`relative group aspect-square overflow-hidden rounded-sm bg-muted ${selected.cover_photo_id === p.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
              <img src={p.image_url} alt={p.file_name} loading="lazy" className="w-full h-full object-cover" />
              {favs.has(p.id) && <Heart className="absolute top-1.5 left-1.5 h-4 w-4 fill-primary text-primary" />}
              <button onClick={() => deletePhoto(p)} title="Remove photo" className="absolute top-1.5 right-1.5 p-1.5 rounded-sm bg-background/80 hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
              <Button type="button" size="icon" variant="secondary" title="Use as gallery cover" onClick={() => updateGallery({ cover_photo_id: p.id })} className="absolute bottom-1.5 right-1.5 h-8 w-8">
                <CoverIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg font-bold">Gallery homepage</h2><p className="text-sm text-muted-foreground">Customize the public page that lists visible client galleries.</p></div>
          <Button variant="outline" size="sm" asChild><a href={`${window.location.origin}${window.location.pathname}#/galleries`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open page</a></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>Heading</Label><Input value={homepage.title} onChange={(e) => setHomepage({ ...homepage, title: e.target.value })} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Introduction</Label><Textarea value={homepage.intro} onChange={(e) => setHomepage({ ...homepage, intro: e.target.value })} /></div>
          <div className="space-y-1"><Label>Logo image URL</Label><Input value={homepage.logoUrl} onChange={(e) => setHomepage({ ...homepage, logoUrl: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-1"><Label>Contact link</Label><Input value={homepage.contactUrl} onChange={(e) => setHomepage({ ...homepage, contactUrl: e.target.value })} placeholder="mailto:you@example.com" /></div>
          <div className="space-y-1"><Label>Contact button label</Label><Input value={homepage.contactLabel} onChange={(e) => setHomepage({ ...homepage, contactLabel: e.target.value })} /></div>
          <div className="space-y-1"><Label>Footer text</Label><Input value={homepage.footer} onChange={(e) => setHomepage({ ...homepage, footer: e.target.value })} /></div>
        </div>
        <Button onClick={saveHomepage} disabled={savingHomepage}>{savingHomepage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save homepage</Button>
      </section>

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
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">{g.event_date ?? "No date"}{g.password_hash ? " · Password protected" : ""} · {g.is_visible ? <><Eye className="h-3 w-3" /> Public</> : <><EyeOff className="h-3 w-3" /> Hidden</>}</p>
            </button>
            <Button size="sm" variant="ghost" onClick={() => copyLink(g.slug)}><Copy className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGalleriesTab;
