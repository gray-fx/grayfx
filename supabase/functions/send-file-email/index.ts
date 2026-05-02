import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const RECIPIENT = "gr4yfx@gmail.com";
const DOWNLOADS_URL = "https://id-preview--1a6c1c85-7a41-4609-9f19-9d462366abde.lovable.app/#/downloads";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sender, folder, files } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileList = (files ?? [])
      .map((f: { name: string; size: number }) => `<li>${f.name}</li>`)
      .join("");

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "GrayFX Uploads <onboarding@resend.dev>",
        to: [RECIPIENT],
        subject: `📁 New upload from ${sender ?? "Anonymous"} (${files?.length ?? 0} file(s))`,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">
          <h2>📁 New File Upload</h2>
          <p><strong>${sender ?? "Anonymous"}</strong> uploaded <strong>${files?.length ?? 0}</strong> file(s).</p>
          <p>Batch: <code>${folder}</code></p>
          <ul>${fileList}</ul>
          <p style="margin-top:24px;">
            <a href="${DOWNLOADS_URL}" style="background:#000;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
              Download files →
            </a>
          </p>
          <p style="color:#999;font-size:12px;margin-top:20px;">Files are stored at full quality. Open the downloads page and enter your password.</p>
        </div>`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend gateway error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Failed to send notification" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
