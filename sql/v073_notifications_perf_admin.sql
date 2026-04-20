alter table public.notification_settings
  add column if not exists email_event_invites boolean not null default false;

create table if not exists public.notification_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

alter table public.notification_reads enable row level security;

drop policy if exists "notification_reads_select_own" on public.notification_reads;
create policy "notification_reads_select_own"
on public.notification_reads
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_reads_insert_own" on public.notification_reads;
create policy "notification_reads_insert_own"
on public.notification_reads
for insert
to authenticated
with check (user_id = auth.uid());

create index if not exists idx_messages_recipient_created_at
  on public.messages(recipient_id, created_at desc);

create index if not exists idx_messages_sender_recipient_created_at
  on public.messages(sender_id, recipient_id, created_at desc);

create index if not exists idx_friend_requests_to_status_created_at
  on public.friend_requests(to_user, status, created_at desc);

create index if not exists idx_group_messages_group_created_at
  on public.group_messages(group_id, created_at desc);

create index if not exists idx_event_messages_event_created_at
  on public.event_messages(event_id, created_at desc);

create index if not exists idx_event_invites_event_created_at
  on public.event_invites(event_id, created_at desc);

create index if not exists idx_events_starts_at
  on public.events(starts_at desc);
