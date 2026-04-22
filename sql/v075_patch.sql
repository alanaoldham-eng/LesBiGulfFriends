-- 075 patch: moderation, badge dedupe, event media interactions

alter table public.profiles
  add column if not exists membership_status text not null default 'active',
  add column if not exists removed_reason text,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by uuid;

create index if not exists idx_profiles_membership_status
  on public.profiles(membership_status);

-- Remove duplicate badges, keeping the newest row per user/badge/label
with ranked as (
  select id,
         row_number() over (
           partition by user_id, badge_key, badge_label
           order by created_at desc nulls last, id desc
         ) as rn
  from public.user_badges
)
delete from public.user_badges ub
using ranked r
where ub.id = r.id
  and r.rn > 1;

create unique index if not exists idx_user_badges_user_key_label_unique
  on public.user_badges(user_id, badge_key, badge_label);

create table if not exists public.event_media_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_id uuid not null references public.event_media(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_media_reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_id uuid not null references public.event_media(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_event_media_reactions_unique
  on public.event_media_reactions(media_id, user_id, emoji);

create index if not exists idx_event_media_comments_event_media_created
  on public.event_media_comments(event_id, media_id, created_at desc);

create index if not exists idx_event_media_reactions_event_media
  on public.event_media_reactions(event_id, media_id, created_at desc);

alter table public.event_media_comments enable row level security;
alter table public.event_media_reactions enable row level security;

drop policy if exists "event_media_comments_read_all" on public.event_media_comments;
create policy "event_media_comments_read_all"
on public.event_media_comments for select to authenticated using (true);

drop policy if exists "event_media_comments_insert_own" on public.event_media_comments;
create policy "event_media_comments_insert_own"
on public.event_media_comments for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "event_media_reactions_read_all" on public.event_media_reactions;
create policy "event_media_reactions_read_all"
on public.event_media_reactions for select to authenticated using (true);

drop policy if exists "event_media_reactions_insert_own" on public.event_media_reactions;
create policy "event_media_reactions_insert_own"
on public.event_media_reactions for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "event_media_reactions_delete_own" on public.event_media_reactions;
create policy "event_media_reactions_delete_own"
on public.event_media_reactions for delete to authenticated using (user_id = auth.uid());
