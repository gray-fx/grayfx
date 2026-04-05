import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, LogIn, LogOut, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useAvailability,
  useToggleAvailability,
  useDeleteAvailability,
} from "@/hooks/use-availability";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Session } from "@supabase/supabase-js";

const AdminAvailability = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [note, setNote] = useState("");

  const { data: availability, isLoading } = useAvailability();
  const toggleMutation = useToggleAvailability();
  const deleteMutation = useDeleteAvailability();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setAuthLoading(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const fakeEmail = `${username}@grayfx.admin`;
    // Try sign in first, if fails try sign up (first-time setup)
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password });
      if (signUpError) {
        toast({ title: "Login failed", description: signUpError.message, variant: "destructive" });
      }
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const availableDates = new Set(
    availability?.filter((a) => a.is_available).map((a) => a.date) ?? []
  );
  const unavailableDates = new Set(
    availability?.filter((a) => !a.is_available).map((a) => a.date) ?? []
  );

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedInfo = selectedDateStr
    ? availability?.find((a) => a.date === selectedDateStr)
    : null;

  const setAvailable = () => {
    if (!selectedDateStr) return;
    toggleMutation.mutate(
      { date: selectedDateStr, is_available: true, note },
      {
        onSuccess: () => {
          toast({ title: "Marked available" });
          setNote("");
        },
      }
    );
  };

  const setUnavailable = () => {
    if (!selectedDateStr) return;
    toggleMutation.mutate(
      { date: selectedDateStr, is_available: false, note },
      {
        onSuccess: () => {
          toast({ title: "Marked unavailable" });
          setNote("");
        },
      }
    );
  };

  const clearDate = () => {
    if (!selectedDateStr) return;
    deleteMutation.mutate(selectedDateStr, {
      onSuccess: () => {
        toast({ title: "Availability cleared" });
        setNote("");
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-primary mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
            <p className="mt-2 text-sm text-muted-foreground font-body">Sign in to manage your availability</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} type="text" required />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <Button type="submit" disabled={loginLoading} className="w-full">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
              Sign In
            </Button>
          </form>
          <div className="text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground font-body">← Back to site</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="font-display text-3xl font-bold tracking-tight">Manage Availability</h1>
          </div>
          <p className="text-muted-foreground font-body text-sm">
            Click a date, then mark it as available or unavailable.
          </p>
        </motion.div>

        <div className="flex flex-col items-center">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <div className="rounded-lg border border-border bg-card p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    const info = d
                      ? availability?.find((a) => a.date === format(d, "yyyy-MM-dd"))
                      : null;
                    setNote(info?.note || "");
                  }}
                  className={cn("p-3 pointer-events-auto")}
                  modifiers={{
                    available: (date) => availableDates.has(format(date, "yyyy-MM-dd")),
                    unavailable: (date) => unavailableDates.has(format(date, "yyyy-MM-dd")),
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
              <div className="flex items-center gap-6 mt-4 font-body text-xs uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500/40 border border-green-500" />
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500" />
                  Unavailable
                </div>
              </div>

              {/* Controls */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 w-full rounded-lg border border-border bg-card p-5 space-y-4"
                >
                  <p className="font-display font-semibold text-foreground text-center">
                    {format(selectedDate, "MMMM d, yyyy")}
                    {selectedInfo && (
                      <span
                        className={cn(
                          "ml-2 text-xs font-medium",
                          selectedInfo.is_available ? "text-green-400" : "text-red-400"
                        )}
                      >
                        ({selectedInfo.is_available ? "Available" : "Unavailable"})
                      </span>
                    )}
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
                      disabled={toggleMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Available
                    </Button>
                    <Button
                      onClick={setUnavailable}
                      disabled={toggleMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      Unavailable
                    </Button>
                    <Button
                      onClick={clearDate}
                      disabled={deleteMutation.isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAvailability;
