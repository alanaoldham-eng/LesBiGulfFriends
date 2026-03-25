-- v050 onboarding cleanup + private groups + moderation + karma visibility support

-- Allow members to see groups they belong to, including private ones
alter table public.groups enable row level security;

drop policy if exists "groups_read_public" on public.groups;
drop policy if exists "groups_read_public_or_member" on public.groups;

create policy "groups_read_public_or_member"
on public.groups
for select to authenticated
using (
  is_private = false
  or created_by = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);

-- Allow members of a group to read group membership rows
alter table public.group_members enable row level security;

drop policy if exists "group_members_read_own" on public.group_members;
create policy "group_members_read_group_members"
on public.group_members
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
  )
);

-- Allow joining public groups yourself, and allow creator/owner row inserts on creation
drop policy if exists "group_members_insert_self_public" on public.group_members;
create policy "group_members_insert_self_or_owner"
on public.group_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.is_private = false
    )
    or role = 'owner'
  )
);

-- Allow owner/mod moderation
drop policy if exists "group_members_delete_self" on public.group_members;
create policy "group_members_delete_self_or_moderator"
on public.group_members
for delete to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'mod')
  )
);

drop policy if exists "group_members_update_moderator" on public.group_members;
create policy "group_members_update_moderator"
on public.group_members
for update to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'mod')
  )
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'mod')
  )
);

-- Make sure Main group members can still read messages
drop policy if exists "group_messages_read_if_member" on public.group_messages;
create policy "group_messages_read_if_member"
on public.group_messages
for select to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "group_messages_insert_if_member" on public.group_messages;
create policy "group_messages_insert_if_member"
on public.group_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.group_members gm
    where gm.group_id = group_messages.group_id
      and gm.user_id = auth.uid()
  )
);
