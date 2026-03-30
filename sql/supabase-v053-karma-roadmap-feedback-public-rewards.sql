-- v053 karma roadmap, feedback table, and public activity rewards

create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('bug', 'feature_request')),
  title text not null check (char_length(title) <= 200),
  details text not null check (char_length(details) <= 5000),
  created_at timestamptz not null default now()
);

alter table public.feedback_items enable row level security;

drop policy if exists "feedback_insert_own" on public.feedback_items;
create policy "feedback_insert_own"
on public.feedback_items for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "feedback_no_select" on public.feedback_items;
create policy "feedback_no_select"
on public.feedback_items for select to authenticated
using (false);

create or replace function public.reward_public_group_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  group_private boolean;
  delta numeric;
begin
  select coalesce(is_private, false) into group_private
  from public.groups
  where id = new.group_id;

  if group_private then
    return new;
  end if;

  if new.parent_message_id is null then
    delta := 0.3;
    insert into public.karma_ledger (user_id, delta, reason, metadata)
    values (new.sender_id, delta, 'public_group_post', jsonb_build_object('group_id', new.group_id, 'group_message_id', new.id));
  else
    delta := 0.2;
    insert into public.karma_ledger (user_id, delta, reason, metadata)
    values (new.sender_id, delta, 'public_group_reply', jsonb_build_object('group_id', new.group_id, 'group_message_id', new.id, 'parent_message_id', new.parent_message_id));
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + delta
  where id = new.sender_id;

  return new;
end;
$$;

drop trigger if exists on_group_message_reward_public_activity on public.group_messages;
create trigger on_group_message_reward_public_activity
after insert on public.group_messages
for each row execute procedure public.reward_public_group_activity();

create or replace function public.reward_public_group_reaction()
returns trigger
language plpgsql
security definer
as $$
declare
  group_private boolean;
begin
  select coalesce(is_private, false) into group_private
  from public.groups
  where id = new.group_id;

  if group_private then
    return new;
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + 0.1
  where id = new.user_id;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (new.user_id, 0.1, 'public_group_reaction', jsonb_build_object('group_id', new.group_id, 'message_id', new.message_id, 'emoji', new.emoji));

  return new;
end;
$$;

drop trigger if exists on_group_reaction_reward_public_activity on public.group_message_reactions;
create trigger on_group_reaction_reward_public_activity
after insert on public.group_message_reactions
for each row execute procedure public.reward_public_group_reaction();

create or replace function public.reward_public_event_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  delta numeric;
begin
  if new.parent_message_id is null then
    delta := 0.3;
    insert into public.karma_ledger (user_id, delta, reason, metadata)
    values (new.sender_id, delta, 'public_event_post', jsonb_build_object('event_id', new.event_id, 'event_message_id', new.id));
  else
    delta := 0.2;
    insert into public.karma_ledger (user_id, delta, reason, metadata)
    values (new.sender_id, delta, 'public_event_reply', jsonb_build_object('event_id', new.event_id, 'event_message_id', new.id, 'parent_message_id', new.parent_message_id));
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + delta
  where id = new.sender_id;

  return new;
end;
$$;

drop trigger if exists on_event_message_reward_public_activity on public.event_messages;
create trigger on_event_message_reward_public_activity
after insert on public.event_messages
for each row execute procedure public.reward_public_event_activity();

create or replace function public.reward_public_event_reaction()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set karma_points = coalesce(karma_points, 0) + 0.1
  where id = new.user_id;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (new.user_id, 0.1, 'public_event_reaction', jsonb_build_object('event_id', new.event_id, 'message_id', new.message_id, 'emoji', new.emoji));

  return new;
end;
$$;

drop trigger if exists on_event_reaction_reward_public_activity on public.event_message_reactions;
create trigger on_event_reaction_reward_public_activity
after insert on public.event_message_reactions
for each row execute procedure public.reward_public_event_reaction();
