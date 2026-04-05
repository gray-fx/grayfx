import { useState, useEffect } from "react";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useSiteSetting } from "@/hooks/use-site-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

const AnnouncementPopup = () => {
  const { data: popup } = useSiteSetting("announcement_popup");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (popup?.is_active) {
      const dismissedKey = `popup_dismissed_${popup.id}`;
      const wasDismissed = sessionStorage.getItem(dismissedKey);
      if (!wasDismissed) setOpen(true);
    }
  }, [popup]);

  if (!popup?.is_active) return null;

  const title = (popup.value as any)?.title;
  const message = (popup.value as any)?.message;
  const type = ((popup.value as any)?.type || "info") as keyof typeof typeIcons;
  if (!title && !message) return null;

  const Icon = typeIcons[type] || Info;

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(`popup_dismissed_${popup.id}`, "true");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <DialogTitle className="font-display">{title || "Announcement"}</DialogTitle>
          </div>
          {message && (
            <DialogDescription className="font-body text-sm mt-2 whitespace-pre-wrap">
              {message}
            </DialogDescription>
          )}
        </DialogHeader>
        <Button onClick={handleClose} className="w-full mt-2">
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
