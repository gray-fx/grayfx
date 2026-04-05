import { useState, useEffect } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSiteSetting, useUpdateSiteSetting } from "@/hooks/use-site-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminAnnouncementsTab = () => {
  const { toast } = useToast();
  const { data: banner, isLoading: bannerLoading } = useSiteSetting("announcement_banner");
  const { data: popup, isLoading: popupLoading } = useSiteSetting("announcement_popup");
  const updateSetting = useUpdateSiteSetting();

  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerType, setBannerType] = useState("info");
  const [bannerActive, setBannerActive] = useState(false);

  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [popupActive, setPopupActive] = useState(false);

  useEffect(() => {
    if (banner) {
      setBannerMessage((banner.value as any)?.message || "");
      setBannerType((banner.value as any)?.type || "info");
      setBannerActive(banner.is_active);
    }
  }, [banner]);

  useEffect(() => {
    if (popup) {
      setPopupTitle((popup.value as any)?.title || "");
      setPopupMessage((popup.value as any)?.message || "");
      setPopupType((popup.value as any)?.type || "info");
      setPopupActive(popup.is_active);
    }
  }, [popup]);

  const saveBanner = () => {
    updateSetting.mutate(
      { key: "announcement_banner", value: { message: bannerMessage, type: bannerType }, is_active: bannerActive },
      { onSuccess: () => toast({ title: "Banner updated" }) }
    );
  };

  const savePopup = () => {
    updateSetting.mutate(
      { key: "announcement_popup", value: { title: popupTitle, message: popupMessage, type: popupType }, is_active: popupActive },
      { onSuccess: () => toast({ title: "Popup updated" }) }
    );
  };

  if (bannerLoading || popupLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <Megaphone className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Announcements
        </h2>
      </div>

      {/* Banner */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Top Banner</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Active</Label>
            <Switch checked={bannerActive} onCheckedChange={setBannerActive} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
            <Input value={bannerMessage} onChange={(e) => setBannerMessage(e.target.value)} placeholder="e.g. Holiday special — 20% off!" />
          </div>
          <div className="space-y-1">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
            <Select value={bannerType} onValueChange={setBannerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={saveBanner} disabled={updateSetting.isPending} className="w-full">
          Save Banner
        </Button>
      </div>

      {/* Popup */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Popup / Modal</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Active</Label>
            <Switch checked={popupActive} onCheckedChange={setPopupActive} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} placeholder="e.g. Important Notice" />
          </div>
          <div className="space-y-1">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
            <Textarea value={popupMessage} onChange={(e) => setPopupMessage(e.target.value)} placeholder="Full announcement message..." rows={3} />
          </div>
          <div className="space-y-1">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
            <Select value={popupType} onValueChange={setPopupType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={savePopup} disabled={updateSetting.isPending} className="w-full">
          Save Popup
        </Button>
      </div>
    </div>
  );
};

export default AdminAnnouncementsTab;
