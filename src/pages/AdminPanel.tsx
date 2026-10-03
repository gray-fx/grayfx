import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, LogIn, LogOut, Loader2, Megaphone, Shield, Key, ImageIcon, CreditCard, FolderOpen, Images, PanelLeftClose, Trophy } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

import AdminCalendarTab from "@/components/admin/AdminCalendarTab";
import AdminAnnouncementsTab from "@/components/admin/AdminAnnouncementsTab";
import AdminMaintenanceTab from "@/components/admin/AdminMaintenanceTab";
import AdminCredentialsTab from "@/components/admin/AdminCredentialsTab";
import AdminPhotosTab from "@/components/admin/AdminPhotosTab";
import AdminPaymentsTab from "@/components/admin/AdminPaymentsTab";
import AdminPortfoliosTab from "@/components/admin/AdminPortfoliosTab";
import AdminGalleriesTab from "@/components/admin/AdminGalleriesTab";
import AdminAthleteScraper from "@/components/admin/AdminAthleteScraper";

const AdminPanel = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") || "calendar";

  const navGroups = [
    { label: "Schedule", items: [{ value: "calendar", label: "Availability", icon: CalendarDays }] },
    { label: "Galleries", items: [
      { value: "galleries", label: "Client galleries", icon: Images },
      { value: "portfolios", label: "Portfolios", icon: FolderOpen },
      { value: "photos", label: "Site photos", icon: ImageIcon },
    ] },
    { label: "Site", items: [
      { value: "announcements", label: "Announcements", icon: Megaphone },
      { value: "athletes", label: "Athlete scraper", icon: Trophy },
      { value: "payments", label: "Payment options", icon: CreditCard },
      { value: "maintenance", label: "Maintenance", icon: Shield },
    ] },
    { label: "Account", items: [{ value: "credentials", label: "Login details", icon: Key }] },
  ];

  const titles: Record<string, string> = {
    calendar: "Availability", galleries: "Client galleries", portfolios: "Portfolios", photos: "Site photos",
    announcements: "Announcements", payments: "Payment options", athletes: "Athlete scraper", maintenance: "Maintenance", credentials: "Login details",
  };

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
            <p className="mt-2 text-sm text-muted-foreground font-body">Sign in to manage your site</p>
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

  const content: Record<string, React.ReactNode> = {
    calendar: <AdminCalendarTab />, galleries: <AdminGalleriesTab />, portfolios: <AdminPortfoliosTab />,
    photos: <AdminPhotosTab />, announcements: <AdminAnnouncementsTab />, payments: <AdminPaymentsTab />, athletes: <AdminAthleteScraper />,
    maintenance: <AdminMaintenanceTab />, credentials: <AdminCredentialsTab />,
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <Link to="/" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><PanelLeftClose className="h-4 w-4" /></div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate font-display font-bold">GrayFX Admin</p><p className="truncate text-xs text-muted-foreground">Site management</p></div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{group.items.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton tooltip={item.label} isActive={section === item.value} onClick={() => setSearchParams({ section: item.value })}>
                      <item.icon className="h-4 w-4" /><span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-3">
            <SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="Sign out" onClick={handleLogout}><LogOut className="h-4 w-4" /><span>Sign out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <div><p className="text-xs text-muted-foreground">Admin panel</p><h1 className="font-display text-lg font-bold">{titles[section] || "Availability"}</h1></div>
          </header>
          <motion.main key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl p-4 sm:p-8">
            {content[section] ?? content.calendar}
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
