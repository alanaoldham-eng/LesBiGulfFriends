alter table public.profiles
  add column if not exists membership_status text not null default 'active',
  add column if not exists removed_reason text,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid;

create index if not exists idx_profiles_membership_status
  on public.profiles(membership_status);
