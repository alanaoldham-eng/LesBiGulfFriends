-- v086 core fixes

alter table public.in_app_notifications
  drop constraint if exists in_app_notifications_event_id_fkey;

alter table public.in_app_notifications
  add constraint in_app_notifications_event_id_fkey
  foreign key (event_id)
  references public.events(id)
  on delete set null;

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rsvp_status text not null check (rsvp_status in ('going','maybe','cant_make_it')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id,user_id)
);

alter table public.groups
  add column if not exists group_icon_emoji text,
  add column if not exists group_logo_url text;
