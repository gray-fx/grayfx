
CREATE TABLE public.availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Everyone can view availability
CREATE POLICY "Anyone can view availability"
ON public.availability
FOR SELECT
USING (true);

-- Only authenticated users (admin) can manage availability
CREATE POLICY "Authenticated users can insert availability"
ON public.availability
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update availability"
ON public.availability
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete availability"
ON public.availability
FOR DELETE
TO authenticated
USING (true);
