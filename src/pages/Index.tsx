import { Instagram, Camera, Mail, ExternalLink, ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import HeroSlideshow from "@/components/HeroSlideshow";
import ScrollSection from "@/components/ScrollSection";
import GalleryGrid from "@/components/GalleryGrid";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";

const EMAIL = "grayson@grayfx.cam";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/gr4yfx" },
  { icon: Camera, label: "Legacy Pics", href: "https://grayflickz.myportfolio.com/" },
  { icon: Mail, label: "Email", href: `mailto:${EMAIL}` },
];

const navLinks = [
  { label: "Portfolio", href: "#/portfolio" },
  { label: "Book", href: "#/book" },
  { label: "Availability", href: "#/availability" },
  { label: "Payments", href: "#/payments" },
];

const stats = [
  { number: "25,000+", label: "Accounts Reached" },
  { number: "50+", label: "Events Attended" },
  { number: "∞", label: "Possibilities" },
];

const external = (href: string) =>
  href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="font-body text-xs font-medium uppercase tracking-[0.3em] text-primary">{children}</p>
);

const Index = () => {
  return (
    <div className="relative bg-background">
      <AnnouncementBanner />
      <AnnouncementPopup />

      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
            <Camera className="h-5 w-5 text-primary" strokeWidth={1.5} />
            GrayFX
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 sm:flex">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  {...external(href)}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
            <a
              href="#/book"
              className="rounded-full bg-primary px-4 py-1.5 font-body text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Book
            </a>
          </div>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <HeroSlideshow />
        </div>
        {/* Lighter readability overlays: only darken the bottom where the text sits */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent md:from-background/60" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
          <motion.div
            {...fade(0)}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Photographer · Newark, Delaware
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="mt-6 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text font-display text-7xl font-bold leading-[0.9] tracking-tighter text-transparent drop-shadow-lg md:text-9xl"
          >
            GrayFX
          </motion.h1>

          <motion.p
            {...fade(0.25)}
            className="mt-6 max-w-xl font-body text-lg font-light leading-relaxed text-muted-foreground md:text-xl"
          >
            Sports-first photography and graphic design. Portraits, events, cars,
            and everything in between.
          </motion.p>

          <motion.div {...fade(0.4)} className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="https://photos.grayfx.cam/"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-body text-sm font-medium text-primary-foreground transition-all hover:gap-3 hover:opacity-90"
            >
              View Gallery
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="#/book"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-7 py-3.5 font-body text-sm font-medium text-foreground backdrop-blur-md transition-all hover:border-primary hover:text-primary"
            >
              Book With Me
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Mobile-only quick links (desktop has them in the nav) */}
          <motion.div {...fade(0.5)} className="mt-6 flex flex-wrap gap-x-5 gap-y-2 md:hidden">
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} className="font-body text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {label}
              </a>
            ))}
          </motion.div>

          <motion.dl
            {...fade(0.6)}
            className="mt-16 grid grid-cols-3 gap-6 border-t border-border/60 pt-8"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl font-bold text-foreground md:text-4xl">{s.number}</dt>
                <dd className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
                  {s.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="relative px-6 py-32">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_2fr] md:gap-20">
          <ScrollSection>
            <Eyebrow>01 — About</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Behind the lens
            </h2>
          </ScrollSection>

          <ScrollSection delay={0.15}>
            <p className="font-display text-2xl font-light leading-snug text-foreground md:text-3xl">
              I'm Grayson, a photographer and graphic designer based in Delaware.
            </p>
            <p className="mt-6 font-body text-lg leading-relaxed text-muted-foreground">
              I mostly shoot sports, but I'm always open to capturing almost anything:
              portraits, events, landscapes, cars, etc.
            </p>
          </ScrollSection>
        </div>
      </section>

      {/* ===== MY WORK ===== */}
      <MaintenanceOverlay sectionId="gallery">
        <section className="relative bg-card/50 px-6 py-32">
          <div className="mx-auto max-w-6xl">
            <ScrollSection>
              <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <Eyebrow>02 — Work</Eyebrow>
                  <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    Recent captures
                  </h2>
                </div>
                <a
                  href="https://photos.grayfx.cam/"
                  className="group inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  See full portfolio
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </ScrollSection>

            <GalleryGrid />
          </div>
        </section>
      </MaintenanceOverlay>

      {/* ===== CONTACT ===== */}
      <MaintenanceOverlay sectionId="contact">
        <section className="relative px-6 py-32">
          <ScrollSection>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card/60 p-10 text-center md:p-20">
              <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative">
                <Eyebrow>03 — Contact</Eyebrow>
                <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                  Let's make something.
                </h2>
                <p className="mx-auto mt-6 max-w-lg font-body text-lg leading-relaxed text-muted-foreground">
                  Interested in working together? Reach out through any of my socials
                  or drop me an email. I'd love to hear about your vision.
                </p>

                <a
                  href={`mailto:${EMAIL}`}
                  className="group mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-body text-sm font-medium text-primary-foreground transition-all hover:gap-3 hover:opacity-90"
                >
                  Get in Touch
                  <Mail className="h-4 w-4" />
                </a>

                <div className="mt-10 flex justify-center gap-8">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      {...external(href)}
                      className="group flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                      <span className="font-body text-[10px] uppercase tracking-[0.2em]">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ScrollSection>
        </section>
      </MaintenanceOverlay>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground/50">
            © 2026 · All Rights Reserved
          </p>
          <div className="flex gap-6">
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} className="font-body text-xs uppercase tracking-widest text-muted-foreground/60 transition-colors hover:text-primary">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
