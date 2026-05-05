-- v087: harden remove/ban member flow.
-- Run this in Supabase before deploying the UI patch.

alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists is_moderator boolean not null default false,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_reason text,
  add column if not exists removed_by uuid references public.profiles(id);

-- Make sure the status values your UI uses are allowed.
alter table public.profiles
  drop constraint if exists profiles_membership_status_check;

alter table public.profiles
  add constraint profiles_membership_status_check
  check (
    membership_status is null
    or membership_status in ('active', 'pending', 'waiting', 'approved', 'removed', 'banned')
  );

create index if not exists idx_profiles_ban_status
  on public.profiles(is_banned, membership_status);

create or replace function public.ban_member_rpc(
  _target_user_id uuid,
  _reason text
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _requester uuid := auth.uid();
  _requester_email text;
  _is_allowed boolean := false;
begin
  if _requester is null then
    raise exception 'Not authenticated.';
  end if;

  select email into _requester_email
  from auth.users
  where id = _requester;

  select (
    lower(coalesce(_requester_email, '')) = 'alanaoldham@gmail.com'
    or exists (
      select 1
      from public.profiles p
      where p.id = _requester
        and coalesce(p.is_moderator, false) = true
        and coalesce(p.is_banned, false) = false
        and coalesce(p.membership_status, 'active') not in ('removed', 'banned')
    )
  ) into _is_allowed;

  if not _is_allowed then
    raise exception 'Only an admin or moderator can remove members.';
  end if;

  if _target_user_id = _requester then
    raise exception 'You cannot remove your own account with this action.';
  end if;

  update public.profiles
  set
    membership_status = 'banned',
    is_banned = true,
    removed_at = now(),
    removed_reason = nullif(trim(coalesce(_reason, '')), ''),
    removed_by = _requester
  where id = _target_user_id;

  if not found then
    raise exception 'Profile not found.';
  end if;

  delete from public.group_members
  where user_id = _target_user_id;

  delete from public.event_rsvps
  where user_id = _target_user_id;

  update public.waiting_room_candidates
  set status = 'removed',
      removed_at = now(),
      removed_reason = nullif(trim(coalesce(_reason, '')), '')
  where user_id = _target_user_id;

  -- Force logout if Supabase permits this from the SQL owner context.
  begin
    delete from auth.sessions
    where user_id = _target_user_id;
  exception when others then
    -- Some projects restrict direct auth schema changes. The profile ban still enforces app access.
    null;
  end;

  return jsonb_build_object(
    'removed', true,
    'target_user_id', _target_user_id,
    'removed_at', now()
  );
end;
$$;

grant execute on function public.ban_member_rpc(uuid, text) to authenticated;

-- Immediate ban for the reported account.
select public.ban_member_rpc(
  'b2904ae9-852f-459b-b1e7-3c6d739f4012'::uuid,
  'Removed and banned by admin due to abuse report'
);
