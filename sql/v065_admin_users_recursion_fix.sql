alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
drop policy if exists "admin_users_select_own_or_admin" on public.admin_users;
drop policy if exists "admin_users_admin_insert" on public.admin_users;
drop policy if exists "admin_users_admin_update" on public.admin_users;
drop policy if exists "admin_users_admin_delete" on public.admin_users;

create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = _uid
  );
$$;
