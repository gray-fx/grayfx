import { useSiteSetting } from "@/hooks/use-site-settings";
import { Construction } from "lucide-react";

interface Props {
  sectionId: string;
  children: React.ReactNode;
}

const MaintenanceOverlay = ({ sectionId, children }: Props) => {
  const { data: maintenance } = useSiteSetting("maintenance_mode");

  const isLocked =
    maintenance?.is_active &&
    ((maintenance.value as any)?.locked_sections || []).includes(sectionId);

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-20 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Construction className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-display text-lg font-semibold text-foreground">Under Maintenance</p>
        <p className="font-body text-sm text-muted-foreground mt-1">
          This section is temporarily unavailable. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
