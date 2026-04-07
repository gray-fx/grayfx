import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, LogIn, LogOut, Loader2, Megaphone, Shield, Key, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

import AdminCalendarTab from "@/components/admin/AdminCalendarTab";
import AdminAnnouncementsTab from "@/components/admin/AdminAnnouncementsTab";
import AdminMaintenanceTab from "@/components/admin/AdminMaintenanceTab";
import AdminCredentialsTab from "@/components/admin/AdminCredentialsTab";
import AdminPhotosTab from "@/components/admin/AdminPhotosTab";

const AdminPanel = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Manage your site settings from one place.
          </p>
        </motion.div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-1.5 text-xs">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5 text-xs">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Announce</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1.5 text-xs">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Maintain</span>
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-1.5 text-xs">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <AdminCalendarTab />
          </TabsContent>
          <TabsContent value="photos">
            <AdminPhotosTab />
          </TabsContent>
          <TabsContent value="announcements">
            <AdminAnnouncementsTab />
          </TabsContent>
          <TabsContent value="maintenance">
            <AdminMaintenanceTab />
          </TabsContent>
          <TabsContent value="credentials">
            <AdminCredentialsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
