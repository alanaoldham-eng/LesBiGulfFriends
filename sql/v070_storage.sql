insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('warning-wall-photos', 'warning-wall-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can view event media" on storage.objects;
create policy "Public can view event media"
on storage.objects
for select
using (bucket_id = 'event-media');

drop policy if exists "Authenticated can upload event media" on storage.objects;
create policy "Authenticated can upload event media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'event-media');

drop policy if exists "Users can delete own event media" on storage.objects;
create policy "Users can delete own event media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Public can view warning wall photos" on storage.objects;
create policy "Public can view warning wall photos"
on storage.objects
for select
using (bucket_id = 'warning-wall-photos');

drop policy if exists "Authenticated can upload warning wall photos" on storage.objects;
create policy "Authenticated can upload warning wall photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'warning-wall-photos');

drop policy if exists "Users can delete own warning wall photos" on storage.objects;
create policy "Users can delete own warning wall photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'warning-wall-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
