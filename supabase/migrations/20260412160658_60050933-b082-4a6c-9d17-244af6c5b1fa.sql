
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  school_url text NOT NULL,
  sport text NOT NULL,
  level text NOT NULL,
  season text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  grade text,
  jersey_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_url, sport, level, season, first_name, last_name)
);

CREATE INDEX idx_athletes_name_trgm ON public.athletes USING gin (
  (lower(first_name) || ' ' || lower(last_name)) gin_trgm_ops
);
CREATE INDEX idx_athletes_last_name ON public.athletes (lower(last_name));
CREATE INDEX idx_athletes_first_name ON public.athletes (lower(first_name));

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view athletes" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert athletes" ON public.athletes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update athletes" ON public.athletes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete athletes" ON public.athletes FOR DELETE TO authenticated USING (true);
