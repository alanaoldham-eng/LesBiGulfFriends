-- v059 games app, Breakfast of Champions, notification settings, and opt-in email reminders

create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_friend_requests boolean not null default false,
  email_private_messages boolean not null default false,
  email_breakfast_reminders boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
on public.notification_settings for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
on public.notification_settings for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
on public.notification_settings for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text unique not null,
  created_at timestamptz not null default now()
);

insert into public.games (name, key)
values ('Breakfast of Champions', 'breakfast_of_champions')
on conflict (key) do nothing;

create table if not exists public.game_player_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null,
  current_streak integer not null default 0,
  last_check_in date,
  created_at timestamptz not null default now(),
  unique (user_id, game_key)
);

create table if not exists public.game_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null,
  checkin_date date not null,
  intention text,
  created_at timestamptz not null default now(),
  unique (user_id, game_key, checkin_date)
);

create index if not exists idx_game_progress_game on public.game_player_progress(game_key, current_streak desc);
create index if not exists idx_game_checkins_game_date on public.game_checkins(game_key, checkin_date desc);

alter table public.game_player_progress enable row level security;
alter table public.game_checkins enable row level security;

drop policy if exists "game_progress_select_all" on public.game_player_progress;
create policy "game_progress_select_all"
on public.game_player_progress for select to authenticated
using (true);

drop policy if exists "game_checkins_select_all" on public.game_checkins;
create policy "game_checkins_select_all"
on public.game_checkins for select to authenticated
using (true);

drop policy if exists "game_checkins_insert_own" on public.game_checkins;
create policy "game_checkins_insert_own"
on public.game_checkins for insert to authenticated
with check (user_id = auth.uid());

create or replace function public.breakfast_check_in(p_intention text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_today date := current_date;
  v_progress record;
  v_streak integer := 1;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from public.game_checkins
    where user_id = v_user_id
      and game_key = 'breakfast_of_champions'
      and checkin_date = v_today
  ) then
    select * into v_progress
    from public.game_player_progress
    where user_id = v_user_id and game_key = 'breakfast_of_champions';

    return jsonb_build_object(
      'duplicate', true,
      'streak', coalesce(v_progress.current_streak, 0)
    );
  end if;

  select * into v_progress
  from public.game_player_progress
  where user_id = v_user_id and game_key = 'breakfast_of_champions';

  if v_progress is not null and v_progress.last_check_in = v_today - 1 then
    v_streak := coalesce(v_progress.current_streak, 0) + 1;
  else
    v_streak := 1;
  end if;

  insert into public.game_checkins (user_id, game_key, checkin_date, intention)
  values (v_user_id, 'breakfast_of_champions', v_today, p_intention);

  insert into public.game_player_progress (user_id, game_key, current_streak, last_check_in)
  values (v_user_id, 'breakfast_of_champions', v_streak, v_today)
  on conflict (user_id, game_key)
  do update set
    current_streak = excluded.current_streak,
    last_check_in = excluded.last_check_in;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + 0.1
  where id = v_user_id;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (
    v_user_id,
    0.1,
    'breakfast_of_champions_checkin',
    jsonb_build_object('game_key', 'breakfast_of_champions', 'checkin_date', v_today, 'intention', p_intention)
  );

  return jsonb_build_object(
    'duplicate', false,
    'success', true,
    'streak', v_streak
  );
end;
$$;

revoke all on function public.breakfast_check_in(text) from public;
grant execute on function public.breakfast_check_in(text) to authenticated;
