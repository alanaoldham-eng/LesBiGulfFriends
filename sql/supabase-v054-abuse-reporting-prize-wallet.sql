-- v054 abuse reporting and inviter karma penalty

alter table public.feedback_items
  add column if not exists reported_user_id uuid references auth.users(id) on delete set null;

alter table public.feedback_items
  drop constraint if exists feedback_items_kind_check;

alter table public.feedback_items
  add constraint feedback_items_kind_check
  check (kind in ('bug', 'feature_request', 'abuse_report'));

create table if not exists public.prize_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  source_user_id uuid references public.profiles(id) on delete set null,
  amount numeric not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.prize_wallet_ledger enable row level security;

drop policy if exists "prize_wallet_no_select" on public.prize_wallet_ledger;
create policy "prize_wallet_no_select"
on public.prize_wallet_ledger for select to authenticated
using (false);

create or replace function public.handle_abuse_report_penalty()
returns trigger
language plpgsql
security definer
as $$
declare
  inviter uuid;
begin
  if new.kind <> 'abuse_report' or new.reported_user_id is null then
    return new;
  end if;

  select i.inviter_id
  into inviter
  from public.invites i
  where i.invitee_user_id = new.reported_user_id
    and i.status = 'joined'
  order by i.created_at asc
  limit 1;

  if inviter is null then
    return new;
  end if;

  update public.profiles
  set karma_points = coalesce(karma_points, 0) - 1
  where id = inviter;

  insert into public.karma_ledger (user_id, delta, reason, metadata)
  values (
    inviter,
    -1,
    'invitee_reported_for_abuse',
    jsonb_build_object('reported_user_id', new.reported_user_id, 'feedback_item_id', new.id)
  );

  insert into public.prize_wallet_ledger (source_user_id, amount, reason, metadata)
  values (
    inviter,
    1,
    'abuse_report_penalty_redirected_to_prize_wallet',
    jsonb_build_object('reported_user_id', new.reported_user_id, 'feedback_item_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_feedback_item_abuse_penalty on public.feedback_items;
create trigger on_feedback_item_abuse_penalty
after insert on public.feedback_items
for each row execute procedure public.handle_abuse_report_penalty();
