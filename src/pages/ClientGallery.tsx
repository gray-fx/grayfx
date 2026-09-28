import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import JSZip from "jszip";
import { ChevronLeft, ChevronRight, Download, Heart, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Photo { id: string; image_url: string; file_name: string; is_favorite: boolean; }
interface GalleryData { locked: boolean; name: string; id?: string; event_date?: string | null; photos?: Photo[]; }

const downloadBlob = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

const downloadOne = async (p: Photo) => {
  const res = await fetch(p.image_url);
  downloadBlob(await res.blob(), p.file_name || "photo.jpg");
};

const ClientGallery = () => {
  const { slug = "" } = useParams();
  const storeKey = `gallery-pw-${slug}`;
  const [data, setData] = useState<GalleryData | null | undefined>(undefined);
  const [pw, setPw] = useState(() => sessionStorage.getItem(storeKey) ?? "");
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [zipping, setZipping] = useState<number | null>(null);
  const [onlyFavs, setOnlyFavs] = useState(false);

  const load = useCallback(async (password: string) => {
    const { data: res } = await supabase.rpc("get_client_gallery", { _slug: slug, _pw: password });
    const g = res as unknown as GalleryData | null;
    setData(g);
    return g;
  }, [slug]);

  useEffect(() => { load(pw); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = await load(input);
    if (g && !g.locked) {
      sessionStorage.setItem(storeKey, input);
      setPw(input);
      setWrong(false);
    } else setWrong(true);
  };

  const photos = data?.photos ?? [];
  const shown = onlyFavs ? photos.filter((p) => p.is_favorite) : photos;

  const toggleFav = async (p: Photo) => {
    const next = !p.is_favorite;
    setData((d) => d && { ...d, photos: d.photos?.map((x) => (x.id === p.id ? { ...x, is_favorite: next } : x)) });
    await supabase.rpc("set_client_favorite", { _slug: slug, _pw: pw, _photo_id: p.id, _fav: next });
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const list = shown;
    setZipping(0);
    const used = new Set<string>();
    let done = 0;
    const queue = [...list];
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift()!;
        let n = p.file_name || `${p.id}.jpg`;
        while (used.has(n)) n = `1_${n}`;
        used.add(n);
        const blob = await (await fetch(p.image_url)).blob();
        zip.file(n, blob);
        setZipping(++done);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    const out = await zip.generateAsync({ type: "blob", compression: "STORE" });
    downloadBlob(out, `${data?.name ?? "gallery"}${onlyFavs ? " - favorites" : ""}.zip`);
    setZipping(null);
  };

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % shown.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + shown.length) % shown.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shown.length]);

  if (data === undefined) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (data === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">Gallery not found.</div>;
  }
  if (data.locked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <form onSubmit={unlock} className="w-full max-w-sm space-y-4 text-center">
          <Lock className="mx-auto h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">{data.name}</h1>
          <p className="text-sm text-muted-foreground font-body">Enter the password to view this gallery.</p>
          <Input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Password" autoFocus />
          {wrong && <p className="text-sm text-destructive font-body">Incorrect password.</p>}
          <Button type="submit" className="w-full">View gallery</Button>
        </form>
      </div>
    );
  }

  const cur = open !== null ? shown[open] : null;
  const favCount = photos.filter((p) => p.is_favorite).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="text-center px-6 pt-20 pb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-body mb-3">GrayFX</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">{data.name}</h1>
        {data.event_date && (
          <p className="mt-3 text-sm text-muted-foreground font-body">
            {new Date(data.event_date + "T00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </header>

      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            <Button size="sm" variant={onlyFavs ? "ghost" : "secondary"} onClick={() => setOnlyFavs(false)}>All ({photos.length})</Button>
            <Button size="sm" variant={onlyFavs ? "secondary" : "ghost"} onClick={() => setOnlyFavs(true)}>
              <Heart className="h-4 w-4 mr-1" />Favorites ({favCount})
            </Button>
          </div>
          <Button size="sm" onClick={downloadAll} disabled={zipping !== null || shown.length === 0}>
            {zipping !== null ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{zipping}/{shown.length}</> : <><Download className="h-4 w-4 mr-2" />Download all</>}
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {shown.length === 0 && <p className="text-center text-muted-foreground font-body py-20">{onlyFavs ? "Tap the heart on photos to add favorites." : "No photos yet."}</p>}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 sm:gap-3">
          {shown.map((p, i) => (
            <div key={p.id} className="relative group mb-2 sm:mb-3 break-inside-avoid overflow-hidden cursor-zoom-in" onClick={() => setOpen(i)}>
              <img src={p.image_url} alt={p.file_name} loading="lazy" className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute inset-x-0 bottom-0 p-2 flex justify-end gap-1 bg-gradient-to-t from-background/70 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button aria-label="Favorite" onClick={(e) => { e.stopPropagation(); toggleFav(p); }} className="p-1.5">
                  <Heart className={`h-5 w-5 ${p.is_favorite ? "fill-primary text-primary" : "text-foreground"}`} />
                </button>
                <button aria-label="Download" onClick={(e) => { e.stopPropagation(); downloadOne(p); }} className="p-1.5">
                  <Download className="h-5 w-5 text-foreground" />
                </button>
              </div>
              {p.is_favorite && <Heart className="absolute top-2 right-2 h-4 w-4 fill-primary text-primary sm:group-hover:opacity-0" />}
            </div>
          ))}
        </div>
      </main>

      {cur && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center" onClick={() => setOpen(null)}>
          <img src={cur.image_url} alt={cur.file_name} className="max-w-[92vw] max-h-[86vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-3 right-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" onClick={() => toggleFav(cur)} aria-label="Favorite">
              <Heart className={`h-5 w-5 ${cur.is_favorite ? "fill-primary text-primary" : ""}`} />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => downloadOne(cur)} aria-label="Download"><Download className="h-5 w-5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setOpen(null)} aria-label="Close"><X className="h-5 w-5" /></Button>
          </div>
          <button aria-label="Previous" className="absolute left-2 sm:left-6 p-3" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + shown.length) % shown.length); }}>
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button aria-label="Next" className="absolute right-2 sm:right-6 p-3" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % shown.length); }}>
            <ChevronRight className="h-8 w-8" />
          </button>
          <p className="absolute bottom-4 text-xs text-muted-foreground font-body">{open! + 1} / {shown.length}</p>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
