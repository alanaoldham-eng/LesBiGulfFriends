-- v057 rebuild karma balances from the ledger and ensure decimal support

alter table public.profiles
  alter column karma_points type numeric
  using coalesce(karma_points, 0)::numeric;

alter table public.karma_ledger
  alter column delta type numeric
  using coalesce(delta, 0)::numeric;

alter table public.profiles
  alter column karma_points set default 0;

update public.profiles
set karma_points = 0
where karma_points is null;

with karma_totals as (
  select
    user_id,
    coalesce(sum(delta), 0)::numeric as total_karma
  from public.karma_ledger
  group by user_id
)
update public.profiles p
set karma_points = coalesce(k.total_karma, 0)
from karma_totals k
where p.id = k.user_id;

update public.profiles
set karma_points = 0
where karma_points is null;

-- Helpful verification query:
-- select id, display_name, karma_points from public.profiles order by karma_points desc, display_name asc;
