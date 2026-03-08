import { Instagram, Facebook, Twitter, Mail, Camera, ExternalLink } from "lucide-react";
import heroBg1 from "@/assets/hero-bg-1.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Twitter, label: "X / Twitter", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:hello@example.com" },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background images with crossfade */}
      {[heroBg1, heroBg2, heroBg3].map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${src})`,
            filter: "blur(4px) brightness(0.3)",
            transform: "scale(1.05)",
            animation: `bg-crossfade${i === 0 ? "" : `-${i + 1}`} 15s ease-in-out infinite`,
            opacity: i === 0 ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/60" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Logo / Camera icon */}
        <div className="animate-fade-slide-up mb-6">
          <Camera className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>

        {/* Name */}
        <h1 className="animate-fade-slide-up-delay-1 font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl">
          Your Name
        </h1>

        {/* Tagline */}
        <p className="animate-fade-slide-up-delay-1 mt-4 max-w-md font-body text-lg font-light tracking-widest uppercase text-muted-foreground">
          Photographer · Newark, Delaware
        </p>

        {/* Portfolio Buttons */}
        <div className="animate-fade-slide-up-delay-2 mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <span>View Portfolio</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/50 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-foreground transition-all hover:border-primary hover:text-primary"
          >
            <span>Book a Session</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Social Links */}
        <div className="animate-fade-slide-up-delay-3 mt-14 flex items-center gap-6">
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
        </div>

        {/* Bottom subtle text */}
        <p className="animate-fade-slide-up-delay-3 mt-8 font-body text-xs tracking-widest text-muted-foreground/50 uppercase">
          © 2026 · All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default Index;
