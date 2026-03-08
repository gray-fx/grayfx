import { Instagram, Facebook, Twitter, Mail, Camera, ExternalLink, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import PhotoCollage from "@/components/PhotoCollage";
import ScrollSection from "@/components/ScrollSection";
import GalleryGrid from "@/components/GalleryGrid";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/gr4yfx" },
  { icon: Camera, label: "Legacy Pics", href: "https://grayflickz.myportfolio.com/" },
  { icon: Mail, label: "Email", href: "mailto:gr4yfx@example.com" },
];

const Index = () => {
  return (
    <div className="relative bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <PhotoCollage />

        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Camera className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl"
          >
            GrayFX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-4 max-w-md font-body text-lg font-light tracking-widest uppercase text-muted-foreground"
          >
            Photographer · Newark, Delaware
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <a
              href="https://grayfx.pixieset.com/"
              className="group inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <span>View Gallery</span>
              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="https://forms.gle/LDo6zU3NHZu224dP9"
              className="group inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/50 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-foreground transition-all hover:border-primary hover:text-primary"
            >
              <span>Book With Me</span>
              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-14 flex items-center gap-6"
          >
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </a>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== BIO SECTION ===== */}
      <section className="relative py-32 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollSection>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mx-auto mb-8 h-px w-24 bg-primary origin-left"
            />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
              About Me
            </h2>
          </ScrollSection>

          <ScrollSection delay={0.2}>
            <p className="mt-8 font-body text-lg leading-relaxed text-muted-foreground">
              Based in Newark, Delaware, I capture the extraordinary in everyday moments. 
              While I specialize in sports photography, my work also spans 
              landscapes, nature, and portraits.
            </p>
            <p className="mt-6 font-body text-lg leading-relaxed text-muted-foreground">
              My approach blends technical skill with a passion for storytelling, 
              ensuring every shot tells a unique story. Whether it’s the intensity 
              of a game, the serenity of a landscape, or the personality in a portrait, 
              I aim to create images that resonate and leave a lasting impression.
            </p>
          </ScrollSection>

          <ScrollSection delay={0.3}>
            <div className="mt-12 flex flex-wrap justify-center gap-8">
              {[
                { number: "25,000+", label: "Accounts Reached" },
                { number: "50+", label: "Events Attended" },
                { number: "∞", label: "Possibilities" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-4xl font-bold text-primary">{stat.number}</p>
                  <p className="mt-1 font-body text-sm uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ===== MY WORK SECTION ===== */}
      <section className="relative py-32 px-6 bg-card/50">
        <div className="mx-auto max-w-6xl">
          <ScrollSection>
            <div className="text-center mb-16">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mx-auto mb-8 h-px w-24 bg-primary origin-left"
              />
              <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
                My Work
              </h2>
              <p className="mt-4 font-body text-muted-foreground tracking-wide">
                A selection of recent captures
              </p>
            </div>
          </ScrollSection>

          <GalleryGrid />

          <ScrollSection delay={0.2}>
            <div className="mt-12 text-center">
              <a
                href="#"
                className="group inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                <span>See Full Portfolio</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ===== CONTACT / FOOTER SECTION ===== */}
      <section className="relative py-32 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollSection>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mx-auto mb-8 h-px w-24 bg-primary origin-left"
            />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
              Let's Connect
            </h2>
            <p className="mt-6 font-body text-lg text-muted-foreground leading-relaxed">
              Interested in working together? Reach out through any of my socials
              or drop me an email. I'd love to hear about your vision.
            </p>
          </ScrollSection>

          <ScrollSection delay={0.2}>
            <div className="mt-10 flex justify-center gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                  <span className="font-body text-xs uppercase tracking-widest">{label}</span>
                </a>
              ))}
            </div>
          </ScrollSection>

          <ScrollSection delay={0.3}>
            <div className="mt-10">
              <a
                href="mailto:hello@example.com"
                className="group inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                <span>Get in Touch</span>
                <Mail className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="font-body text-xs tracking-widest text-muted-foreground/50 uppercase">
          © 2026 · All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default Index;
