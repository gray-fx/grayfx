import { motion } from "framer-motion";
import { Camera, ArrowLeft, Circle, Clock, Pencil, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import photoshoots, { type ShootStatus } from "@/data/photoshoots";

const statusConfig: Record<ShootStatus, { icon: typeof Circle; color: string; bg: string }> = {
  "Not Shot": { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  "Awaiting Edits": { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  "Editing": { icon: Pencil, color: "text-primary", bg: "bg-primary/10" },
  "Completed": { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
};

const Status = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12 font-body text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <Camera className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="font-display text-3xl font-bold tracking-tight">Shoot Status</h1>
          </div>
          <p className="text-muted-foreground font-body text-sm">Current photoshoot queue & progress.</p>
        </motion.div>

        <div className="space-y-3">
          {photoshoots.map((shoot, i) => {
            const config = statusConfig[shoot.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-display font-semibold text-foreground truncate">{shoot.name}</p>
                  {shoot.date && (
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{shoot.date}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {shoot.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Status;
