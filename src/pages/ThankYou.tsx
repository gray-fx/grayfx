import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, Camera, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-body text-sm uppercase tracking-widest">Home</span>
          </Link>
          <Camera className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="mx-auto h-20 w-20 text-primary mb-8" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Thank You For Your Purchase!
          </h1>
          <p className="font-body text-lg text-muted-foreground mb-4 leading-relaxed">
            I really appreciate your support — it means the world. Your payment came through and I'm on it.
          </p>
          <p className="font-body text-muted-foreground mb-10">
            If you have any questions or need to send over details, hit me up on Instagram or email anytime.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://www.instagram.com/gr4yfx"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <Instagram className="h-4 w-4" />
              Message Me
            </a>
            <a
              href="mailto:grayson@grayfx.cam"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-secondary/50 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-foreground transition-all hover:border-primary hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          </div>

          <Link
            to="/"
            className="font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </main>

      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="font-body text-xs tracking-widest text-muted-foreground/50 uppercase">
          © 2026 · All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default ThankYou;
