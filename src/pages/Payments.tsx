import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSetting } from "@/hooks/use-site-settings";

const Payments = () => {
  const { data, isLoading } = useSiteSetting("payment_options");
  const value = (data?.value as any) || {};
  const title: string = value.title || "Payment Options";
  const description: string = value.description || "";
  const links: { label: string; url: string; handle?: string }[] = value.links || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <CreditCard className="h-10 w-10 text-primary mb-6" strokeWidth={1.5} />
          <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-3 font-body text-muted-foreground">{description}</p>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {links.length === 0 && (
              <p className="text-sm text-muted-foreground font-body">No payment options configured yet.</p>
            )}
            {links.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center justify-between rounded-sm border border-border bg-card/50 px-5 py-4 transition-all hover:border-primary hover:bg-primary/5"
              >
                <div>
                  <p className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </p>
                  {link.handle && (
                    <p className="font-body text-xs text-muted-foreground mt-0.5">{link.handle}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
