ALTER TABLE public.client_gallery_photos ADD COLUMN IF NOT EXISTS taken_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS client_galleries_slug_key ON public.client_galleries(slug);
CREATE OR REPLACE FUNCTION public.get_client_gallery(_slug text, _pw text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE g public.client_galleries;
BEGIN
  SELECT * INTO g FROM public.client_galleries WHERE slug = _slug;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT public.client_gallery_pw_ok(g, _pw) THEN
    RETURN jsonb_build_object('locked', true, 'name', g.name);
  END IF;
  RETURN jsonb_build_object(
    'locked', false, 'id', g.id, 'name', g.name, 'event_date', g.event_date,
    'photos', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'image_url', p.image_url, 'file_name', p.file_name,
        'is_favorite', EXISTS(SELECT 1 FROM public.client_gallery_favorites f WHERE f.photo_id = p.id)
      ) ORDER BY p.taken_at NULLS LAST, p.file_name, p.created_at)
      FROM public.client_gallery_photos p WHERE p.gallery_id = g.id), '[]'::jsonb)
  );
END; $function$;