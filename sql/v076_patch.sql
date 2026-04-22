delete from public.group_members a
using public.group_members b
where a.ctid < b.ctid
  and a.group_id = b.group_id
  and a.user_id = b.user_id;

create unique index if not exists group_members_group_user_uidx
  on public.group_members(group_id, user_id);

delete from public.user_badges a
using public.user_badges b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and coalesce(a.badge_key,'') = coalesce(b.badge_key,'')
  and coalesce(a.badge_label,'') = coalesce(b.badge_label,'');

create unique index if not exists user_badges_unique_badge
  on public.user_badges(user_id, badge_key, badge_label);

alter table public.profiles
  add column if not exists membership_status text not null default 'active',
  add column if not exists removed_reason text,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid;

create or replace function public.set_group_moderator_status_rpc(_group_id uuid,_user_id uuid,_make_moderator boolean)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare _actor uuid := auth.uid(); _actor_role text; _next_role text := case when _make_moderator then 'mod' else 'member' end; _new_role text;
begin
  if _actor is null then raise exception 'Not authenticated'; end if;
  select role into _actor_role from public.group_members where group_id=_group_id and user_id=_actor limit 1;
  if _actor_role is distinct from 'owner' then raise exception 'Only the owner can change moderator status'; end if;
  update public.group_members set role=_next_role where group_id=_group_id and user_id=_user_id;
  if not found then raise exception 'Group member not found'; end if;
  select role into _new_role from public.group_members where group_id=_group_id and user_id=_user_id limit 1;
  return jsonb_build_object('group_id',_group_id,'user_id',_user_id,'role',_new_role);
end $$;

create or replace function public.remove_member_from_group_rpc(_group_id uuid,_user_id uuid,_reason text)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare _actor uuid := auth.uid(); _actor_role text; _target_role text;
begin
  if _actor is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(_reason),'')='' then raise exception 'Removal reason is required'; end if;
  select role into _actor_role from public.group_members where group_id=_group_id and user_id=_actor limit 1;
  if _actor_role not in ('owner','mod') then raise exception 'You are not allowed to remove members'; end if;
  select role into _target_role from public.group_members where group_id=_group_id and user_id=_user_id limit 1;
  if _target_role is null then raise exception 'Group member not found'; end if;
  if _target_role='owner' then raise exception 'Owners cannot be removed here'; end if;
  if _actor_role='mod' and _target_role<>'member' then raise exception 'Moderators may only remove members'; end if;
  delete from public.group_members where group_id=_group_id and user_id=_user_id;
  if not found then raise exception 'Member was not removed from the group.'; end if;
  update public.profiles set membership_status='removed', removed_reason=trim(_reason), removed_at=now(), removed_by=_actor where id=_user_id;
  return jsonb_build_object('group_id',_group_id,'user_id',_user_id,'removed',true);
end $$;

create or replace function public.delete_owned_event_rpc(_event_id uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
declare _actor uuid := auth.uid(); _event record;
begin
  if _actor is null then raise exception 'Not authenticated'; end if;
  select id, created_by, created_at, starts_at into _event from public.events where id=_event_id limit 1;
  if _event.id is null then raise exception 'Event not found'; end if;
  if _event.created_by <> _actor then raise exception 'Event not owned by current user'; end if;
  if _event.starts_at < now() and _event.created_at::date <> now()::date then raise exception 'Past events can only be deleted on the day they were created'; end if;
  delete from public.events where id=_event_id;
  if not found then raise exception 'Event was not deleted.'; end if;
  return jsonb_build_object('id',_event_id,'deleted',true);
end $$;

create or replace function public.delete_waiting_candidate_rpc(_candidate_id uuid)
returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  delete from public.waiting_room_candidates where id=_candidate_id;
  if not found then raise exception 'Candidate not found'; end if;
  return jsonb_build_object('id',_candidate_id,'deleted',true);
end $$;
