CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portfolios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT ALL ON public.portfolios TO service_role;

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolios" ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert portfolios" ON public.portfolios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update portfolios" ON public.portfolios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete portfolios" ON public.portfolios FOR DELETE TO authenticated USING (true);

CREATE TABLE public.portfolio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portfolio_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_photos TO authenticated;
GRANT ALL ON public.portfolio_photos TO service_role;

ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio photos" ON public.portfolio_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert portfolio photos" ON public.portfolio_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update portfolio photos" ON public.portfolio_photos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete portfolio photos" ON public.portfolio_photos FOR DELETE TO authenticated USING (true);

CREATE INDEX portfolio_photos_portfolio_idx ON public.portfolio_photos (portfolio_id, sort_order);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolio_photos_updated_at BEFORE UPDATE ON public.portfolio_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_single_primary_portfolio()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.portfolios SET is_primary = false WHERE id <> NEW.id AND is_primary;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER portfolios_single_primary AFTER INSERT OR UPDATE OF is_primary ON public.portfolios FOR EACH ROW WHEN (NEW.is_primary) EXECUTE FUNCTION public.enforce_single_primary_portfolio();