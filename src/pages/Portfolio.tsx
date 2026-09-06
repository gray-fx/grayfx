import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { usePortfolioBySlug, usePrimaryPortfolio, usePortfolioPhotos } from "@/hooks/use-portfolios";

const Portfolio = () => {
  const { slug } = useParams();
  const bySlug = usePortfolioBySlug(slug);
  const primary = usePrimaryPortfolio();

  const query = slug ? bySlug : primary;
  const portfolio = query.data ?? null;
  const { data: photos, isLoading: photosLoading } = usePortfolioPhotos(portfolio?.id);

  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (portfolio) document.title = `${portfolio.name} — Portfolio | GrayFX`;
  }, [portfolio]);

  const loading = query.isLoading || photosLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-body text-xs uppercase tracking-[0.3em] text-primary">Portfolio</p>
          <h1 className="font-display text-4xl font-bold tracking-tight mt-2">
            {portfolio?.name ?? "Portfolio"}
          </h1>
          {portfolio?.description && (
            <p className="text-muted-foreground font-body text-sm mt-2 max-w-2xl">{portfolio.description}</p>
          )}
        </motion.div>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && !portfolio && (
          <p className="text-muted-foreground font-body text-sm">No portfolio has been set up yet.</p>
        )}

        {!loading && portfolio && (!photos || photos.length === 0) && (
          <p className="text-muted-foreground font-body text-sm">No photos in this portfolio yet.</p>
        )}

        {photos && photos.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {photos.map((p, i) => (
              <motion.figure
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-sm cursor-zoom-in"
                onClick={() => setLightbox(i)}
                style={{ rotate: `${((i % 5) - 2) * 0.4}deg` }}
              >
                <img
                  src={p.image_url}
                  alt={p.caption || portfolio?.name || "Portfolio photo"}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                {p.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-background/90 to-transparent p-4">
                    <p className="font-display text-base text-foreground">{p.caption}</p>
                  </figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && photos?.[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            aria-label="Close"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightbox].image_url}
              alt={photos[lightbox].caption || "Portfolio photo"}
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-sm"
            />
            {photos[lightbox].caption && (
              <figcaption className="text-center font-body text-sm text-muted-foreground mt-4">
                {photos[lightbox].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
