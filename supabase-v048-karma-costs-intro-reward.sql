-- v048 invite/event badges + karma costs + intro reward
alter table public.invites
  add column if not exists intro_rewarded_at timestamptz;

alter table public.event_invites
  add column if not exists sent_at timestamptz,
  add column if not exists joined_at timestamptz,
  add column if not exists error_message text,
  add column if not exists resend_message_id text;

create table if not exists public.karma_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_karma_ledger_user on public.karma_ledger(user_id);

alter table public.karma_ledger enable row level security;

drop policy if exists "karma_ledger_read_own" on public.karma_ledger;
create policy "karma_ledger_read_own"
on public.karma_ledger for select to authenticated
using (user_id = auth.uid());

create or replace function public.spend_karma_point(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
as $$
declare
  current_points integer;
begin
  select karma_points into current_points
  from public.profiles
  where id = p_user_id
  for update;

  if current_points is null then
    raise exception 'Profile not found';
  end if;

  if current_points < 1 then
    raise exception 'You need at least 1 karma point for this action.';
  end if;

  update public.profiles
  set karma_points = karma_points - 1
  where id = p_user_id;

  insert into public.karma_ledger (user_id, delta, reason)
  values (p_user_id, -1, p_reason);
end;
$$;

revoke all on function public.spend_karma_point(uuid, text) from public;
grant execute on function public.spend_karma_point(uuid, text) to authenticated;

create or replace function public.reward_intro_post_if_invited()
returns trigger
language plpgsql
security definer
as $$
declare
  inviter uuid;
  main_group_id uuid;
begin
  select id into main_group_id
  from public.groups
  where lower(name) = 'main'
  limit 1;

  if main_group_id is null or new.group_id <> main_group_id then
    return new;
  end if;

  select i.inviter_id
  into inviter
  from public.invites i
  where i.invitee_user_id = new.sender_id
    and i.status = 'joined'
    and i.intro_rewarded_at is null
  order by i.created_at asc
  limit 1;

  if inviter is null then
    return new;
  end if;

  update public.invites
  set intro_rewarded_at = now()
  where inviter_id = inviter
    and invitee_user_id = new.sender_id
    and status = 'joined'
    and intro_rewarded_at is null;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + 1
  where id = inviter;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (
    inviter,
    1,
    'invite_friend_posted_intro',
    jsonb_build_object('invitee_user_id', new.sender_id, 'group_id', new.group_id, 'group_message_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_group_message_reward_intro on public.group_messages;
create trigger on_group_message_reward_intro
after insert on public.group_messages
for each row execute procedure public.reward_intro_post_if_invited();
