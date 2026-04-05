import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAvailability } from "@/hooks/use-availability";
import { useBulkToggleAvailability, useBulkDeleteAvailability } from "@/hooks/use-bulk-availability";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const AdminCalendarTab = () => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [lastClicked, setLastClicked] = useState<Date | null>(null);
  const [note, setNote] = useState("");

  const { data: availability, isLoading } = useAvailability();
  const bulkToggle = useBulkToggleAvailability();
  const bulkDelete = useBulkDeleteAvailability();

  const availableDates = new Set(
    availability?.filter((a) => a.is_available).map((a) => a.date) ?? []
  );
  const unavailableDates = new Set(
    availability?.filter((a) => !a.is_available).map((a) => a.date) ?? []
  );

  const isSelected = useCallback(
    (date: Date) => selectedDates.some((d) => d.getTime() === date.getTime()),
    [selectedDates]
  );

  const handleDayClick = useCallback(
    (day: Date, e: React.MouseEvent) => {
      const dateTime = day.getTime();

      if (e.shiftKey && lastClicked) {
        // Shift-click: select range
        const start = Math.min(lastClicked.getTime(), dateTime);
        const end = Math.max(lastClicked.getTime(), dateTime);
        const rangeDates: Date[] = [];
        for (let t = start; t <= end; t += 86400000) {
          rangeDates.push(new Date(t));
        }
        setSelectedDates((prev) => {
          const existing = new Set(prev.map((d) => d.getTime()));
          const merged = [...prev];
          rangeDates.forEach((d) => {
            if (!existing.has(d.getTime())) merged.push(d);
          });
          return merged;
        });
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd-click: toggle single
        setSelectedDates((prev) =>
          isSelected(day)
            ? prev.filter((d) => d.getTime() !== dateTime)
            : [...prev, day]
        );
      } else {
        // Normal click: select only this
        setSelectedDates([day]);
      }
      setLastClicked(day);
    },
    [lastClicked, isSelected]
  );

  const selectedDateStrs = selectedDates.map((d) => format(d, "yyyy-MM-dd"));

  const setAvailable = () => {
    if (!selectedDateStrs.length) return;
    bulkToggle.mutate(
      { dates: selectedDateStrs, is_available: true, note },
      {
        onSuccess: () => {
          toast({ title: `${selectedDateStrs.length} date(s) marked available` });
          setNote("");
          setSelectedDates([]);
        },
      }
    );
  };

  const setUnavailable = () => {
    if (!selectedDateStrs.length) return;
    bulkToggle.mutate(
      { dates: selectedDateStrs, is_available: false, note },
      {
        onSuccess: () => {
          toast({ title: `${selectedDateStrs.length} date(s) marked unavailable` });
          setNote("");
          setSelectedDates([]);
        },
      }
    );
  };

  const clearDates = () => {
    if (!selectedDateStrs.length) return;
    bulkDelete.mutate(selectedDateStrs, {
      onSuccess: () => {
        toast({ title: `${selectedDateStrs.length} date(s) cleared` });
        setNote("");
        setSelectedDates([]);
      },
    });
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Manage Availability
          </h2>
        </div>
        <p className="text-muted-foreground font-body text-sm">
          Click dates to select. <strong>Shift+click</strong> for range, <strong>Ctrl/Cmd+click</strong> to add individual dates.
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="rounded-lg border border-border bg-card p-4">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={() => {}}
            className={cn("p-3 pointer-events-auto")}
            components={{
              Day: ({ date, ...props }: any) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isAvail = availableDates.has(dateStr);
                const isUnavail = unavailableDates.has(dateStr);
                const isSel = isSelected(date);

                return (
                  <button
                    {...props}
                    onClick={(e: React.MouseEvent) => handleDayClick(date, e)}
                    className={cn(
                      "h-9 w-9 rounded-md text-sm font-normal transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isAvail && !isSel && "bg-green-500/20 text-green-500 font-semibold",
                      isUnavail && !isSel && "bg-red-500/20 text-red-500 font-semibold",
                      isSel && "bg-primary text-primary-foreground font-semibold ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              },
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 font-body text-xs uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500/40 border border-green-500" />
            Available
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500" />
            Unavailable
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary border border-primary" />
            Selected
          </div>
        </div>

        {/* Controls */}
        {selectedDates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-md rounded-lg border border-border bg-card p-5 space-y-4"
          >
            <p className="font-display font-semibold text-foreground text-center">
              {selectedDates.length === 1
                ? format(selectedDates[0], "MMMM d, yyyy")
                : `${selectedDates.length} dates selected`}
            </p>

            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                Note (optional)
              </Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Booked for wedding"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={setAvailable}
                disabled={bulkToggle.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Available
              </Button>
              <Button
                onClick={setUnavailable}
                disabled={bulkToggle.isPending}
                variant="destructive"
                className="flex-1"
              >
                Unavailable
              </Button>
              <Button
                onClick={clearDates}
                disabled={bulkDelete.isPending}
                variant="outline"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminCalendarTab;
