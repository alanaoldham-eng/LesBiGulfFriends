-- v094 Performance Sprint
-- Safe to run more than once.
-- Goal: reduce N+1 client queries and support high-traffic filters/orderings.

-- =========================================
-- 1) Corrected indexes from Supabase slow query report
-- =========================================

-- Friends
create index if not exists idx_friends_created_at
on public.friends(created_at desc);

create index if not exists idx_friends_user_a_created
on public.friends(user_a, created_at desc);

create index if not exists idx_friends_user_b_created
on public.friends(user_b, created_at desc);

-- Group membership
create index if not exists idx_group_members_user
on public.group_members(user_id);

create index if not exists idx_group_members_group
on public.group_members(group_id);

create index if not exists idx_group_members_group_user
on public.group_members(group_id, user_id);

-- Messages
create index if not exists idx_messages_sender
on public.messages(sender_id);

create index if not exists idx_messages_recipient
on public.messages(recipient_id);

create index if not exists idx_messages_recipient_created
on public.messages(recipient_id, created_at desc);

create index if not exists idx_messages_thread_sender_recipient_created
on public.messages(sender_id, recipient_id, created_at desc);

create index if not exists idx_messages_thread_recipient_sender_created
on public.messages(recipient_id, sender_id, created_at desc);

-- Friend requests
create index if not exists idx_friend_requests_target
on public.friend_requests(to_user, status, created_at desc);

create index if not exists idx_friend_requests_from
on public.friend_requests(from_user);

create index if not exists idx_friend_requests_from_to_status
on public.friend_requests(from_user, to_user, status);

-- Event invites
create index if not exists idx_event_invites_invitee
on public.event_invites(invitee_user_id);

create index if not exists idx_event_invites_inviter
on public.event_invites(inviter_id);

create index if not exists idx_event_invites_event
on public.event_invites(event_id);

create index if not exists idx_event_invites_event_invitee
on public.event_invites(event_id, invitee_user_id);

-- Events
create index if not exists idx_events_starts_at
on public.events(starts_at desc);

create index if not exists idx_events_public_starts_at
on public.events(is_public, starts_at desc);

create index if not exists idx_events_created_by_starts_at
on public.events(created_by, starts_at desc);

-- Notifications
create index if not exists idx_notifications_recipient_created
on public.in_app_notifications(recipient_user_id, created_at desc);

create index if not exists idx_notifications_recipient_unread
on public.in_app_notifications(recipient_user_id, read_at, created_at desc);

create index if not exists idx_notifications_event
on public.in_app_notifications(event_id);

-- Waiting room
create index if not exists idx_waiting_room_created
on public.waiting_room_candidates(created_at desc);

create index if not exists idx_waiting_room_status_created
on public.waiting_room_candidates(status, created_at desc);

create index if not exists idx_waiting_room_user
on public.waiting_room_candidates(user_id);

-- Profiles
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists is_moderator boolean not null default false;

create index if not exists idx_profiles_banned
on public.profiles(is_banned);

create index if not exists idx_profiles_status_banned
on public.profiles(membership_status, is_banned);

create index if not exists idx_profiles_karma
on public.profiles(karma_points desc);

-- Optional columns used by later group UI. Safe if already present.
alter table public.groups
  add column if not exists group_icon_emoji text,
  add column if not exists group_logo_url text;

-- =========================================
-- 2) RPC: friends + profile + latest DM in one query
-- Replaces client-side N+1: for each friend -> get latest message.
-- =========================================

create or replace function public.get_friends_with_latest_message_rpc(_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with friend_rows as (
    select
      case when f.user_a = _user_id then f.user_b else f.user_a end as friend_id,
      f.created_at as friendship_created_at
    from public.friends f
    where f.user_a = _user_id
       or f.user_b = _user_id
  ),
  latest_messages as (
    select
      case when m.sender_id = _user_id then m.recipient_id else m.sender_id end as friend_id,
      max(m.created_at) as last_message_at
    from public.messages m
    where m.sender_id = _user_id
       or m.recipient_id = _user_id
    group by 1
  ),
  visible_profiles as (
    select p.*
    from public.profiles p
    where coalesce(p.is_banned, false) = false
      and coalesce(p.membership_status, 'active') not in ('removed', 'banned')
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'bio', p.bio,
        'interests', p.interests,
        'photo_url', p.photo_url,
        'photo_urls', p.photo_urls,
        'city', p.city,
        'relationship_status', p.relationship_status,
        'karma_points', p.karma_points,
        'membership_status', p.membership_status,
        'is_banned', p.is_banned,
        'is_moderator', p.is_moderator,
        'created_at', p.created_at,
        'lastMessageAt', lm.last_message_at,
        'friendshipCreatedAt', fr.friendship_created_at
      )
      order by
        case when lm.last_message_at is null then 1 else 0 end,
        lm.last_message_at desc nulls last,
        p.karma_points desc nulls last,
        p.display_name asc
    ),
    '[]'::jsonb
  )
  from friend_rows fr
  join visible_profiles p on p.id = fr.friend_id
  left join latest_messages lm on lm.friend_id = fr.friend_id;
$$;

grant execute on function public.get_friends_with_latest_message_rpc(uuid) to authenticated;

-- =========================================
-- 3) RPC: incoming friend requests + sender profile in one query
-- Replaces loading every friend request then filtering client-side.
-- =========================================

create or replace function public.get_incoming_friend_requests_rpc(_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', fr.id,
        'from_user', fr.from_user,
        'to_user', fr.to_user,
        'status', fr.status,
        'created_at', fr.created_at,
        'from_profile', jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'photo_url', p.photo_url,
          'photo_urls', p.photo_urls,
          'bio', p.bio,
          'city', p.city,
          'karma_points', p.karma_points
        )
      )
      order by fr.created_at desc
    ),
    '[]'::jsonb
  )
  from public.friend_requests fr
  join public.profiles p on p.id = fr.from_user
  where fr.to_user = _user_id
    and fr.status = 'pending'
    and coalesce(p.is_banned, false) = false
    and coalesce(p.membership_status, 'active') not in ('removed', 'banned');
$$;

grant execute on function public.get_incoming_friend_requests_rpc(uuid) to authenticated;

-- =========================================
-- 4) RPC: group members + profile in one query
-- Replaces group_members query + second profiles IN query.
-- =========================================

create or replace function public.get_group_members_with_profiles_rpc(_group_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', gm.id,
        'group_id', gm.group_id,
        'user_id', gm.user_id,
        'role', gm.role,
        'created_at', gm.created_at,
        'profile', jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'photo_url', p.photo_url,
          'photo_urls', p.photo_urls,
          'karma_points', p.karma_points,
          'membership_status', p.membership_status,
          'is_banned', p.is_banned,
          'is_moderator', p.is_moderator
        )
      )
      order by p.karma_points desc nulls last, p.display_name asc
    ),
    '[]'::jsonb
  )
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = _group_id
    and coalesce(p.is_banned, false) = false
    and coalesce(p.membership_status, 'active') not in ('removed', 'banned');
$$;

grant execute on function public.get_group_members_with_profiles_rpc(uuid) to authenticated;

-- =========================================
-- 5) RPC: public/member groups + latest group message in one query
-- Replaces publicGroups + myGroups + latestMessages client fan-out.
-- =========================================

create or replace function public.get_public_and_member_groups_rpc(_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with candidate_groups as (
    select distinct g.*
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id
     and gm.user_id = _user_id
    where coalesce(g.is_private, false) = false
       or gm.user_id is not null
  ),
  latest as (
    select group_id, max(created_at) as latest_message_at
    from public.group_messages
    where group_id in (select id from candidate_groups)
    group by group_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'description', g.description,
        'location_tag', g.location_tag,
        'interest_tags', g.interest_tags,
        'created_by', g.created_by,
        'is_private', g.is_private,
        'created_at', g.created_at,
        'group_icon_emoji', g.group_icon_emoji,
        'group_logo_url', g.group_logo_url,
        'latest_message_at', latest.latest_message_at
      )
      order by
        case when lower(coalesce(g.name, '')) = 'main' then 0 else 1 end,
        coalesce(latest.latest_message_at, g.created_at) desc,
        g.name asc
    ),
    '[]'::jsonb
  )
  from candidate_groups g
  left join latest on latest.group_id = g.id;
$$;

grant execute on function public.get_public_and_member_groups_rpc(uuid) to authenticated;

-- =========================================
-- 6) Moderator RPC kept here because the Admin button has been unstable.
-- =========================================

create or replace function public.set_member_moderator_rpc(
  _target_user_id uuid,
  _enabled boolean
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _requester uuid := auth.uid();
  _requester_email text;
begin
  select email into _requester_email
  from auth.users
  where id = _requester;

  if lower(coalesce(_requester_email, '')) <> 'alanaoldham@gmail.com' then
    raise exception 'Only admin can change moderator status.';
  end if;

  update public.profiles
  set is_moderator = _enabled
  where id = _target_user_id;

  if not found then
    raise exception 'Profile not found.';
  end if;

  if _enabled then
    update public.group_members
    set role = 'mod'
    where user_id = _target_user_id
      and role <> 'owner';
  else
    update public.group_members
    set role = 'member'
    where user_id = _target_user_id
      and role = 'mod';
  end if;

  return jsonb_build_object(
    'updated', true,
    'user_id', _target_user_id,
    'is_moderator', _enabled
  );
end;
$$;

grant execute on function public.set_member_moderator_rpc(uuid, boolean) to authenticated;
