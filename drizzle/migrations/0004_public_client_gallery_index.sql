CREATE OR REPLACE FUNCTION public.get_public_client_galleries()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'slug', g.slug,
      'event_date', g.event_date,
      'cover_url', COALESCE(cover.image_url, first_photo.image_url)
    ) ORDER BY g.event_date DESC NULLS LAST, g.created_at DESC
  ), '[]'::jsonb)
  FROM public.client_galleries g
  LEFT JOIN public.client_gallery_photos cover ON cover.id = g.cover_photo_id
  LEFT JOIN LATERAL (
    SELECT p.image_url
    FROM public.client_gallery_photos p
    WHERE p.gallery_id = g.id
    ORDER BY p.taken_at ASC NULLS LAST, p.file_name ASC, p.created_at ASC
    LIMIT 1
  ) first_photo ON true
  WHERE g.is_visible = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_client_galleries() TO anon, authenticated;