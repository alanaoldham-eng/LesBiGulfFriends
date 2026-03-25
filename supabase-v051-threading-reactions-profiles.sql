-- v051 public groups visibility + message threading + reactions + event messages

alter table public.group_messages
  add column if not exists parent_message_id uuid references public.group_messages(id) on delete set null;

create table if not exists public.group_message_reactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists idx_group_message_reactions_message on public.group_message_reactions(message_id);

alter table public.group_message_reactions enable row level security;

drop policy if exists "group_message_reactions_read_if_member" on public.group_message_reactions;
create policy "group_message_reactions_read_if_member"
on public.group_message_reactions for select to authenticated
using (exists (select 1 from public.group_members gm where gm.group_id = group_message_reactions.group_id and gm.user_id = auth.uid()));

drop policy if exists "group_message_reactions_insert_if_member" on public.group_message_reactions;
create policy "group_message_reactions_insert_if_member"
on public.group_message_reactions for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.group_members gm where gm.group_id = group_message_reactions.group_id and gm.user_id = auth.uid()));

create table if not exists public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  parent_message_id uuid references public.event_messages(id) on delete set null,
  media_url text,
  media_type text,
  link_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_messages_event on public.event_messages(event_id, created_at desc);

alter table public.event_messages enable row level security;

drop policy if exists "event_messages_read_authenticated" on public.event_messages;
create policy "event_messages_read_authenticated"
on public.event_messages for select to authenticated
using (true);

drop policy if exists "event_messages_insert_authenticated" on public.event_messages;
create policy "event_messages_insert_authenticated"
on public.event_messages for insert to authenticated
with check (sender_id = auth.uid());

create table if not exists public.event_message_reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  message_id uuid not null references public.event_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists idx_event_message_reactions_message on public.event_message_reactions(message_id);

alter table public.event_message_reactions enable row level security;

drop policy if exists "event_message_reactions_read_authenticated" on public.event_message_reactions;
create policy "event_message_reactions_read_authenticated"
on public.event_message_reactions for select to authenticated
using (true);

drop policy if exists "event_message_reactions_insert_authenticated" on public.event_message_reactions;
create policy "event_message_reactions_insert_authenticated"
on public.event_message_reactions for insert to authenticated
with check (user_id = auth.uid());
