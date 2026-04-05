import { motion } from "framer-motion";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import { Camera, ArrowLeft, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { useAvailability } from "@/hooks/use-availability";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

const Availability = () => {
  const { data: availability, isLoading } = useAvailability();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const availableDates = new Set(
    availability?.filter((a) => a.is_available).map((a) => a.date) ?? []
  );
  const unavailableDates = new Set(
    availability?.filter((a) => !a.is_available).map((a) => a.date) ?? []
  );

  const selectedInfo = selectedDate
    ? availability?.find((a) => a.date === format(selectedDate, "yyyy-MM-dd"))
    : null;

  return (
    <MaintenanceOverlay sectionId="availability">
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
            <CalendarDays className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="font-display text-3xl font-bold tracking-tight">Availability</h1>
          </div>
          <p className="text-muted-foreground font-body text-sm">
            Check my schedule before booking. Green = available, Red = unavailable.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col items-center"
        >
          {isLoading ? (
            <div className="py-20 text-muted-foreground font-body text-sm">Loading calendar…</div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-card p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className={cn("p-3 pointer-events-auto")}
                  modifiers={{
                    available: (date) =>
                      availableDates.has(format(date, "yyyy-MM-dd")),
                    unavailable: (date) =>
                      unavailableDates.has(format(date, "yyyy-MM-dd")),
                  }}
                  modifiersStyles={{
                    available: {
                      backgroundColor: "hsl(142 71% 45% / 0.2)",
                      color: "hsl(142 71% 45%)",
                      fontWeight: 600,
                    },
                    unavailable: {
                      backgroundColor: "hsl(0 84% 60% / 0.2)",
                      color: "hsl(0 84% 60%)",
                      fontWeight: 600,
                    },
                  }}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-6 font-body text-xs uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500/40 border border-green-500" />
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500" />
                  Unavailable
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-muted border border-border" />
                  Not set
                </div>
              </div>

              {/* Selected date info */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 w-full rounded-lg border border-border bg-card p-4 text-center"
                >
                  <p className="font-display font-semibold text-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                  {selectedInfo ? (
                    <>
                      <p
                        className={cn(
                          "mt-1 font-body text-sm font-medium",
                          selectedInfo.is_available ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {selectedInfo.is_available ? "Available" : "Unavailable"}
                      </p>
                      {selectedInfo.note && (
                        <p className="mt-1 text-xs text-muted-foreground">{selectedInfo.note}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 font-body text-sm text-muted-foreground">No availability set</p>
                  )}

                  {(!selectedInfo || selectedInfo.is_available) && (
                    <Link
                      to="/book"
                      className="mt-4 inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-6 py-2 font-body text-xs font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      Book This Date
                    </Link>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
    </MaintenanceOverlay>
  );
};

export default Availability;
