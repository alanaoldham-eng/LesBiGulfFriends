create table if not exists public.moderation_removal_log (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  removed_by uuid,
  removed_by_email text,
  reason text not null,
  removed_at timestamptz not null default now()
);

alter table public.event_media add column if not exists moderation_status text not null default 'active', add column if not exists removed_reason text, add column if not exists removed_by uuid, add column if not exists removed_by_email text, add column if not exists removed_at timestamptz;
alter table public.group_messages add column if not exists moderation_status text not null default 'active', add column if not exists removed_reason text, add column if not exists removed_by uuid, add column if not exists removed_by_email text, add column if not exists removed_at timestamptz;
alter table public.event_messages add column if not exists moderation_status text not null default 'active', add column if not exists removed_reason text, add column if not exists removed_by uuid, add column if not exists removed_by_email text, add column if not exists removed_at timestamptz;
alter table public.waiting_room_candidates add column if not exists moderation_status text not null default 'active', add column if not exists removed_reason text, add column if not exists removed_by uuid, add column if not exists removed_by_email text, add column if not exists removed_at timestamptz;

create or replace function public.moderate_remove_content_rpc(_target_type text, _target_id uuid, _reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare _actor uuid := auth.uid(); _actor_email text := coalesce(auth.jwt() ->> 'email', null);
begin
  if _actor is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(_reason),'')='' then raise exception 'Removal reason is required'; end if;
  if _target_type='event_media' then update public.event_media set moderation_status='removed', removed_reason=trim(_reason), removed_by=_actor, removed_by_email=_actor_email, removed_at=now() where id=_target_id;
  elsif _target_type='group_messages' then update public.group_messages set moderation_status='removed', removed_reason=trim(_reason), removed_by=_actor, removed_by_email=_actor_email, removed_at=now() where id=_target_id;
  elsif _target_type='event_messages' then update public.event_messages set moderation_status='removed', removed_reason=trim(_reason), removed_by=_actor, removed_by_email=_actor_email, removed_at=now() where id=_target_id;
  elsif _target_type='waiting_room_candidates' then update public.waiting_room_candidates set moderation_status='removed', status='removed', removed_reason=trim(_reason), removed_by=_actor, removed_by_email=_actor_email, removed_at=now() where id=_target_id;
  else raise exception 'Unsupported target_type'; end if;
  if not found then raise exception 'Target row not found'; end if;
  insert into public.moderation_removal_log(target_type,target_id,removed_by,removed_by_email,reason) values(_target_type,_target_id,_actor,_actor_email,trim(_reason));
  return jsonb_build_object('target_type',_target_type,'target_id',_target_id,'removed',true);
end $$;

create or replace function public.delete_invite_rpc(_invite_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare _actor uuid := auth.uid(); _invite record;
begin
  if _actor is null then raise exception 'Not authenticated'; end if;
  select * into _invite from public.invites where id=_invite_id limit 1;
  if _invite.id is null then raise exception 'Invite not found'; end if;
  if coalesce(_invite.status,'') not in ('pending','failed') then raise exception 'Only pending or failed invites can be deleted'; end if;
  if _invite.inviter_id <> _actor then raise exception 'You can only delete your own invites'; end if;
  delete from public.invites where id=_invite_id;
  if not found then raise exception 'Invite was not deleted'; end if;
  return jsonb_build_object('id',_invite_id,'deleted',true);
end $$;

update storage.buckets set file_size_limit=104857600 where id in ('event-media','event_media','event-gallery','event_gallery','chat-media','profile-photos');
