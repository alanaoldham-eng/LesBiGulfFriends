-- v084: public event visibility, all-member public event invites, and election badge display repair.
-- Safe to run more than once.

alter table public.notification_settings
  add column if not exists email_event_invites boolean not null default false;

create index if not exists idx_event_invites_user_created
  on public.event_invites(invitee_user_id, created_at desc);

create index if not exists idx_events_public_starts_at
  on public.events(is_public, starts_at);

do $$
begin
  begin
    create policy "Members can read public events"
      on public.events
      for select
      using (
        coalesce(is_public, false) = true
        or created_by = auth.uid()
      );
  exception
    when duplicate_object then null;
  end;
end $$;

-- Update existing public-event invites.
update public.event_invites ei
set
  status = 'sent',
  sent_at = coalesce(ei.sent_at, now()),
  invitee_email = coalesce(u.email, p.id::text || '@member.local')
from public.events e
join public.profiles p on true
left join auth.users u on u.id = p.id
where ei.event_id = e.id
  and ei.invitee_user_id = p.id
  and coalesce(e.is_public, false) = true
  and p.id <> e.created_by
  and coalesce(p.membership_status, 'active') = 'active';

-- Insert missing public-event invites. These rows drive in-app event notifications.
insert into public.event_invites (
  event_id,
  inviter_id,
  invitee_user_id,
  invitee_email,
  status,
  sent_at
)
select
  e.id,
  e.created_by,
  p.id,
  coalesce(u.email, p.id::text || '@member.local'),
  'sent',
  now()
from public.events e
cross join public.profiles p
left join auth.users u on u.id = p.id
where coalesce(e.is_public, false) = true
  and p.id <> e.created_by
  and coalesce(p.membership_status, 'active') = 'active'
  and not exists (
    select 1
    from public.event_invites ei
    where ei.event_id = e.id
      and ei.invitee_user_id = p.id
  );

-- Remove exact duplicates, then create unique index for future stability.
delete from public.event_invites a
using public.event_invites b
where a.ctid < b.ctid
  and a.event_id = b.event_id
  and a.invitee_user_id = b.invitee_user_id
  and a.invitee_user_id is not null;

create unique index if not exists event_invites_event_user_uidx
  on public.event_invites(event_id, invitee_user_id)
  where invitee_user_id is not null;

-- Normalize all voted/election badges to show proposal title and expiration date.
update public.user_badges ub
set
  badge_key = case when ub.badge_key is null or ub.badge_key = '' then 'i_voted' else ub.badge_key end,
  badge_label = 'I Voted 🗳️ ' || p.title || ' (' || to_char(p.expires_at::date, 'MM/DD/YYYY') || ')',
  emoji = ''
from public.proposals p
where ub.election_key = p.election_key
  and (
    ub.badge_key = 'i_voted'
    or ub.badge_label ilike '%voted%'
    or ub.badge_label ilike '%vote%'
  );
