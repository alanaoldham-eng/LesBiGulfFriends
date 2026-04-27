-- v082 public event notification hardening
alter table public.notification_settings add column if not exists email_event_invites boolean not null default false;
create index if not exists idx_event_invites_user_created on public.event_invites(invitee_user_id, created_at desc);
create unique index if not exists event_invites_event_user_uidx on public.event_invites(event_id, invitee_user_id) where invitee_user_id is not null;
