-- v047 invite email sending status + events + event invites
alter table public.invites
  add column if not exists sent_at timestamptz,
  add column if not exists error_message text,
  add column if not exists resend_message_id text;

alter table public.invites
  drop constraint if exists invites_status_check;

alter table public.invites
  add constraint invites_status_check
  check (status in ('pending','sent','joined','failed','canceled'));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  description text,
  starts_at timestamptz not null,
  location text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_created_by on public.events(created_by);
create index if not exists idx_events_starts_at on public.events(starts_at);

alter table public.events enable row level security;

drop policy if exists "events_read_all_authenticated" on public.events;
create policy "events_read_all_authenticated"
on public.events for select to authenticated
using (true);

drop policy if exists "events_insert_creator" on public.events;
create policy "events_insert_creator"
on public.events for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "events_update_creator" on public.events;
create policy "events_update_creator"
on public.events for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create table if not exists public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  invitee_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','joined','failed','canceled')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  joined_at timestamptz,
  error_message text,
  resend_message_id text
);

create index if not exists idx_event_invites_event on public.event_invites(event_id);
create index if not exists idx_event_invites_inviter on public.event_invites(inviter_id);
create index if not exists idx_event_invites_email on public.event_invites(invitee_email);

alter table public.event_invites enable row level security;

drop policy if exists "event_invites_read_creator" on public.event_invites;
create policy "event_invites_read_creator"
on public.event_invites for select to authenticated
using (inviter_id = auth.uid());

drop policy if exists "event_invites_insert_creator" on public.event_invites;
create policy "event_invites_insert_creator"
on public.event_invites for insert to authenticated
with check (inviter_id = auth.uid());

drop policy if exists "event_invites_update_creator" on public.event_invites;
create policy "event_invites_update_creator"
on public.event_invites for update to authenticated
using (inviter_id = auth.uid())
with check (inviter_id = auth.uid());

create or replace function public.handle_event_invite_join()
returns trigger
language plpgsql
security definer
as $$
declare
  invited_email text;
begin
  select email into invited_email from auth.users where id = new.id;
  if invited_email is null then
    return new;
  end if;

  update public.event_invites
    set status = 'joined',
        invitee_user_id = new.id,
        joined_at = now()
  where lower(invitee_email) = lower(invited_email)
    and status in ('pending','sent');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_event_invite_join on auth.users;
create trigger on_auth_user_created_event_invite_join
after insert on auth.users
for each row execute procedure public.handle_event_invite_join();
