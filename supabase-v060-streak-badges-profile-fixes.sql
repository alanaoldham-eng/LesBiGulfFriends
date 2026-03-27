-- v060 streak milestone badges and safer profile edits

-- Make sure notification settings timestamps update cleanly if used later
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_settings_updated_at on public.notification_settings;
create trigger trg_notification_settings_updated_at
before update on public.notification_settings
for each row execute procedure public.set_updated_at_timestamp();

-- Award milestone badges when Breakfast of Champions streak reaches 3 or 30
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

  if v_streak >= 3 then
    insert into public.user_badges (user_id, badge_key, badge_label, emoji, election_key)
    values (v_user_id, 'breakfast_streak_3', '3-Day Streak', '🔥', null)
    on conflict do nothing;
  end if;

  if v_streak >= 30 then
    insert into public.user_badges (user_id, badge_key, badge_label, emoji, election_key)
    values (v_user_id, 'breakfast_streak_30', '30-Day Champion', '🏆', null)
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'success', true,
    'streak', v_streak
  );
end;
$$;

revoke all on function public.breakfast_check_in(text) from public;
grant execute on function public.breakfast_check_in(text) to authenticated;
