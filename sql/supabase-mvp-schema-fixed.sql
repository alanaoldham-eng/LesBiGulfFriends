-- Les Bi Gulf Friends — Supabase MVP (fixed ordering)
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  interests text[] default '{}'::text[],
  photo_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_user, to_user)
);
create index if not exists idx_friend_requests_to_user on public.friend_requests(to_user);
create index if not exists idx_friend_requests_from_user on public.friend_requests(from_user);
create index if not exists idx_friend_requests_status on public.friend_requests(status);
drop trigger if exists trg_friend_requests_updated_at on public.friend_requests;
create trigger trg_friend_requests_updated_at before update on public.friend_requests for each row execute function public.set_updated_at();
alter table public.friend_requests enable row level security;
drop policy if exists "friend_requests_read_parties" on public.friend_requests;
create policy "friend_requests_read_parties" on public.friend_requests for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "friend_requests_insert_sender" on public.friend_requests;
create policy "friend_requests_insert_sender" on public.friend_requests for insert to authenticated with check (from_user = auth.uid() and from_user <> to_user);
drop policy if exists "friend_requests_update_recipient_or_sender_cancel" on public.friend_requests;
create policy "friend_requests_update_recipient_or_sender_cancel" on public.friend_requests for update to authenticated using ((to_user = auth.uid()) OR (from_user = auth.uid() AND status = 'pending')) with check (((to_user = auth.uid()) and status in ('accepted','declined')) OR ((from_user = auth.uid()) and status = 'canceled'));

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friends_order_check check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists idx_friends_user_a on public.friends(user_a);
create index if not exists idx_friends_user_b on public.friends(user_b);
alter table public.friends enable row level security;
drop policy if exists "friends_read_parties" on public.friends;
create policy "friends_read_parties" on public.friends for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists "friends_insert_none" on public.friends;
create policy "friends_insert_none" on public.friends for insert to authenticated with check (false);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.friends f where (f.user_a = least(a,b) and f.user_b = greatest(a,b)));
$$;

create or replace function public.accept_friend_request(request_id uuid)
returns void language plpgsql security definer as $$
declare fr public.friend_requests%rowtype; a uuid; b uuid;
begin
  select * into fr from public.friend_requests where id = request_id;
  if fr.id is null then raise exception 'Friend request not found'; end if;
  if fr.to_user <> auth.uid() then raise exception 'Only recipient can accept'; end if;
  if fr.status <> 'pending' then raise exception 'Request not pending'; end if;
  update public.friend_requests set status = 'accepted', updated_at = now() where id = request_id;
  a := least(fr.from_user, fr.to_user);
  b := greatest(fr.from_user, fr.to_user);
  insert into public.friends (user_a, user_b) values (a, b) on conflict (user_a, user_b) do nothing;
end;
$$;
revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_recipient on public.messages(recipient_id, created_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id, created_at desc);
alter table public.messages enable row level security;
drop policy if exists "messages_read_parties" on public.messages;
create policy "messages_read_parties" on public.messages for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "messages_insert_sender_if_friends" on public.messages;
create policy "messages_insert_sender_if_friends" on public.messages for insert to authenticated with check (sender_id = auth.uid() and sender_id <> recipient_id and public.are_friends(sender_id, recipient_id));

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 80),
  description text check (char_length(description) <= 500),
  location_tag text,
  interest_tags text[] default '{}'::text[],
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_groups_location_tag on public.groups(location_tag);
drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at before update on public.groups for each row execute function public.set_updated_at();
alter table public.groups enable row level security;
drop policy if exists "groups_read_public" on public.groups;
create policy "groups_read_public" on public.groups for select to authenticated using (is_private = false or created_by = auth.uid());
drop policy if exists "groups_insert_creator" on public.groups;
create policy "groups_insert_creator" on public.groups for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "groups_update_creator" on public.groups;
create policy "groups_update_creator" on public.groups for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member','mod','owner')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
alter table public.group_members enable row level security;
drop policy if exists "group_members_read_own" on public.group_members;
create policy "group_members_read_own" on public.group_members for select to authenticated using (user_id = auth.uid());
drop policy if exists "group_members_insert_self_public" on public.group_members;
create policy "group_members_insert_self_public" on public.group_members for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.groups g where g.id = group_id and g.is_private = false));
drop policy if exists "group_members_delete_self" on public.group_members;
create policy "group_members_delete_self" on public.group_members for delete to authenticated using (user_id = auth.uid());

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists idx_group_messages_group on public.group_messages(group_id, created_at desc);
alter table public.group_messages enable row level security;
drop policy if exists "group_messages_read_if_member" on public.group_messages;
create policy "group_messages_read_if_member" on public.group_messages for select to authenticated using (exists (select 1 from public.group_members gm where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()));
drop policy if exists "group_messages_insert_if_member" on public.group_messages;
create policy "group_messages_insert_if_member" on public.group_messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.group_members gm where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()));
