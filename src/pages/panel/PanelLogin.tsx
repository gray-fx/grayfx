import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { discordRedirectUri } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PanelLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/panel", { replace: true });
    });
  }, [navigate]);

  const startLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-auth`,
        { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } },
      );
      const cfg = await res.json();
      if (!res.ok || !cfg.clientId) throw new Error(cfg.error || "Login unavailable");

      const url = new URL("https://discord.com/oauth2/authorize");
      url.searchParams.set("client_id", cfg.clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "identify");
      url.searchParams.set("redirect_uri", discordRedirectUri());
      url.searchParams.set("prompt", "consent");
      sessionStorage.setItem("panel:oauth", "1");
      window.location.href = url.toString();
    } catch (e) {
      toast({ title: "Could not start login", description: (e as Error).message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center space-y-5">
        <ShieldCheck className="mx-auto h-9 w-9 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold">Moderator Panel</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Sign in with Discord to continue. Staff access is verified server-side.
          </p>
        </div>
        <Button className="w-full" onClick={startLogin} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sign in with Discord
        </Button>
      </div>
    </div>
  );
};

export default PanelLogin;
