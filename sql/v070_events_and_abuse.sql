-- v070 additive schema

alter table public.events
  add column if not exists is_public boolean not null default true,
  add column if not exists cover_image_url text,
  add column if not exists link_url text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  media_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_media_event_created_at
  on public.event_media(event_id, created_at desc);

alter table public.event_media enable row level security;

drop policy if exists "event_media_select_authenticated" on public.event_media;
create policy "event_media_select_authenticated"
on public.event_media
for select
to authenticated
using (true);

drop policy if exists "event_media_insert_self" on public.event_media;
create policy "event_media_insert_self"
on public.event_media
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "event_media_delete_self" on public.event_media;
create policy "event_media_delete_self"
on public.event_media
for delete
to authenticated
using (user_id = auth.uid());

alter table public.event_messages
  add column if not exists edited_at timestamptz;

alter table public.group_messages
  add column if not exists edited_at timestamptz;

alter table public.notification_settings
  add column if not exists email_event_invites boolean not null default false;

alter table public.game_checkins
  add column if not exists event_id uuid references public.events(id) on delete cascade,
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists verified_method text default 'manual';

create unique index if not exists idx_unique_event_checkin_per_member
on public.game_checkins(user_id, event_id, game_key)
where game_key = 'event_checkin' and event_id is not null;

alter table public.user_badges
  add column if not exists meta jsonb;

create table if not exists public.warning_wall_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.warning_wall_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_warning_wall_reports_post
  on public.warning_wall_reports(post_id, created_at desc);

alter table public.warning_wall_reports enable row level security;

drop policy if exists "warning_wall_reports_insert_self" on public.warning_wall_reports;
create policy "warning_wall_reports_insert_self"
on public.warning_wall_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "warning_wall_reports_select_own" on public.warning_wall_reports;
create policy "warning_wall_reports_select_own"
on public.warning_wall_reports
for select
to authenticated
using (reporter_id = auth.uid());

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row
execute function public.set_events_updated_at();
