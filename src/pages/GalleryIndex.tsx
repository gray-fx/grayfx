import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, ImageIcon, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSetting } from "@/hooks/use-site-settings";

type PublicGallery = {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  cover_url: string | null;
};

type HomepageSettings = {
  title?: string;
  intro?: string;
  logoUrl?: string;
  contactLabel?: string;
  contactUrl?: string;
  footer?: string;
};

const PAGE_SIZE = 12;

const GalleryIndex = () => {
  const { data: setting } = useSiteSetting("gallery_homepage");
  const [galleries, setGalleries] = useState<PublicGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const settings = (setting?.value ?? {}) as HomepageSettings;

  useEffect(() => {
    supabase.rpc("get_public_client_galleries").then(({ data }) => {
      setGalleries((Array.isArray(data) ? data : []) as PublicGallery[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (visibleCount >= galleries.length) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, galleries.length));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [galleries.length, visibleCount]);

  const visible = useMemo(() => galleries.slice(0, visibleCount), [galleries, visibleCount]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Home</Link>
          </Button>
          {settings.logoUrl ? <img src={settings.logoUrl} alt="Gallery logo" className="max-h-10 max-w-44 object-contain" /> : <span className="font-display text-sm font-bold uppercase tracking-widest">GrayFX</span>}
          {settings.contactUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={settings.contactUrl}><Mail className="mr-2 h-4 w-4" />{settings.contactLabel || "Contact"}</a>
            </Button>
          ) : <span className="w-20" />}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-8 sm:pt-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Client work</p>
        <h1 className="max-w-4xl font-display text-4xl font-bold sm:text-6xl">{settings.title || "Client Galleries"}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {settings.intro || "Find your gallery, revisit every moment, and download your favorites in full quality."}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((gallery, index) => (
              <Link key={gallery.id} to={`/gallery/${gallery.slug}`} className="group block">
                <div className={`overflow-hidden bg-muted ${index % 5 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
                  {gallery.cover_url ? (
                    <img src={gallery.cover_url} alt="" loading={index < 6 ? "eager" : "lazy"} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-9 w-9 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-border py-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{gallery.name}</h2>
                    {gallery.event_date && <p className="mt-1 text-xs text-muted-foreground">{new Date(`${gallery.event_date}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>}
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-y border-border py-20 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No public galleries are available yet.</p>
          </div>
        )}
      </section>

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground sm:px-8">
        {settings.footer || "Photography by GrayFX"}
      </footer>
    </main>
  );
};

export default GalleryIndex;