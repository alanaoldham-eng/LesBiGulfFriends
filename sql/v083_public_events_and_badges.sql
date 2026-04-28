-- v083: public event visibility, all-member public event invites, and election badge labels

alter table public.notification_settings
  add column if not exists email_event_invites boolean not null default false;

-- Ensure event invites can be upserted by event/user.
delete from public.event_invites a
using public.event_invites b
where a.ctid < b.ctid
  and a.event_id = b.event_id
  and a.invitee_user_id = b.invitee_user_id
  and a.invitee_user_id is not null;

create unique index if not exists event_invites_event_user_uidx
  on public.event_invites(event_id, invitee_user_id)
  where invitee_user_id is not null;

create index if not exists idx_event_invites_user_created
  on public.event_invites(invitee_user_id, created_at desc);

create index if not exists idx_events_public_starts_at
  on public.events(is_public, starts_at);

-- RLS policy names are guarded. These allow active members to see public events,
-- which fixes "public event only visible to creator" when RLS is enabled.
do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'events'
  ) then
    begin
      create policy "Members can read public events"
        on public.events
        for select
        using (
          coalesce(is_public, false) = true
          or created_by = auth.uid()
        );
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- Invite all active members to every public event, past and future.
-- This creates in-app event notifications because the app builds them from event_invites.
insert into public.event_invites (
  event_id,
  inviter_id,
  invitee_user_id,
  invitee_email,
  status,
  sent_at
)
select
  e.id as event_id,
  e.created_by as inviter_id,
  p.id as invitee_user_id,
  coalesce(u.email, p.id::text || '@member.local') as invitee_email,
  'sent' as status,
  now() as sent_at
from public.events e
cross join public.profiles p
left join auth.users u on u.id = p.id
where coalesce(e.is_public, false) = true
  and p.id <> e.created_by
  and coalesce(p.membership_status, 'active') = 'active'
on conflict (event_id, invitee_user_id)
do update set
  status = 'sent',
  sent_at = coalesce(public.event_invites.sent_at, excluded.sent_at),
  invitee_email = excluded.invitee_email;

-- Normalize I Voted badge labels from proposal title + expiration date.
update public.user_badges ub
set
  badge_label = 'I Voted 🗳️ ' || p.title || ' (' || to_char(p.expires_at::date, 'MM/DD/YYYY') || ')',
  emoji = ''
from public.proposals p
where ub.badge_key = 'i_voted'
  and ub.election_key = p.election_key;
