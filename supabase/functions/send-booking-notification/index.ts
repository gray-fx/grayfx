import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENT = "gr4yfx@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, contact, instagram, eventType, eventLocation, eventDate, eventTime, comments, partySize } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not set — email not sent, booking still saved.");
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dateFormatted = eventDate
      ? new Date(eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : "Not specified";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3a9cc0; border-bottom: 2px solid #3a9cc0; padding-bottom: 10px;">📸 New Booking Request</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
          <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #555;">Contact</td><td style="padding: 8px;">${contact}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Instagram</td><td style="padding: 8px 0;">${instagram || "—"}</td></tr>
          <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #555;">Event Type</td><td style="padding: 8px;">${eventType}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Location</td><td style="padding: 8px 0;">${eventLocation}</td></tr>
          <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #555;">Date</td><td style="padding: 8px;">${dateFormatted}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Time</td><td style="padding: 8px 0;">${eventTime || "Not specified"}</td></tr>
          <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold; color: #555;">Party Size</td><td style="padding: 8px;">${partySize}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Comments</td><td style="padding: 8px 0;">${comments || "—"}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">Sent from your GrayFX booking form</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GrayFX Bookings <onboarding@resend.dev>",
        to: [RECIPIENT],
        subject: `New Booking: ${eventType} — ${name}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", data);
    }

    return new Response(JSON.stringify({ success: true, emailSent: res.ok }), {
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
