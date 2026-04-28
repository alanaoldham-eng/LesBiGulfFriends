-- v085: durable in-app notifications for public event invitations.
-- Safe to run more than once.

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id),
  actor_user_id uuid references public.profiles(id),
  type text not null,
  title text not null,
  body text,
  href text not null,
  event_id uuid references public.events(id),
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

alter table public.notification_settings
  add column if not exists email_event_invites boolean not null default false;

create index if not exists idx_in_app_notifications_recipient_unread
  on public.in_app_notifications(recipient_user_id, read_at, created_at desc);

create index if not exists idx_in_app_notifications_event
  on public.in_app_notifications(event_id);

create unique index if not exists in_app_notifications_event_user_type_uidx
  on public.in_app_notifications(event_id, recipient_user_id, type)
  where event_id is not null;

create index if not exists idx_event_invites_user_created
  on public.event_invites(invitee_user_id, created_at desc);

create index if not exists idx_events_public_starts_at
  on public.events(is_public, starts_at);

-- Allow members to read their own durable notifications if RLS is enabled.
do $$
begin
  begin
    alter table public.in_app_notifications enable row level security;
  exception when others then null;
  end;

  begin
    create policy "Members can read their notifications"
      on public.in_app_notifications
      for select
      using (recipient_user_id = auth.uid());
  exception when duplicate_object then null;
  end;

  begin
    create policy "Members can mark their notifications read"
      on public.in_app_notifications
      for update
      using (recipient_user_id = auth.uid())
      with check (recipient_user_id = auth.uid());
  exception when duplicate_object then null;
  end;

  begin
    create policy "Members can read public events"
      on public.events
      for select
      using (
        coalesce(is_public, false) = true
        or created_by = auth.uid()
      );
  exception when duplicate_object then null;
  end;
end $$;

-- Ensure every active member has an invite row for every public event.
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

delete from public.event_invites a
using public.event_invites b
where a.ctid < b.ctid
  and a.event_id = b.event_id
  and a.invitee_user_id = b.invitee_user_id
  and a.invitee_user_id is not null;

create unique index if not exists event_invites_event_user_uidx
  on public.event_invites(event_id, invitee_user_id)
  where invitee_user_id is not null;

-- Backfill durable in-app notifications from all public event invite rows.
insert into public.in_app_notifications (
  recipient_user_id,
  actor_user_id,
  type,
  title,
  body,
  href,
  event_id,
  created_at
)
select
  ei.invitee_user_id,
  ei.inviter_id,
  'event_invite',
  'You''re invited to ' || e.title,
  e.title || ' starts ' || e.starts_at::text || coalesce(' at ' || nullif(e.location, ''), '') || '.',
  '/events-app?event=' || e.id::text || '&notification=event-' || ei.id::text,
  e.id,
  coalesce(ei.sent_at, ei.created_at, now())
from public.event_invites ei
join public.events e on e.id = ei.event_id
join public.profiles p on p.id = ei.invitee_user_id
where coalesce(e.is_public, false) = true
  and ei.invitee_user_id is not null
  and p.id <> e.created_by
  and coalesce(p.membership_status, 'active') = 'active'
  and not exists (
    select 1
    from public.in_app_notifications n
    where n.event_id = e.id
      and n.recipient_user_id = ei.invitee_user_id
      and n.type = 'event_invite'
  );

-- Keep election badges normalized while this patch is being applied.
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
