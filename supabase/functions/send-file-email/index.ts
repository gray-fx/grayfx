import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const RECIPIENT = "gr4yfx@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attachments } = await req.json();

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return new Response(JSON.stringify({ error: "No attachments provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileList = attachments.map((a: { filename: string }) => a.filename).join(", ");

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
        subject: `File Upload: ${attachments.length} file(s)`,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;"><h2>📁 New File Upload</h2><p>You received <strong>${attachments.length}</strong> file(s):</p><ul>${attachments.map((a: { filename: string }) => `<li>${a.filename}</li>`).join("")}</ul><p style="color:#999;font-size:12px;margin-top:20px;">Sent from your GrayFX upload form</p></div>`,
        attachments: attachments.map((a: { filename: string; content: string }) => ({
          filename: a.filename,
          content: a.content,
        })),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend gateway error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
