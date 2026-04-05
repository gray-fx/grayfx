CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete site settings"
ON public.site_settings FOR DELETE
TO authenticated
USING (true);

-- Seed default settings
INSERT INTO public.site_settings (key, value, is_active) VALUES
  ('announcement_banner', '{"message": "", "type": "info"}', false),
  ('announcement_popup', '{"title": "", "message": "", "type": "info"}', false),
  ('maintenance_mode', '{"locked_sections": []}', false);