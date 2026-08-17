import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Loader2, ShieldAlert, BookOpen } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { callPanel, panelUserFromSession, type PanelUser } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/panel", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/panel/staff-guide", label: "Staff Guide", icon: BookOpen, end: true },
];

type Props = { children: React.ReactNode; title: string };

const PanelLayout = ({ children, title }: Props) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [staffState, setStaffState] = useState<"checking" | "ok" | "denied">("checking");
  const [denyReason, setDenyReason] = useState<string>("");
  const [user, setUser] = useState<PanelUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate("/panel/login", { replace: true });
      return;
    }
    setUser(panelUserFromSession(session.user));
    let cancelled = false;
    setStaffState("checking");
    callPanel<{ staff?: boolean; isStaff?: boolean }>("auth-check", { method: "POST" })
      .then((res) => {
        if (cancelled) return;
        const ok = res?.staff ?? res?.isStaff ?? true;
        setStaffState(ok ? "ok" : "denied");
        if (!ok) setDenyReason("You are not listed as staff in this server.");
      })
      .catch((err) => {
        if (cancelled) return;
        setStaffState("denied");
        setDenyReason(err.message);
      });
    return () => { cancelled = true; };
  }, [session, authLoading, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/panel/login", { replace: true });
  };

  if (authLoading || (session && staffState === "checking")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  if (staffState === "denied") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="font-display text-2xl font-bold">Access Denied</h1>
          <p className="font-body text-sm text-muted-foreground">{denyReason}</p>
          <Button variant="secondary" onClick={signOut} className="w-full">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-6 border-b border-border">
          <p className="font-display text-lg font-bold tracking-tight">Mod Panel</p>
          <p className="font-body text-xs text-muted-foreground mt-1">ER:LC moderation</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-1">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={`${user.tag} avatar`} className="h-8 w-8 rounded-full" />
            )}
            <div className="min-w-0">
              <p className="truncate font-body text-sm">{user?.tag}</p>
              <p className="truncate font-body text-[11px] text-muted-foreground">{user?.discordId}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
          <div className="md:hidden flex gap-2">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} aria-label={label}
                className={({ isActive }) => cn("rounded-md p-2", isActive ? "bg-secondary text-primary" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" />
              </NavLink>
            ))}
          </div>
        </header>
        <main className="p-6 max-w-5xl">{children}</main>
      </div>
    </div>
  );
};

export default PanelLayout;
