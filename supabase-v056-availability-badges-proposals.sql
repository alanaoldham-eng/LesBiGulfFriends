-- v056 standings under snapshot, availability, badges, proposals, and vote rewards

create table if not exists public.member_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_member_availability_user on public.member_availability(user_id);
create index if not exists idx_member_availability_time on public.member_availability(start_at, end_at);

alter table public.member_availability enable row level security;

drop policy if exists "availability_select_all" on public.member_availability;
create policy "availability_select_all"
on public.member_availability for select to authenticated
using (true);

drop policy if exists "availability_insert_own" on public.member_availability;
create policy "availability_insert_own"
on public.member_availability for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "availability_update_own" on public.member_availability;
create policy "availability_update_own"
on public.member_availability for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "availability_delete_own" on public.member_availability;
create policy "availability_delete_own"
on public.member_availability for delete to authenticated
using (user_id = auth.uid());

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,
  badge_label text not null,
  emoji text not null,
  election_key text,
  created_at timestamptz not null default now(),
  unique (user_id, badge_key, coalesce(election_key, ''))
);

create index if not exists idx_user_badges_user on public.user_badges(user_id);

alter table public.user_badges enable row level security;

drop policy if exists "badges_select_all" on public.user_badges;
create policy "badges_select_all"
on public.user_badges for select to authenticated
using (true);

create or replace function public.grant_badge(p_user_id uuid, p_badge_key text, p_badge_label text, p_emoji text, p_election_key text default null)
returns void
language plpgsql
security definer
as $$
declare
  caller_email text;
begin
  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if caller_email <> 'alanaoldham@gmail.com' then
    raise exception 'Not authorized to grant badge';
  end if;

  insert into public.user_badges (user_id, badge_key, badge_label, emoji, election_key)
  values (p_user_id, p_badge_key, p_badge_label, p_emoji, p_election_key)
  on conflict do nothing;
end;
$$;

revoke all on function public.grant_badge(uuid, text, text, text, text) from public;
grant execute on function public.grant_badge(uuid, text, text, text, text) to authenticated;

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  election_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_value text not null check (vote_value in ('yes','no','abstain')),
  created_at timestamptz not null default now(),
  unique (proposal_id, user_id)
);

alter table public.proposals enable row level security;
alter table public.proposal_votes enable row level security;

drop policy if exists "proposals_select_all" on public.proposals;
create policy "proposals_select_all"
on public.proposals for select to authenticated
using (true);

drop policy if exists "proposals_insert_admin" on public.proposals;
create policy "proposals_insert_admin"
on public.proposals for insert to authenticated
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'alanaoldham@gmail.com');

drop policy if exists "proposal_votes_select_all" on public.proposal_votes;
create policy "proposal_votes_select_all"
on public.proposal_votes for select to authenticated
using (true);

drop policy if exists "proposal_votes_insert_own" on public.proposal_votes;
create policy "proposal_votes_insert_own"
on public.proposal_votes for insert to authenticated
with check (user_id = auth.uid());

create or replace function public.handle_proposal_vote_rewards()
returns trigger
language plpgsql
security definer
as $$
declare
  proposal_rec record;
  profile_rec record;
  vote_badge_key text;
  vote_badge_label text;
begin
  select * into proposal_rec from public.proposals where id = new.proposal_id;
  select * into profile_rec from public.profiles where id = new.user_id;

  if proposal_rec is null then
    return new;
  end if;

  if proposal_rec.expires_at <= now() then
    raise exception 'Proposal has expired';
  end if;

  if profile_rec is null or btrim(coalesce(profile_rec.display_name, '')) = '' or btrim(coalesce(profile_rec.bio, '')) = '' then
    raise exception 'Complete profile required to vote';
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + 1
  where id = new.user_id;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (
    new.user_id,
    1,
    'proposal_vote',
    jsonb_build_object('proposal_id', new.proposal_id, 'election_key', proposal_rec.election_key, 'vote_value', new.vote_value)
  );

  vote_badge_key := 'i_voted:' || proposal_rec.election_key;
  vote_badge_label := 'I Voted';

  insert into public.user_badges (user_id, badge_key, badge_label, emoji, election_key)
  values (new.user_id, vote_badge_key, vote_badge_label, '🗳️', proposal_rec.election_key)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_proposal_vote_rewards on public.proposal_votes;
create trigger on_proposal_vote_rewards
before insert on public.proposal_votes
for each row execute procedure public.handle_proposal_vote_rewards();
