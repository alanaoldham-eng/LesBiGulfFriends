-- v055 admin reward panel, abuse-user selector support, landing standings, and profile intro CTA support

create or replace function public.reward_user_karma(p_user_id uuid, p_amount numeric, p_note text)
returns void
language plpgsql
security definer
as $$
declare
  caller_email text;
begin
  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if caller_email <> 'alanaoldham@gmail.com' then
    raise exception 'Not authorized to reward karma';
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) + p_amount
  where id = p_user_id;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (
    p_user_id,
    p_amount,
    'manual_reward',
    jsonb_build_object('note', p_note, 'rewarded_by', caller_email)
  );
end;
$$;

revoke all on function public.reward_user_karma(uuid, numeric, text) from public;
grant execute on function public.reward_user_karma(uuid, numeric, text) to authenticated;
