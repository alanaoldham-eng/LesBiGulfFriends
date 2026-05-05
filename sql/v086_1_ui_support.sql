-- v086.1 UI support SQL. Safe to run more than once.

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
  rsvp_status text not null check (rsvp_status in ('going', 'maybe', 'cant_make_it')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(event_id, user_id)
);

create index if not exists idx_event_rsvps_event_status
  on public.event_rsvps(event_id, rsvp_status);

alter table public.groups
  add column if not exists group_icon_emoji text,
  add column if not exists group_logo_url text;

create or replace function public.ensure_group_member_rpc(
  _group_id uuid,
  _user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _exists uuid;
begin
  select id into _exists
  from public.group_members
  where group_id = _group_id
    and user_id = _user_id
  limit 1;

  if _exists is null then
    insert into public.group_members(group_id, user_id, role)
    values(_group_id, _user_id, 'member');
    return jsonb_build_object('joined', true);
  end if;

  return jsonb_build_object('joined', false);
end;
$$;

do $$
begin
  begin
    alter table public.event_rsvps enable row level security;
  exception when others then null;
  end;

  begin
    create policy "Members can read event rsvps"
      on public.event_rsvps
      for select
      using (true);
  exception when duplicate_object then null;
  end;

  begin
    create policy "Members can insert own event rsvp"
      on public.event_rsvps
      for insert
      with check (user_id = auth.uid());
  exception when duplicate_object then null;
  end;

  begin
    create policy "Members can update own event rsvp"
      on public.event_rsvps
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  exception when duplicate_object then null;
  end;
end $$;
