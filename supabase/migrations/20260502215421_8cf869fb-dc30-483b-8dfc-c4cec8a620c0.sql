
-- Create uploads bucket (public so signed/public URLs work for full-quality download)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Storage policies for uploads bucket
create policy "Anyone can upload to uploads bucket"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'uploads');

create policy "Anyone can read uploads bucket"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'uploads');

create policy "Anyone can delete uploads bucket"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'uploads');

-- Seed download password in site_settings
insert into public.site_settings (key, value, is_active)
values ('download_password', '{"password":"download2026"}'::jsonb, true)
on conflict do nothing;
