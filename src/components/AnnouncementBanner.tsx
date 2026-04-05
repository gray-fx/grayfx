import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useSiteSetting } from "@/hooks/use-site-settings";
import { cn } from "@/lib/utils";

const typeStyles = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  success: "bg-green-500/10 text-green-500 border-green-500/20",
};

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

const AnnouncementBanner = () => {
  const { data: banner } = useSiteSetting("announcement_banner");
  const [dismissed, setDismissed] = useState(false);

  if (!banner?.is_active || dismissed) return null;

  const message = (banner.value as any)?.message;
  const type = ((banner.value as any)?.type || "info") as keyof typeof typeStyles;
  if (!message) return null;

  const Icon = typeIcons[type] || Info;

  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50 border-b px-4 py-2.5", typeStyles[type])}>
      <div className="mx-auto max-w-5xl flex items-center justify-center gap-2 relative">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <p className="font-body text-sm font-medium text-center">{message}</p>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-0 p-1 hover:opacity-70 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
