import { useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSiteSetting, useUpdateSiteSetting } from "@/hooks/use-site-settings";

const SECTIONS = [
  { id: "gallery", label: "Gallery / My Work" },
  { id: "booking", label: "Booking Form" },
  { id: "availability", label: "Availability Calendar" },
  { id: "contact", label: "Contact Section" },
];

const AdminMaintenanceTab = () => {
  const { toast } = useToast();
  const { data: maintenance, isLoading } = useSiteSetting("maintenance_mode");
  const updateSetting = useUpdateSiteSetting();

  const [isActive, setIsActive] = useState(false);
  const [lockedSections, setLockedSections] = useState<string[]>([]);

  useEffect(() => {
    if (maintenance) {
      setIsActive(maintenance.is_active);
      setLockedSections((maintenance.value as any)?.locked_sections || []);
    }
  }, [maintenance]);

  const toggleSection = (sectionId: string) => {
    setLockedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const save = () => {
    updateSetting.mutate(
      {
        key: "maintenance_mode",
        value: { locked_sections: lockedSections },
        is_active: isActive,
      },
      { onSuccess: () => toast({ title: "Maintenance settings saved" }) }
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
        <Shield className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Maintenance Mode
        </h2>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-foreground">Enable Maintenance</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Locked sections will show an "Under Maintenance" overlay to visitors.
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="space-y-3">
          <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
            Sections to Lock
          </Label>
          {SECTIONS.map((section) => (
            <div key={section.id} className="flex items-center gap-3">
              <Checkbox
                id={section.id}
                checked={lockedSections.includes(section.id)}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <label
                htmlFor={section.id}
                className="font-body text-sm text-foreground cursor-pointer"
              >
                {section.label}
              </label>
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={updateSetting.isPending} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminMaintenanceTab;
