create or replace function ringops.get_demo_match_statuses()
returns table (
  boxer_id uuid,
  status ringops.match_status,
  available_from date,
  min_contract_weight_kg numeric,
  max_contract_weight_kg numeric,
  desired_rounds smallint[],
  travel_condition text,
  verified_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.id,
    s.status,
    s.available_from,
    s.min_contract_weight_kg,
    s.max_contract_weight_kg,
    s.desired_rounds,
    s.travel_condition,
    s.verified_at
  from ringops.boxers b
  join ringops.boxer_match_statuses s on s.boxer_id = b.id
  where b.is_public
    and b.id::text like '20000000-%';
$$;

revoke execute on function ringops.get_demo_match_statuses() from public;
grant execute on function ringops.get_demo_match_statuses() to anon, authenticated, service_role;
