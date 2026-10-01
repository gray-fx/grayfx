ALTER TABLE public.client_galleries
  ADD COLUMN is_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN cover_photo_id uuid NULL;

ALTER TABLE public.client_galleries
  ADD CONSTRAINT client_galleries_cover_photo_id_fkey
  FOREIGN KEY (cover_photo_id)
  REFERENCES public.client_gallery_photos(id)
  ON DELETE SET NULL;

GRANT SELECT ON public.client_galleries TO anon;

CREATE POLICY "Anyone can view visible galleries"
ON public.client_galleries
FOR SELECT
TO anon
USING (is_visible = true);

CREATE INDEX client_galleries_visible_event_date_idx
ON public.client_galleries (event_date DESC, created_at DESC)
WHERE is_visible = true;