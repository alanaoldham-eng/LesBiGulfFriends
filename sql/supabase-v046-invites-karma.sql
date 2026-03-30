-- v046 invites + karma
alter table public.profiles
  add column if not exists karma_points integer not null default 0;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  invitee_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','joined','canceled')),
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (inviter_id, invitee_email)
);

create index if not exists idx_invites_inviter on public.invites(inviter_id);
create index if not exists idx_invites_email on public.invites(invitee_email);

alter table public.invites enable row level security;

drop policy if exists "invites_read_own" on public.invites;
create policy "invites_read_own"
on public.invites for select to authenticated
using (inviter_id = auth.uid());

drop policy if exists "invites_insert_own" on public.invites;
create policy "invites_insert_own"
on public.invites for insert to authenticated
with check (inviter_id = auth.uid());

drop policy if exists "invites_update_none" on public.invites;
create policy "invites_update_none"
on public.invites for update to authenticated
using (false)
with check (false);

create or replace function public.handle_invite_reward()
returns trigger
language plpgsql
security definer
as $$
declare
  invited_email text;
  inv record;
  a uuid;
  b uuid;
begin
  select email into invited_email from auth.users where id = new.id;
  if invited_email is null then
    return new;
  end if;

  for inv in
    select * from public.invites
    where lower(invitee_email) = lower(invited_email)
      and status = 'pending'
  loop
    update public.invites
      set status = 'joined',
          invitee_user_id = new.id,
          joined_at = now()
    where id = inv.id;

    a := least(inv.inviter_id, new.id);
    b := greatest(inv.inviter_id, new.id);

    insert into public.friends (user_a, user_b)
    values (a, b)
    on conflict (user_a, user_b) do nothing;

    update public.profiles
      set karma_points = coalesce(karma_points, 0) + 1
    where id = inv.inviter_id;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_invite_reward on auth.users;
create trigger on_auth_user_created_invite_reward
after insert on auth.users
for each row execute procedure public.handle_invite_reward();

-- backfill karma for already joined invites
update public.invites i
set status = 'joined',
    invitee_user_id = p.id,
    joined_at = coalesce(i.joined_at, now())
from auth.users au
join public.profiles p on p.id = au.id
where lower(au.email) = lower(i.invitee_email)
  and i.status = 'pending';

insert into public.friends (user_a, user_b)
select distinct least(i.inviter_id, i.invitee_user_id), greatest(i.inviter_id, i.invitee_user_id)
from public.invites i
where i.status = 'joined' and i.invitee_user_id is not null
on conflict (user_a, user_b) do nothing;
