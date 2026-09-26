CREATE TABLE public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('file','folder')),
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.share_links TO anon, authenticated;
GRANT ALL ON public.share_links TO service_role;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view share links" ON public.share_links FOR SELECT USING (true);
CREATE POLICY "Anyone can create share links" ON public.share_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete share links" ON public.share_links FOR DELETE USING (true);