import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { discordRedirectUri } from "@/lib/panel-api";
import { useToast } from "@/hooks/use-toast";

/**
 * Discord redirects back to the site root with ?code=... (hash routes can't be
 * used as OAuth redirect URIs). This handler completes the exchange and sends
 * the moderator into the panel.
 */
const DiscordOAuthHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const ran = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const pending = sessionStorage.getItem("panel:oauth");
    if (!code || !pending) return;
    ran.current = true;
    sessionStorage.removeItem("panel:oauth");
    setBusy(true);

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ code, redirectUri: discordRedirectUri() }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Discord login failed");

        const { error } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "email",
        });
        if (error) throw error;

        window.history.replaceState({}, "", window.location.pathname);
        navigate("/panel", { replace: true });
      } catch (e) {
        toast({
          title: "Login failed",
          description: (e as Error).message,
          variant: "destructive",
        });
        window.history.replaceState({}, "", window.location.pathname);
        navigate("/panel/login", { replace: true });
      } finally {
        setBusy(false);
      }
    })();
  }, [navigate, toast]);

  if (!busy) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="font-body text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
};

export default DiscordOAuthHandler;
