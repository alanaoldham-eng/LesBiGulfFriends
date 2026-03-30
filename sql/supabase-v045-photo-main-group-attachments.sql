-- LBGF v045 migration
-- 1) profile photo array + relationship status
alter table public.profiles
  add column if not exists photo_urls text[] default '{}'::text[],
  add column if not exists relationship_status text;

alter table public.profiles
  drop constraint if exists profiles_relationship_status_check;

alter table public.profiles
  add constraint profiles_relationship_status_check
  check (
    relationship_status is null
    or relationship_status in ('single', 'coupled', 'in an open relationship', 'it''s complicated')
  );

update public.profiles
set photo_urls = case
  when photo_urls is null or cardinality(photo_urls) = 0 then
    case when photo_url is not null then array[photo_url] else '{}'::text[] end
  else photo_urls
end;

-- 2) message attachments and links
alter table public.messages
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists link_url text;

alter table public.group_messages
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists link_url text;

-- 3) storage buckets
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read profile photos" on storage.objects;
create policy "Public read profile photos"
on storage.objects for select
using (bucket_id = 'profile-photos');

drop policy if exists "Authenticated upload profile photos" on storage.objects;
create policy "Authenticated upload profile photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos');

drop policy if exists "Authenticated update profile photos" on storage.objects;
create policy "Authenticated update profile photos"
on storage.objects for update to authenticated
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

drop policy if exists "Authenticated delete profile photos" on storage.objects;
create policy "Authenticated delete profile photos"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos');

drop policy if exists "Public read chat media" on storage.objects;
create policy "Public read chat media"
on storage.objects for select
using (bucket_id = 'chat-media');

drop policy if exists "Authenticated upload chat media" on storage.objects;
create policy "Authenticated upload chat media"
on storage.objects for insert to authenticated
with check (bucket_id = 'chat-media');

drop policy if exists "Authenticated update chat media" on storage.objects;
create policy "Authenticated update chat media"
on storage.objects for update to authenticated
using (bucket_id = 'chat-media')
with check (bucket_id = 'chat-media');

drop policy if exists "Authenticated delete chat media" on storage.objects;
create policy "Authenticated delete chat media"
on storage.objects for delete to authenticated
using (bucket_id = 'chat-media');

-- 4) auto-create profile and auto-join Main group
create or replace function public.handle_new_user_main_group()
returns trigger
language plpgsql
security definer
as $$
declare
  main_group_id uuid;
begin
  insert into public.profiles (id, display_name, photo_urls)
  values (new.id, 'New Member', '{}'::text[])
  on conflict (id) do nothing;

  select id into main_group_id
  from public.groups
  where lower(name) = 'main'
  limit 1;

  if main_group_id is null then
    insert into public.groups (name, description, created_by, is_private, interest_tags)
    values (
      'Main',
      'Default community chat for all members.',
      new.id,
      false,
      array['community']
    )
    returning id into main_group_id;

    insert into public.group_members (group_id, user_id, role)
    values (main_group_id, new.id, 'owner')
    on conflict (group_id, user_id) do nothing;
  else
    insert into public.group_members (group_id, user_id, role)
    values (main_group_id, new.id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_main_group on auth.users;
create trigger on_auth_user_created_main_group
after insert on auth.users
for each row execute procedure public.handle_new_user_main_group();

-- Backfill: ensure existing members are in Main and have placeholder profiles if needed
insert into public.profiles (id, display_name, photo_urls)
select au.id, 'New Member', '{}'::text[]
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;

do $$
declare
  main_group_id uuid;
begin
  select id into main_group_id
  from public.groups
  where lower(name) = 'main'
  limit 1;

  if main_group_id is null then
    select id into main_group_id from public.profiles order by created_at asc limit 1;
    if main_group_id is not null then
      insert into public.groups (name, description, created_by, is_private, interest_tags)
      values ('Main', 'Default community chat for all members.', main_group_id, false, array['community'])
      returning id into main_group_id;
    end if;
  end if;

  if main_group_id is not null then
    insert into public.group_members (group_id, user_id, role)
    select main_group_id, p.id,
      case when p.id = (select created_by from public.groups where id = main_group_id) then 'owner' else 'member' end
    from public.profiles p
    on conflict (group_id, user_id) do nothing;
  end if;
end $$;
