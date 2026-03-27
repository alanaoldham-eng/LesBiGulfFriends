-- =========================================================
-- v061 web roadmap package
-- - fixes group member standings visibility so all members show
-- - adds curated content tables
-- - adds anonymous confessional tables
-- - adds blind chat tables
-- - adds reusable games framework tables
-- - seeds starter web-facing sources and game definitions
-- =========================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin_user(_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = _user_id
  );
$$;

-- ---------------------------------------------------------
-- group standings visibility fix
-- Existing bug symptom: only current user shows in member standings.
-- Cause: group_members select policy too restrictive in some environments.
-- ---------------------------------------------------------
alter table public.group_members enable row level security;

drop policy if exists "group_members_select_visible_group_members" on public.group_members;
create policy "group_members_select_visible_group_members"
on public.group_members
for select
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = group_members.group_id
      and (
        coalesce(g.is_private, false) = false
        or exists (
          select 1
          from public.group_members gm2
          where gm2.group_id = group_members.group_id
            and gm2.user_id = auth.uid()
        )
      )
  )
);

-- ---------------------------------------------------------
-- curated content
-- ---------------------------------------------------------
create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_type text not null check (source_type in ('podcast', 'news', 'blog')),
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
  user_id uuid not null references auth.users(id) on delete cascade,
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
create policy "content_sources_select_authenticated"
on public.content_sources for select to authenticated
using (is_active = true);

drop policy if exists "content_items_select_authenticated" on public.content_items;
create policy "content_items_select_authenticated"
on public.content_items for select to authenticated
using (is_published = true and is_hidden = false);

drop policy if exists "user_saved_content_select_own" on public.user_saved_content;
create policy "user_saved_content_select_own"
on public.user_saved_content for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_saved_content_insert_own" on public.user_saved_content;
create policy "user_saved_content_insert_own"
on public.user_saved_content for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_saved_content_delete_own" on public.user_saved_content;
create policy "user_saved_content_delete_own"
on public.user_saved_content for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "editorial_collections_select_authenticated" on public.editorial_collections;
create policy "editorial_collections_select_authenticated"
on public.editorial_collections for select to authenticated
using (is_active = true);

drop policy if exists "editorial_collection_items_select_authenticated" on public.editorial_collection_items;
create policy "editorial_collection_items_select_authenticated"
on public.editorial_collection_items for select to authenticated
using (true);

drop trigger if exists set_content_sources_updated_at on public.content_sources;
create trigger set_content_sources_updated_at before update on public.content_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at before update on public.content_items
for each row execute function public.set_updated_at();

insert into public.content_sources (
  slug, source_type, title, description, website_url, rss_url, external_links, editorial_note, is_active, is_featured, featured_rank
)
values (
  'handsome',
  'podcast',
  'Handsome',
  'A featured comedy podcast for members.',
  'https://handsomepod.com',
  'https://rss.art19.com/handsome',
  jsonb_build_object(
    'website', 'https://handsomepod.com',
    'apple', 'https://podcasts.apple.com/',
    'spotify', 'https://open.spotify.com/',
    'youtube', 'https://www.youtube.com/'
  ),
  'Funny, warm, and easy to throw on during a walk or drive.',
  true,
  true,
  1
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  website_url = excluded.website_url,
  rss_url = excluded.rss_url,
  external_links = excluded.external_links,
  editorial_note = excluded.editorial_note,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  featured_rank = excluded.featured_rank,
  updated_at = now();

insert into public.editorial_collections (slug, title, description, is_active)
values ('staff-picks', 'Staff Picks', 'Fresh curated listens and reads for members.', true)
on conflict (slug) do update
set title = excluded.title,
    description = excluded.description,
    is_active = excluded.is_active;

-- ---------------------------------------------------------
-- anonymous confessional
-- ---------------------------------------------------------
create table if not exists public.anonymous_posts (
  id uuid primary key default gen_random_uuid(),
  body text not null check (length(trim(body)) > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
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
  created_by uuid not null references auth.users(id) on delete cascade,
  is_hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anonymous_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.anonymous_posts(id) on delete cascade,
  reply_id uuid references public.anonymous_replies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'hug', 'same', 'support')),
  created_at timestamptz not null default now(),
  constraint anonymous_reactions_target_check check (
    (post_id is not null and reply_id is null)
    or (post_id is null and reply_id is not null)
  )
);

create table if not exists public.anonymous_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.anonymous_posts(id) on delete cascade,
  reply_id uuid references public.anonymous_replies(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint anonymous_reports_target_check check (
    (post_id is not null and reply_id is null)
    or (post_id is null and reply_id is not null)
  )
);

create unique index if not exists anonymous_reactions_unique_post on public.anonymous_reactions (post_id, created_by) where post_id is not null;
create unique index if not exists anonymous_reactions_unique_reply on public.anonymous_reactions (reply_id, created_by) where reply_id is not null;
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

create or replace function public.handle_anonymous_reply_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.anonymous_posts set reply_count = reply_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.anonymous_posts set reply_count = greatest(reply_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists anonymous_reply_count_insert on public.anonymous_replies;
create trigger anonymous_reply_count_insert after insert on public.anonymous_replies for each row execute function public.handle_anonymous_reply_count();
drop trigger if exists anonymous_reply_count_delete on public.anonymous_replies;
create trigger anonymous_reply_count_delete after delete on public.anonymous_replies for each row execute function public.handle_anonymous_reply_count();

-- ---------------------------------------------------------
-- blind chat
-- ---------------------------------------------------------
create table if not exists public.blind_chat_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('waiting', 'matched', 'cancelled')),
  created_at timestamptz not null default now(),
  matched_at timestamptz
);

create table if not exists public.blind_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('active', 'revealed', 'ended', 'reported')),
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.blind_chat_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blind_chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.blind_chat_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blind_chat_sessions(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (session_id, reported_by)
);

create table if not exists public.blind_chat_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blind_chat_blocks_no_self check (user_id <> blocked_user_id),
  unique (user_id, blocked_user_id)
);

create or replace function public.is_blind_chat_participant(_session_id uuid, _user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.blind_chat_participants p
    where p.session_id = _session_id and p.user_id = _user_id
  );
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
drop policy if exists "blind_chat_sessions_insert_authenticated" on public.blind_chat_sessions;
create policy "blind_chat_sessions_insert_authenticated" on public.blind_chat_sessions for insert to authenticated with check (true);
drop policy if exists "blind_chat_sessions_update_authenticated" on public.blind_chat_sessions;
create policy "blind_chat_sessions_update_authenticated" on public.blind_chat_sessions for update to authenticated using (public.is_blind_chat_participant(id, auth.uid()) or public.is_admin_user(auth.uid())) with check (public.is_blind_chat_participant(id, auth.uid()) or public.is_admin_user(auth.uid()));

drop policy if exists "blind_chat_participants_select_participants" on public.blind_chat_participants;
create policy "blind_chat_participants_select_participants" on public.blind_chat_participants for select to authenticated using (public.is_blind_chat_participant(session_id, auth.uid()) or public.is_admin_user(auth.uid()));
drop policy if exists "blind_chat_participants_insert_authenticated" on public.blind_chat_participants;
create policy "blind_chat_participants_insert_authenticated" on public.blind_chat_participants for insert to authenticated with check (true);
drop policy if exists "blind_chat_participants_update_self_or_admin" on public.blind_chat_participants;
create policy "blind_chat_participants_update_self_or_admin" on public.blind_chat_participants for update to authenticated using (auth.uid() = user_id or public.is_admin_user(auth.uid())) with check (auth.uid() = user_id or public.is_admin_user(auth.uid()));

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
-- reusable social games framework
-- ---------------------------------------------------------
create table if not exists public.game_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  game_type text not null check (game_type in ('this_or_that', 'daily_prompt', 'hot_take', 'blind_pair', 'group_game')),
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_participation (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid not null references public.game_instances(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice_key text,
  response_text text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists game_participation_unique_user_instance on public.game_participation (game_instance_id, user_id);

create table if not exists public.game_reactions (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid references public.game_instances(id) on delete cascade,
  participation_id uuid references public.game_participation(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'fun', 'agree', 'fire')),
  created_at timestamptz not null default now(),
  constraint game_reactions_target_check check (
    (game_instance_id is not null and participation_id is null)
    or (game_instance_id is null and participation_id is not null)
  )
);

create table if not exists public.game_reports (
  id uuid primary key default gen_random_uuid(),
  game_instance_id uuid references public.game_instances(id) on delete cascade,
  participation_id uuid references public.game_participation(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint game_reports_target_check check (
    (game_instance_id is not null and participation_id is null)
    or (game_instance_id is null and participation_id is not null)
  )
);

alter table public.game_definitions enable row level security;
alter table public.game_instances enable row level security;
alter table public.game_participation enable row level security;
alter table public.game_reactions enable row level security;
alter table public.game_reports enable row level security;

drop policy if exists "game_definitions_select_active" on public.game_definitions;
create policy "game_definitions_select_active" on public.game_definitions for select to authenticated using (is_active = true);
drop policy if exists "game_definitions_admin_insert" on public.game_definitions;
create policy "game_definitions_admin_insert" on public.game_definitions for insert to authenticated with check (public.is_admin_user(auth.uid()));
drop policy if exists "game_definitions_admin_update" on public.game_definitions;
create policy "game_definitions_admin_update" on public.game_definitions for update to authenticated using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

drop policy if exists "game_instances_select_visible" on public.game_instances;
create policy "game_instances_select_visible" on public.game_instances for select to authenticated using (
  is_active = true
  and (
    group_id is null
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = game_instances.group_id
        and gm.user_id = auth.uid()
    )
  )
);
drop policy if exists "game_instances_admin_insert" on public.game_instances;
create policy "game_instances_admin_insert" on public.game_instances for insert to authenticated with check (public.is_admin_user(auth.uid()));
drop policy if exists "game_instances_admin_update" on public.game_instances;
create policy "game_instances_admin_update" on public.game_instances for update to authenticated using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

drop policy if exists "game_participation_select_visible" on public.game_participation;
create policy "game_participation_select_visible" on public.game_participation for select to authenticated using (true);
drop policy if exists "game_participation_insert_own" on public.game_participation;
create policy "game_participation_insert_own" on public.game_participation for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "game_participation_update_own" on public.game_participation;
create policy "game_participation_update_own" on public.game_participation for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "game_reactions_select_visible" on public.game_reactions;
create policy "game_reactions_select_visible" on public.game_reactions for select to authenticated using (true);
drop policy if exists "game_reactions_insert_own" on public.game_reactions;
create policy "game_reactions_insert_own" on public.game_reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "game_reactions_delete_own_or_admin" on public.game_reactions;
create policy "game_reactions_delete_own_or_admin" on public.game_reactions for delete to authenticated using (auth.uid() = user_id or public.is_admin_user(auth.uid()));

drop policy if exists "game_reports_insert_own" on public.game_reports;
create policy "game_reports_insert_own" on public.game_reports for insert to authenticated with check (auth.uid() = reported_by);
drop policy if exists "game_reports_select_admin_only" on public.game_reports;
create policy "game_reports_select_admin_only" on public.game_reports for select to authenticated using (public.is_admin_user(auth.uid()));

drop trigger if exists set_game_instances_updated_at on public.game_instances;
create trigger set_game_instances_updated_at before update on public.game_instances for each row execute function public.set_updated_at();
drop trigger if exists set_game_participation_updated_at on public.game_participation;
create trigger set_game_participation_updated_at before update on public.game_participation for each row execute function public.set_updated_at();

insert into public.game_definitions (slug, name, game_type, description, is_active, is_featured, sort_order)
values
  ('this-or-that', 'This or That', 'this_or_that', 'Quick choice games with instant participation.', true, true, 10),
  ('daily-prompt', 'Daily Prompt', 'daily_prompt', 'A fresh prompt for members each day.', true, true, 20),
  ('hot-takes', 'Hot Takes', 'hot_take', 'Short opinions, reactions, and discussion.', true, true, 30)
on conflict (slug) do update
set name = excluded.name,
    game_type = excluded.game_type,
    description = excluded.description,
    is_active = excluded.is_active,
    is_featured = excluded.is_featured,
    sort_order = excluded.sort_order;

insert into public.game_instances (
  game_definition_id, title, body, option_a, option_b, is_active, is_anonymous
)
select gd.id, 'Beach day or cozy night in?', 'Pick your vibe.', 'Beach day', 'Cozy night in', true, false
from public.game_definitions gd
where gd.slug = 'this-or-that'
  and not exists (select 1 from public.game_instances gi where gi.title = 'Beach day or cozy night in?');

insert into public.game_instances (
  game_definition_id, title, body, is_active, is_anonymous
)
select gd.id, 'What’s one tiny thing that made you smile today?', 'Answer in a sentence or two.', true, false
from public.game_definitions gd
where gd.slug = 'daily-prompt'
  and not exists (select 1 from public.game_instances gi where gi.title = 'What’s one tiny thing that made you smile today?');

insert into public.game_instances (
  game_definition_id, title, body, is_active, is_anonymous
)
select gd.id, 'First dates should always be short.', 'Do you agree or disagree?', true, true
from public.game_definitions gd
where gd.slug = 'hot-takes'
  and not exists (select 1 from public.game_instances gi where gi.title = 'First dates should always be short.');
