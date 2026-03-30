-- =========================================================
-- v064 web rollup package
-- From v60-games polish -> current web roadmap state
-- Includes:
-- - safe admin_users setup
-- - non-recursive group_members/profiles policies
-- - curated content
-- - anonymous confessions
-- - blind chat
-- - games framework + starter definitions
-- - waiting room hard gate + main group post trigger
-- - consensual roleplay game
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin_user(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users au where au.user_id = _user_id);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- Safe policy reset for profiles and group_members
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select to authenticated using (true);

alter table public.group_members enable row level security;
drop policy if exists "gm_update_owner" on public.group_members;
drop policy if exists "group_members_select_own_group_memberships" on public.group_members;
drop policy if exists "gm_select_own" on public.group_members;
drop policy if exists "gm_delete_self" on public.group_members;
drop policy if exists "gm_insert_self_public" on public.group_members;
drop policy if exists "group_members_select_visible_group_members" on public.group_members;
drop policy if exists "group_members_select_authenticated" on public.group_members;
drop policy if exists "group_members_insert_self" on public.group_members;
drop policy if exists "group_members_update_self" on public.group_members;
drop policy if exists "group_members_delete_self" on public.group_members;

create policy "group_members_select_authenticated"
on public.group_members for select to authenticated using (true);
create policy "group_members_insert_self"
on public.group_members for insert to authenticated with check (auth.uid() = user_id);
create policy "group_members_update_self"
on public.group_members for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "group_members_delete_self"
on public.group_members for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- Curated content
-- ---------------------------------------------------------
create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_type text not null check (source_type in ('podcast','news','blog')),
  title text not null,
  description text not null default '',
  website_url text,
  rss_url text,
  external_links jsonb not null default '{}'::jsonb,
  artwork_url text,
  editorial_note text not null default '',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  featured_rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.content_sources(id) on delete cascade,
  guid text not null,
  slug text not null,
  title text not null,
  description text not null default '',
  editorial_summary text not null default '',
  author_name text,
  published_at timestamptz,
  item_url text,
  audio_url text,
  image_url text,
  duration_text text,
  raw_data jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, guid)
);
create table if not exists public.user_saved_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, content_item_id)
);
create table if not exists public.editorial_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.editorial_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.editorial_collections(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  sort_order integer not null default 100,
  unique (collection_id, content_item_id)
);
alter table public.content_sources enable row level security;
alter table public.content_items enable row level security;
alter table public.user_saved_content enable row level security;
alter table public.editorial_collections enable row level security;
alter table public.editorial_collection_items enable row level security;
drop policy if exists "content_sources_select_authenticated" on public.content_sources;
create policy "content_sources_select_authenticated" on public.content_sources for select to authenticated using (is_active = true);
drop policy if exists "content_items_select_authenticated" on public.content_items;
create policy "content_items_select_authenticated" on public.content_items for select to authenticated using (is_published = true and is_hidden = false);
drop policy if exists "user_saved_content_select_own" on public.user_saved_content;
create policy "user_saved_content_select_own" on public.user_saved_content for select to authenticated using (auth.uid() = user_id);
drop policy if exists "user_saved_content_insert_own" on public.user_saved_content;
create policy "user_saved_content_insert_own" on public.user_saved_content for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "user_saved_content_delete_own" on public.user_saved_content;
create policy "user_saved_content_delete_own" on public.user_saved_content for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "editorial_collections_select_authenticated" on public.editorial_collections;
create policy "editorial_collections_select_authenticated" on public.editorial_collections for select to authenticated using (is_active = true);
drop policy if exists "editorial_collection_items_select_authenticated" on public.editorial_collection_items;
create policy "editorial_collection_items_select_authenticated" on public.editorial_collection_items for select to authenticated using (true);
drop trigger if exists set_content_sources_updated_at on public.content_sources;
create trigger set_content_sources_updated_at before update on public.content_sources for each row execute function public.set_updated_at();
drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
insert into public.content_sources (slug, source_type, title, description, website_url, rss_url, external_links, editorial_note, is_active, is_featured, featured_rank)
values ('handsome','podcast','Handsome','A featured comedy podcast for members.','https://handsomepod.com','https://rss.art19.com/handsome',jsonb_build_object('website','https://handsomepod.com','apple','https://podcasts.apple.com/','spotify','https://open.spotify.com/','youtube','https://www.youtube.com/'),'Funny, warm, and easy to throw on during a walk or drive.',true,true,1)
on conflict (slug) do update set title=excluded.title,description=excluded.description,website_url=excluded.website_url,rss_url=excluded.rss_url,external_links=excluded.external_links,editorial_note=excluded.editorial_note,is_active=excluded.is_active,is_featured=excluded.is_featured,featured_rank=excluded.featured_rank,updated_at=now();
insert into public.editorial_collections (slug,title,description,is_active)
values ('staff-picks','Staff Picks','Fresh curated listens and reads for members.',true)
on conflict (slug) do update set title=excluded.title,description=excluded.description,is_active=excluded.is_active;

-- ---------------------------------------------------------
-- Anonymous confessional
-- ---------------------------------------------------------
create table if not exists public.anonymous_posts (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(trim(body)) > 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_hidden boolean not null default false,
  is_locked boolean not null default false,
  reply_count integer not null default 0,
  reaction_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.anonymous_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.anonymous_posts(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.anonymous_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.anonymous_posts(id) on delete cascade,
  reply_id uuid references public.anonymous_replies(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart','hug','same','support')),
  created_at timestamptz not null default now(),
  constraint anonymous_reactions_target_check check ((post_id is not null and reply_id is null) or (post_id is null and reply_id is not null))
);
create table if not exists public.anonymous_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.anonymous_posts(id) on delete cascade,
  reply_id uuid references public.anonymous_replies(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint anonymous_reports_target_check check ((post_id is not null and reply_id is null) or (post_id is null and reply_id is not null))
);
create unique index if not exists anonymous_reactions_unique_post on public.anonymous_reactions (post_id, created_by, reaction_type) where post_id is not null;
create unique index if not exists anonymous_reactions_unique_reply on public.anonymous_reactions (reply_id, created_by, reaction_type) where reply_id is not null;
create unique index if not exists anonymous_reports_unique_post on public.anonymous_reports (post_id, reported_by) where post_id is not null;
create unique index if not exists anonymous_reports_unique_reply on public.anonymous_reports (reply_id, reported_by) where reply_id is not null;
alter table public.anonymous_posts enable row level security;
alter table public.anonymous_replies enable row level security;
alter table public.anonymous_reactions enable row level security;
alter table public.anonymous_reports enable row level security;
drop policy if exists "anonymous_posts_select_visible" on public.anonymous_posts;
create policy "anonymous_posts_select_visible" on public.anonymous_posts for select to authenticated using (is_hidden = false);
drop policy if exists "anonymous_posts_insert_own" on public.anonymous_posts;
create policy "anonymous_posts_insert_own" on public.anonymous_posts for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "anonymous_posts_update_admin_only" on public.anonymous_posts;
create policy "anonymous_posts_update_admin_only" on public.anonymous_posts for update to authenticated using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
drop policy if exists "anonymous_posts_delete_own_or_admin" on public.anonymous_posts;
create policy "anonymous_posts_delete_own_or_admin" on public.anonymous_posts for delete to authenticated using (auth.uid() = created_by or public.is_admin_user(auth.uid()));
drop policy if exists "anonymous_replies_select_visible" on public.anonymous_replies;
create policy "anonymous_replies_select_visible" on public.anonymous_replies for select to authenticated using (is_hidden = false);
drop policy if exists "anonymous_replies_insert_own" on public.anonymous_replies;
create policy "anonymous_replies_insert_own" on public.anonymous_replies for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "anonymous_replies_update_admin_only" on public.anonymous_replies;
create policy "anonymous_replies_update_admin_only" on public.anonymous_replies for update to authenticated using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));
drop policy if exists "anonymous_replies_delete_own_or_admin" on public.anonymous_replies;
create policy "anonymous_replies_delete_own_or_admin" on public.anonymous_replies for delete to authenticated using (auth.uid() = created_by or public.is_admin_user(auth.uid()));
drop policy if exists "anonymous_reactions_select_visible" on public.anonymous_reactions;
create policy "anonymous_reactions_select_visible" on public.anonymous_reactions for select to authenticated using (true);
drop policy if exists "anonymous_reactions_insert_own" on public.anonymous_reactions;
create policy "anonymous_reactions_insert_own" on public.anonymous_reactions for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "anonymous_reactions_delete_own" on public.anonymous_reactions;
create policy "anonymous_reactions_delete_own" on public.anonymous_reactions for delete to authenticated using (auth.uid() = created_by or public.is_admin_user(auth.uid()));
drop policy if exists "anonymous_reports_insert_own" on public.anonymous_reports;
create policy "anonymous_reports_insert_own" on public.anonymous_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "anonymous_reports_select_admin_only" on public.anonymous_reports;
create policy "anonymous_reports_select_admin_only" on public.anonymous_reports for select to authenticated using (public.is_admin_user(auth.uid()));
drop trigger if exists set_anonymous_posts_updated_at on public.anonymous_posts;
create trigger set_anonymous_posts_updated_at before update on public.anonymous_posts for each row execute function public.set_updated_at();
drop trigger if exists set_anonymous_replies_updated_at on public.anonymous_replies;
create trigger set_anonymous_replies_updated_at before update on public.anonymous_replies for each row execute function public.set_updated_at();
create or replace function public.handle_anonymous_reply_count() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then update public.anonymous_posts set reply_count = reply_count + 1 where id = new.post_id; return new; elsif tg_op = 'DELETE' then update public.anonymous_posts set reply_count = greatest(reply_count - 1, 0) where id = old.post_id; return old; end if; return null; end; $$;
drop trigger if exists anonymous_reply_count_insert on public.anonymous_replies;
create trigger anonymous_reply_count_insert after insert on public.anonymous_replies for each row execute function public.handle_anonymous_reply_count();
drop trigger if exists anonymous_reply_count_delete on public.anonymous_replies;
create trigger anonymous_reply_count_delete after delete on public.anonymous_replies for each row execute function public.handle_anonymous_reply_count();

-- ---------------------------------------------------------
-- Blind chat
-- ---------------------------------------------------------
create table if not exists public.blind_chat_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('waiting','matched','cancelled')),
  created_at timestamptz not null default now(),
  matched_at timestamptz,
  unique (user_id, status)
);
create table if not exists public.blind_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('active','revealed','ended','reported')),
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  ended_at timestamptz
);
create table if not exists public.blind_chat_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blind_chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  alias text not null,
  reveal_requested boolean not null default false,
  reveal_accepted boolean not null default false,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create table if not exists public.blind_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blind_chat_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.blind_chat_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blind_chat_sessions(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (session_id, reported_by)
);
create table if not exists public.blind_chat_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blind_chat_blocks_no_self check (user_id <> blocked_user_id),
  unique (user_id, blocked_user_id)
);
create or replace function public.is_blind_chat_participant(_session_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.blind_chat_participants p where p.session_id = _session_id and p.user_id = _user_id);
$$;
alter table public.blind_chat_queue enable row level security;
alter table public.blind_chat_sessions enable row level security;
alter table public.blind_chat_participants enable row level security;
alter table public.blind_chat_messages enable row level security;
alter table public.blind_chat_reports enable row level security;
alter table public.blind_chat_blocks enable row level security;
drop policy if exists "blind_chat_queue_select_own" on public.blind_chat_queue;
create policy "blind_chat_queue_select_own" on public.blind_chat_queue for select to authenticated using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_queue_insert_own" on public.blind_chat_queue;
create policy "blind_chat_queue_insert_own" on public.blind_chat_queue for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "blind_chat_queue_update_own_or_admin" on public.blind_chat_queue;
create policy "blind_chat_queue_update_own_or_admin" on public.blind_chat_queue for update to authenticated using (auth.uid() = user_id or public.is_admin_user(auth.uid())) with check (auth.uid() = user_id or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_sessions_select_participants" on public.blind_chat_sessions;
create policy "blind_chat_sessions_select_participants" on public.blind_chat_sessions for select to authenticated using (public.is_blind_chat_participant(id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_participants_select_participants" on public.blind_chat_participants;
create policy "blind_chat_participants_select_participants" on public.blind_chat_participants for select to authenticated using (public.is_blind_chat_participant(session_id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_messages_select_participants" on public.blind_chat_messages;
create policy "blind_chat_messages_select_participants" on public.blind_chat_messages for select to authenticated using (public.is_blind_chat_participant(session_id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_messages_insert_participants" on public.blind_chat_messages;
create policy "blind_chat_messages_insert_participants" on public.blind_chat_messages for insert to authenticated with check (auth.uid() = sender_id and public.is_blind_chat_participant(session_id, auth.uid()));
drop policy if exists "blind_chat_reports_insert_own" on public.blind_chat_reports;
create policy "blind_chat_reports_insert_own" on public.blind_chat_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "blind_chat_reports_select_admin_only" on public.blind_chat_reports;
create policy "blind_chat_reports_select_admin_only" on public.blind_chat_reports for select to authenticated using (public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_blocks_select_own" on public.blind_chat_blocks;
create policy "blind_chat_blocks_select_own" on public.blind_chat_blocks for select to authenticated using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_blocks_insert_own" on public.blind_chat_blocks;
create policy "blind_chat_blocks_insert_own" on public.blind_chat_blocks for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- Games framework
-- ---------------------------------------------------------
create table if not exists public.game_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  game_type text not null check (game_type in ('this_or_that','daily_prompt','hot_take','blind_pair','group_game')),
  description text not null default '',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create table if not exists public.game_instances (
  id uuid primary key default gen_random_uuid(),
  game_definition_id uuid not null references public.game_definitions(id) on delete cascade,
  title text not null,
  body text not null default '',
  option_a text,
  option_b text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  is_anonymous boolean not null default false,
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.game_participation (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid not null references public.game_instances(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice_key text,
  response_text text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_instance_id, user_id)
);
create table if not exists public.game_reactions (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid references public.game_instances(id) on delete cascade,
  participation_id uuid references public.game_participation(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like','fun','agree','fire')),
  created_at timestamptz not null default now(),
  constraint game_reactions_target_check check ((game_instance_id is not null and participation_id is null) or (game_instance_id is null and participation_id is not null))
);
create table if not exists public.game_reports (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid references public.game_instances(id) on delete cascade,
  participation_id uuid references public.game_participation(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint game_reports_target_check check ((game_instance_id is not null and participation_id is null) or (game_instance_id is null and participation_id is not null))
);
alter table public.game_definitions enable row level security;
alter table public.game_instances enable row level security;
alter table public.game_participation enable row level security;
alter table public.game_reactions enable row level security;
alter table public.game_reports enable row level security;
drop policy if exists "game_definitions_select_active" on public.game_definitions;
create policy "game_definitions_select_active" on public.game_definitions for select to authenticated using (is_active = true);
drop policy if exists "game_instances_select_visible" on public.game_instances;
create policy "game_instances_select_visible" on public.game_instances for select to authenticated using (is_active = true and (group_id is null or exists (select 1 from public.group_members gm where gm.group_id = game_instances.group_id and gm.user_id = auth.uid())));
drop policy if exists "game_participation_select_visible" on public.game_participation;
create policy "game_participation_select_visible" on public.game_participation for select to authenticated using (exists (select 1 from public.game_instances gi where gi.id = game_participation.game_instance_id and gi.is_active = true));
drop policy if exists "game_participation_insert_own" on public.game_participation;
create policy "game_participation_insert_own" on public.game_participation for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "game_participation_update_own" on public.game_participation;
create policy "game_participation_update_own" on public.game_participation for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "game_reactions_select_visible" on public.game_reactions;
create policy "game_reactions_select_visible" on public.game_reactions for select to authenticated using (true);
drop policy if exists "game_reactions_insert_own" on public.game_reactions;
create policy "game_reactions_insert_own" on public.game_reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "game_reports_insert_own" on public.game_reports;
create policy "game_reports_insert_own" on public.game_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "game_reports_select_admin_only" on public.game_reports;
create policy "game_reports_select_admin_only" on public.game_reports for select to authenticated using (public.is_admin_user(auth.uid()));
drop trigger if exists set_game_instances_updated_at on public.game_instances;
create trigger set_game_instances_updated_at before update on public.game_instances for each row execute function public.set_updated_at();
drop trigger if exists set_game_participation_updated_at on public.game_participation;
create trigger set_game_participation_updated_at before update on public.game_participation for each row execute function public.set_updated_at();
insert into public.game_definitions (slug,name,game_type,description,is_active,is_featured,sort_order)
values ('this-or-that','This or That','this_or_that','Quick choice games with instant participation.',true,true,10),('daily-prompt','Daily Prompt','daily_prompt','A fresh prompt for members each day.',true,true,20),('hot-takes','Hot Takes','hot_take','Short opinions, reactions, and discussion.',true,true,30)
on conflict (slug) do update set name=excluded.name,game_type=excluded.game_type,description=excluded.description,is_active=excluded.is_active,is_featured=excluded.is_featured,sort_order=excluded.sort_order;

-- ---------------------------------------------------------
-- Waiting room hard gate
-- ---------------------------------------------------------
alter table public.profiles add column if not exists membership_status text not null default 'waiting';
alter table public.profiles drop constraint if exists profiles_membership_status_check;
alter table public.profiles add constraint profiles_membership_status_check check (membership_status in ('waiting','active'));

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  display_name text,
  rejection_reason_key text,
  rejection_reason_text text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.waiting_room_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null check (status in ('waiting','questioned','approved','active')),
  intro_video_url text,
  intro_video_submitted_at timestamptz,
  sponsor_user_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.waiting_room_questions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.waiting_room_candidates(id) on delete cascade,
  asked_by uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and char_length(body) <= 1000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.waiting_room_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.waiting_room_questions(id) on delete cascade,
  candidate_id uuid not null references public.waiting_room_candidates(id) on delete cascade,
  body text,
  video_url text,
  created_at timestamptz not null default now(),
  constraint waiting_room_answers_body_or_video_check check (coalesce(nullif(trim(body),''),'') <> '' or video_url is not null)
);
create table if not exists public.waiting_room_votes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.waiting_room_candidates(id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null check (vote in ('approve','reject')),
  created_at timestamptz not null default now(),
  unique (candidate_id, reviewer_user_id)
);
create table if not exists public.waiting_room_member_objections (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.waiting_room_candidates(id) on delete cascade,
  objected_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (length(trim(reason)) > 0 and char_length(reason) <= 2000),
  created_at timestamptz not null default now()
);
drop trigger if exists set_waiting_room_candidates_updated_at on public.waiting_room_candidates;
create trigger set_waiting_room_candidates_updated_at before update on public.waiting_room_candidates for each row execute function public.set_updated_at();

create or replace function public.can_review_waiting_room(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id
      and coalesce(nullif(trim(p.display_name), ''), '') <> ''
      and trim(p.display_name) <> 'New Member'
      and coalesce(nullif(trim(p.bio), ''), '') <> ''
      and ((p.photo_urls is not null and cardinality(p.photo_urls) > 0) or p.photo_url is not null)
      and coalesce(p.karma_points, 0) > 0
  );
$$;

alter table public.waiting_room_candidates enable row level security;
alter table public.waiting_room_questions enable row level security;
alter table public.waiting_room_answers enable row level security;
alter table public.waiting_room_votes enable row level security;
alter table public.waiting_room_member_objections enable row level security;

drop policy if exists "waiting_room_candidates_select_own_or_reviewer" on public.waiting_room_candidates;
create policy "waiting_room_candidates_select_own_or_reviewer" on public.waiting_room_candidates for select to authenticated using (user_id = auth.uid() or public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_candidates_insert_own" on public.waiting_room_candidates;
create policy "waiting_room_candidates_insert_own" on public.waiting_room_candidates for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "waiting_room_candidates_update_own_or_reviewer" on public.waiting_room_candidates;
create policy "waiting_room_candidates_update_own_or_reviewer" on public.waiting_room_candidates for update to authenticated using (user_id = auth.uid() or public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid())) with check (user_id = auth.uid() or public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_questions_select" on public.waiting_room_questions;
create policy "waiting_room_questions_select" on public.waiting_room_questions for select to authenticated using (exists (select 1 from public.waiting_room_candidates c where c.id = candidate_id and c.user_id = auth.uid()) or public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_questions_insert_reviewer" on public.waiting_room_questions;
create policy "waiting_room_questions_insert_reviewer" on public.waiting_room_questions for insert to authenticated with check (asked_by = auth.uid() and (public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid())));
drop policy if exists "waiting_room_answers_select" on public.waiting_room_answers;
create policy "waiting_room_answers_select" on public.waiting_room_answers for select to authenticated using (exists (select 1 from public.waiting_room_candidates c where c.id = candidate_id and c.user_id = auth.uid()) or public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_answers_insert_candidate" on public.waiting_room_answers;
create policy "waiting_room_answers_insert_candidate" on public.waiting_room_answers for insert to authenticated with check (exists (select 1 from public.waiting_room_candidates c where c.id = candidate_id and c.user_id = auth.uid()));
drop policy if exists "waiting_room_votes_select_reviewer" on public.waiting_room_votes;
create policy "waiting_room_votes_select_reviewer" on public.waiting_room_votes for select to authenticated using (public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_votes_insert_reviewer" on public.waiting_room_votes;
create policy "waiting_room_votes_insert_reviewer" on public.waiting_room_votes for insert to authenticated with check (reviewer_user_id = auth.uid() and (public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid())));
drop policy if exists "waiting_room_member_objections_select" on public.waiting_room_member_objections;
create policy "waiting_room_member_objections_select" on public.waiting_room_member_objections for select to authenticated using (public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "waiting_room_member_objections_insert" on public.waiting_room_member_objections;
create policy "waiting_room_member_objections_insert" on public.waiting_room_member_objections for insert to authenticated with check (objected_by = auth.uid() and (public.can_review_waiting_room(auth.uid()) or public.is_admin_user(auth.uid())));

create or replace function public.post_waiting_candidate_to_main()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  main_group_id uuid;
  system_sender_id uuid;
begin
  select id, created_by into main_group_id, system_sender_id from public.groups where lower(name) = 'main' limit 1;
  if system_sender_id is null then select user_id into system_sender_id from public.admin_users order by created_at asc limit 1; end if;
  if system_sender_id is null then select id into system_sender_id from public.profiles order by created_at asc limit 1; end if;
  if main_group_id is not null and system_sender_id is not null then
    insert into public.group_messages (group_id, sender_id, body)
    values (main_group_id, system_sender_id, '🚪 New waiting room candidate

A new person is waiting for review.

Qualified members (profile complete + 1 photo + karma > 0) can help with reception duties here:
/waiting-room/' || new.id || '

Reward: +0.2 karma');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_waiting_candidate_post on public.waiting_room_candidates;
create trigger trg_waiting_candidate_post after insert on public.waiting_room_candidates for each row execute function public.post_waiting_candidate_to_main();

create or replace function public.approve_waiting_candidate(_candidate_id uuid, _reviewer_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  candidate_user_id uuid;
begin
  if not public.can_review_waiting_room(_reviewer_user_id) and not public.is_admin_user(_reviewer_user_id) then
    raise exception 'Reviewer is not eligible for reception duties';
  end if;
  select user_id into candidate_user_id from public.waiting_room_candidates where id = _candidate_id;
  if candidate_user_id is null then raise exception 'Candidate not found'; end if;
  update public.waiting_room_candidates
    set status = 'active', sponsor_user_id = _reviewer_user_id, approved_by = _reviewer_user_id, approved_at = now(), updated_at = now()
    where id = _candidate_id;
  update public.profiles set membership_status = 'active' where id = candidate_user_id;
  insert into public.waiting_room_votes (candidate_id, reviewer_user_id, vote)
    values (_candidate_id, _reviewer_user_id, 'approve')
    on conflict (candidate_id, reviewer_user_id) do update set vote = 'approve';
  insert into public.karma_ledger (user_id, delta, reason, metadata)
    values (_reviewer_user_id, 0.2, 'reception_duties', jsonb_build_object('candidate_id', _candidate_id, 'sponsored_user_id', candidate_user_id));
  update public.profiles set karma_points = coalesce(karma_points,0) + 0.2 where id = _reviewer_user_id;
end;
$$;

create or replace function public.reject_waiting_candidate_hard_delete(_candidate_id uuid, _reviewer_user_id uuid, _rejection_reason_key text, _rejection_reason_text text default null)
returns void language plpgsql security definer set search_path=public as $$
declare
  candidate_user_id uuid;
  candidate_profile public.profiles%rowtype;
  candidate_email text;
begin
  if _rejection_reason_key not in ('kyc_failed','member_objection','other') then
    raise exception 'Invalid rejection reason';
  end if;
  if _rejection_reason_key in ('member_objection','other') and coalesce(nullif(trim(_rejection_reason_text),''),'') = '' then
    raise exception 'A detailed rejection reason is required';
  end if;
  select user_id into candidate_user_id from public.waiting_room_candidates where id = _candidate_id;
  if candidate_user_id is null then raise exception 'Candidate not found'; end if;
  select * into candidate_profile from public.profiles where id = candidate_user_id;
  select email into candidate_email from auth.users where id = candidate_user_id;
  insert into public.waiting_room_votes (candidate_id, reviewer_user_id, vote)
    values (_candidate_id, _reviewer_user_id, 'reject')
    on conflict (candidate_id, reviewer_user_id) do update set vote = 'reject';
  if _rejection_reason_key = 'member_objection' then
    insert into public.waiting_room_member_objections (candidate_id, objected_by, reason)
    values (_candidate_id, _reviewer_user_id, _rejection_reason_text);
  end if;
  insert into public.moderation_logs (user_id, email, display_name, rejection_reason_key, rejection_reason_text, metadata)
    values (candidate_user_id, candidate_email, candidate_profile.display_name, _rejection_reason_key, _rejection_reason_text,
      jsonb_build_object('reviewer_user_id', _reviewer_user_id, 'profile_snapshot', row_to_json(candidate_profile)));
  delete from public.waiting_room_candidates where id = _candidate_id;
  delete from public.profiles where id = candidate_user_id;
  begin
    delete from auth.users where id = candidate_user_id;
  exception when others then
    -- Some projects may block direct auth.users deletes from SQL; log and continue.
    insert into public.moderation_logs (user_id, email, display_name, rejection_reason_key, rejection_reason_text, metadata)
      values (candidate_user_id, candidate_email, candidate_profile.display_name, 'auth_delete_pending', 'Manual auth.users deletion may still be required', jsonb_build_object('original_reason_key', _rejection_reason_key));
  end;
end;
$$;

-- ---------------------------------------------------------
-- Roleplay game (replaces dungeon)
-- ---------------------------------------------------------
create table if not exists public.roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('active','ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create table if not exists public.roleplay_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roleplay_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('sub','participant')),
  is_anonymous boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create table if not exists public.roleplay_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roleplay_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create or replace function public.is_roleplay_participant(_session_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.roleplay_participants rp where rp.session_id = _session_id and rp.user_id = _user_id);
$$;
alter table public.roleplay_sessions enable row level security;
alter table public.roleplay_participants enable row level security;
alter table public.roleplay_messages enable row level security;
drop policy if exists "roleplay_sessions_select_authenticated" on public.roleplay_sessions;
create policy "roleplay_sessions_select_authenticated" on public.roleplay_sessions for select to authenticated using (status = 'active' or public.is_roleplay_participant(id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "roleplay_sessions_insert_authenticated" on public.roleplay_sessions;
create policy "roleplay_sessions_insert_authenticated" on public.roleplay_sessions for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "roleplay_participants_select_session_members" on public.roleplay_participants;
create policy "roleplay_participants_select_session_members" on public.roleplay_participants for select to authenticated using (public.is_roleplay_participant(session_id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "roleplay_participants_insert_self" on public.roleplay_participants;
create policy "roleplay_participants_insert_self" on public.roleplay_participants for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "roleplay_messages_select_session_members" on public.roleplay_messages;
create policy "roleplay_messages_select_session_members" on public.roleplay_messages for select to authenticated using (public.is_roleplay_participant(session_id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "roleplay_messages_insert_session_members" on public.roleplay_messages;
create policy "roleplay_messages_insert_session_members" on public.roleplay_messages for insert to authenticated with check (auth.uid() = sender_id and public.is_roleplay_participant(session_id, auth.uid()));
