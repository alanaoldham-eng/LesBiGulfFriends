-- v049 invite FK fix + hardened invite/friendship/karma triggers

alter table public.invites
drop constraint if exists invites_invitee_user_id_fkey;

alter table public.invites
add constraint invites_invitee_user_id_fkey
foreign key (invitee_user_id)
references auth.users(id)
on delete set null;

alter table public.event_invites
drop constraint if exists event_invites_invitee_user_id_fkey;

alter table public.event_invites
add constraint event_invites_invitee_user_id_fkey
foreign key (invitee_user_id)
references auth.users(id)
on delete set null;

create or replace function public.handle_invite_reward()
returns trigger
language plpgsql
security definer
as $$
declare
  invited_email text;
  inv record;
  inviter_profile_exists boolean;
  invitee_profile_exists boolean;
  a uuid;
  b uuid;
begin
  select email into invited_email from auth.users where id = new.id;
  if invited_email is null then
    return new;
  end if;

  for inv in
    select *
    from public.invites
    where lower(invitee_email) = lower(invited_email)
      and status in ('pending', 'sent')
  loop
    update public.invites
      set status = 'joined',
          invitee_user_id = new.id,
          joined_at = now()
    where id = inv.id;

    select exists(select 1 from public.profiles where id = inv.inviter_id) into inviter_profile_exists;
    select exists(select 1 from public.profiles where id = new.id) into invitee_profile_exists;

    if inviter_profile_exists and invitee_profile_exists then
      a := least(inv.inviter_id, new.id);
      b := greatest(inv.inviter_id, new.id);

      insert into public.friends (user_a, user_b)
      values (a, b)
      on conflict (user_a, user_b) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_invite_reward on auth.users;
create trigger on_auth_user_created_invite_reward
after insert on auth.users
for each row execute procedure public.handle_invite_reward();

create or replace function public.handle_event_invite_join()
returns trigger
language plpgsql
security definer
as $$
declare
  invited_email text;
begin
  select email into invited_email from auth.users where id = new.id;
  if invited_email is null then
    return new;
  end if;

  update public.event_invites
    set status = 'joined',
        invitee_user_id = new.id,
        joined_at = now()
  where lower(invitee_email) = lower(invited_email)
    and status in ('pending', 'sent');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_event_invite_join on auth.users;
create trigger on_auth_user_created_event_invite_join
after insert on auth.users
for each row execute procedure public.handle_event_invite_join();

create or replace function public.handle_profile_created_backfill_friendships()
returns trigger
language plpgsql
security definer
as $$
declare
  inv record;
  a uuid;
  b uuid;
begin
  for inv in
    select inviter_id, invitee_user_id
    from public.invites
    where invitee_user_id = new.id
      and status = 'joined'
  loop
    if exists(select 1 from public.profiles where id = inv.inviter_id) then
      a := least(inv.inviter_id, new.id);
      b := greatest(inv.inviter_id, new.id);

      insert into public.friends (user_a, user_b)
      values (a, b)
      on conflict (user_a, user_b) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_profile_created_backfill_friendships on public.profiles;
create trigger on_profile_created_backfill_friendships
after insert on public.profiles
for each row execute procedure public.handle_profile_created_backfill_friendships();

insert into public.friends (user_a, user_b)
select distinct
  least(i.inviter_id, i.invitee_user_id),
  greatest(i.inviter_id, i.invitee_user_id)
from public.invites i
join public.profiles p1 on p1.id = i.inviter_id
join public.profiles p2 on p2.id = i.invitee_user_id
where i.status = 'joined'
  and i.invitee_user_id is not null
on conflict (user_a, user_b) do nothing;
