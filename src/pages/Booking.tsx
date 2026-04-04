import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, ArrowLeft, Send, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAvailability } from "@/hooks/use-availability";

const EVENT_TYPES = [
  "Sports Event",
  "Portrait Session",
  "Graduation",
  "Birthday / Party",
  "Wedding",
  "Corporate Event",
  "Concert / Festival",
  "Car Meet / Car Show",
  "Content Creation",
  "Other",
];

const Booking = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    instagram: "",
    eventType: "",
    eventLocation: "",
    eventDate: "",
    eventTime: "",
    comments: "",
    partySize: "1",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.eventType || !form.eventLocation || !form.eventDate) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const eventDateTime = new Date(`${form.eventDate}T${form.eventTime || "00:00"}`).toISOString();

      const { error: dbError } = await supabase.from("bookings").insert({
        name: form.name,
        contact: form.contact,
        instagram: form.instagram || null,
        event_type: form.eventType,
        event_location: form.eventLocation,
        event_date: eventDateTime,
        comments: form.comments || null,
        party_size: parseInt(form.partySize) || 1,
      });

      if (dbError) throw dbError;

      // Send email notification
      await supabase.functions.invoke("send-booking-notification", {
        body: {
          name: form.name,
          contact: form.contact,
          instagram: form.instagram,
          eventType: form.eventType,
          eventLocation: form.eventLocation,
          eventDate: form.eventDate,
          eventTime: form.eventTime,
          comments: form.comments,
          partySize: form.partySize,
        },
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast({ title: "Something went wrong", description: "Please try again or reach out directly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Booking Submitted!</h1>
          <p className="font-body text-muted-foreground mb-8">
            Thanks for reaching out! I'll review your request and get back to you soon.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-body text-sm uppercase tracking-widest">Back</span>
          </Link>
          <Camera className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Book a Shoot</h1>
            <p className="mt-4 font-body text-muted-foreground tracking-wide">
              Fill out the details below and I'll get back to you shortly.
            </p>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-6"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Name <span className="text-primary">*</span>
            </Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" required />
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Email or Phone <span className="text-primary">*</span>
            </Label>
            <Input id="contact" value={form.contact} onChange={(e) => update("contact", e.target.value)} placeholder="email@example.com or (555) 123-4567" required />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Instagram Handle
            </Label>
            <Input id="instagram" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="@yourusername" />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Event Type <span className="text-primary">*</span>
            </Label>
            <Select value={form.eventType} onValueChange={(v) => update("eventType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Event Location <span className="text-primary">*</span>
            </Label>
            <Input id="location" value={form.eventLocation} onChange={(e) => update("eventLocation", e.target.value)} placeholder="Venue name or address" required />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
                Event Date <span className="text-primary">*</span>
              </Label>
              <Input id="date" type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
                Event Time
              </Label>
              <Input id="time" type="time" value={form.eventTime} onChange={(e) => update("eventTime", e.target.value)} />
            </div>
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label htmlFor="partySize" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              How Many People <span className="text-primary">*</span>
            </Label>
            <Input id="partySize" type="number" min="1" max="500" value={form.partySize} onChange={(e) => update("partySize", e.target.value)} required />
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="font-body text-sm uppercase tracking-widest text-muted-foreground">
              Additional Comments
            </Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(e) => update("comments", e.target.value)}
              placeholder="Any details about the event, specific shots you want, etc."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-primary py-6 font-body text-sm font-medium uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </motion.form>
      </main>

      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="font-body text-xs tracking-widest text-muted-foreground/50 uppercase">
          © 2026 · All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default Booking;
