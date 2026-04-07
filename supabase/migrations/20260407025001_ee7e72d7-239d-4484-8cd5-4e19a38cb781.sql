
-- Create gallery_photos table
CREATE TABLE public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  display_location TEXT NOT NULL DEFAULT 'gallery',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery photos"
  ON public.gallery_photos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert gallery photos"
  ON public.gallery_photos FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gallery photos"
  ON public.gallery_photos FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete gallery photos"
  ON public.gallery_photos FOR DELETE TO authenticated
  USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-photos', 'gallery-photos', true);

CREATE POLICY "Anyone can view gallery photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-photos');

CREATE POLICY "Authenticated users can upload gallery photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery-photos');

CREATE POLICY "Authenticated users can update gallery photos storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery-photos');

CREATE POLICY "Authenticated users can delete gallery photos storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery-photos');
