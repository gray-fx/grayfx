CREATE TABLE public.client_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  event_date date,
  password_hash text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_galleries TO authenticated;
GRANT ALL ON public.client_galleries TO service_role;
ALTER TABLE public.client_galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage galleries" ON public.client_galleries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.client_gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.client_galleries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_gallery_photos TO authenticated;
GRANT ALL ON public.client_gallery_photos TO service_role;
ALTER TABLE public.client_gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gallery photos" ON public.client_gallery_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.client_gallery_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.client_galleries(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL UNIQUE REFERENCES public.client_gallery_photos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_gallery_favorites TO authenticated;
GRANT ALL ON public.client_gallery_favorites TO service_role;
ALTER TABLE public.client_gallery_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage favorites" ON public.client_gallery_favorites FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.client_gallery_pw_ok(_g public.client_galleries, _pw text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _g.password_hash = '' OR _g.password_hash = extensions.crypt(coalesce(_pw,''), _g.password_hash);
$$;

CREATE OR REPLACE FUNCTION public.get_client_gallery(_slug text, _pw text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
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
      ) ORDER BY p.sort_order, p.created_at)
      FROM public.client_gallery_photos p WHERE p.gallery_id = g.id), '[]'::jsonb)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.set_client_favorite(_slug text, _pw text, _photo_id uuid, _fav boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.client_galleries;
BEGIN
  SELECT * INTO g FROM public.client_galleries WHERE slug = _slug;
  IF NOT FOUND OR NOT public.client_gallery_pw_ok(g, _pw) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.client_gallery_photos WHERE id = _photo_id AND gallery_id = g.id) THEN RETURN false; END IF;
  IF _fav THEN
    INSERT INTO public.client_gallery_favorites(gallery_id, photo_id) VALUES (g.id, _photo_id) ON CONFLICT (photo_id) DO NOTHING;
  ELSE
    DELETE FROM public.client_gallery_favorites WHERE photo_id = _photo_id;
  END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.set_client_gallery_password(_id uuid, _pw text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.client_galleries
  SET password_hash = CASE WHEN coalesce(_pw,'') = '' THEN '' ELSE extensions.crypt(_pw, extensions.gen_salt('bf')) END
  WHERE id = _id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.client_gallery_pw_ok(public.client_galleries, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_gallery(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_client_favorite(text, text, uuid, boolean) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_client_gallery_password(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_client_gallery_password(uuid, text) TO authenticated;