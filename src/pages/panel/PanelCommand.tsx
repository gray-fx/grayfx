import { useState } from "react";
import { Loader2, Terminal } from "lucide-react";
import PanelLayout from "./PanelLayout";
import { callPanel } from "@/lib/panel-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const PanelCommand = () => {
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    try {
      const res = await callPanel("run-command", { method: "POST", body: { command } });
      setResponse(JSON.stringify(res, null, 2));
      toast({ title: "Command sent" });
    } catch (err) {
      setResponse(JSON.stringify({ error: (err as Error).message }, null, 2));
      toast({ title: "Command failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelLayout title="Run Command">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" /> Raw in-game command
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Commands run against the live server. Double-check before sending.
          </p>
          <form onSubmit={run} className="flex gap-3">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder=":pm Player Hello"
              required
              className="font-mono"
            />
            <Button type="submit" disabled={loading || !command.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send
            </Button>
          </form>
        </section>

        {response && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display font-semibold mb-3">Response</h2>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs font-mono text-foreground">
              {response}
            </pre>
          </section>
        )}
      </div>
    </PanelLayout>
  );
};

export default PanelCommand;
