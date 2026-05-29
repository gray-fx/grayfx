import { useState, useEffect } from "react";
import { CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSiteSetting, useUpdateSiteSetting } from "@/hooks/use-site-settings";

interface PayLink {
  label: string;
  url: string;
  handle?: string;
}

const AdminPaymentsTab = () => {
  const { toast } = useToast();
  const { data, isLoading } = useSiteSetting("payment_options");
  const updateSetting = useUpdateSiteSetting();

  const [title, setTitle] = useState("Payment Options");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<PayLink[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (data) {
      const v = (data.value as any) || {};
      setTitle(v.title || "Payment Options");
      setDescription(v.description || "");
      setLinks(Array.isArray(v.links) ? v.links : []);
      setActive(data.is_active);
    }
  }, [data]);

  const updateLink = (i: number, field: keyof PayLink, val: string) => {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: val } : l)));
  };

  const addLink = () => setLinks((prev) => [...prev, { label: "", url: "", handle: "" }]);
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const save = () => {
    updateSetting.mutate(
      { key: "payment_options", value: { title, description, links }, is_active: active },
      { onSuccess: () => toast({ title: "Payment options updated" }) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Payment Options
        </h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Page Content</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Show button on home</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Payment Links</Label>
            <Button size="sm" variant="outline" onClick={addLink}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>

          {links.map((link, i) => (
            <div key={i} className="rounded-md border border-border bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Link #{i + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => removeLink(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                placeholder="Label (e.g. Venmo)"
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
              />
              <Input
                placeholder="URL (https://...)"
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
              />
              <Input
                placeholder="Handle (optional, e.g. @yourname)"
                value={link.handle || ""}
                onChange={(e) => updateLink(i, "handle", e.target.value)}
              />
            </div>
          ))}
          {links.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No links yet. Click Add to create one.</p>
          )}
        </div>

        <Button onClick={save} disabled={updateSetting.isPending} className="w-full">
          Save Payment Options
        </Button>
      </div>
    </div>
  );
};

export default AdminPaymentsTab;
