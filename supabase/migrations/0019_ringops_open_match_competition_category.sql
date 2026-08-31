alter table ringops.open_matches
  add column if not exists competition_category text
  check (competition_category in ('men','women'));

update ringops.open_matches om
set competition_category = b.competition_category
from ringops.boxers b
where om.target_boxer_id = b.id
  and om.competition_category is null;

create index if not exists ringops_open_matches_competition_idx
  on ringops.open_matches(competition_category, status);

create or replace function ringops.reopen_case_as_open_match(
  p_case_id uuid,
  p_target_boxer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_case ringops.matchmaking_cases%rowtype;
  v_target_boxer uuid;
  v_division_code text;
  v_competition_category text;
  v_org uuid;
  v_open_match uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not ringops.is_case_participant(p_case_id) then raise exception 'permission denied'; end if;

  select * into v_case from ringops.matchmaking_cases where id = p_case_id;
  if not found then raise exception 'case not found'; end if;
  if v_case.status = 'confirmed' then raise exception 'confirmed case cannot be reopened'; end if;

  if p_target_boxer_id is not null then
    if p_target_boxer_id is distinct from v_case.boxer_a_id
       and p_target_boxer_id is distinct from v_case.boxer_b_id then
      raise exception 'target boxer is not part of this case';
    end if;
    v_target_boxer := p_target_boxer_id;
  elsif v_case.boxer_a_id is not null and v_case.boxer_b_id is not null then
    raise exception 'target boxer required when both boxers are set';
  else
    v_target_boxer := coalesce(v_case.boxer_a_id, v_case.boxer_b_id);
  end if;

  if v_target_boxer is null then raise exception 'target boxer required'; end if;

  select division_code, competition_category
    into v_division_code, v_competition_category
  from ringops.boxers
  where id = v_target_boxer and is_public;

  if v_division_code is null then raise exception 'target boxer not found'; end if;

  select co.organization_id into v_org
  from ringops.matchmaking_case_organizations co
  join ringops.organization_memberships m on m.organization_id = co.organization_id
  where co.case_id = p_case_id
    and m.user_id = v_user
    and m.status = 'active'
    and m.role in ('owner','admin','matchmaker')
  order by case co.role when 'promoter' then 1 when 'gym_a' then 2 when 'gym_b' then 3 else 9 end
  limit 1;

  if v_org is null then raise exception 'managed case organization required'; end if;

  insert into ringops.open_matches(
    organization_id,event_id,target_boxer_id,event_date,venue_name,competition_category,division_code,
    contract_weight_min_kg,contract_weight_max_kg,rounds,comment,status,created_by
  ) values (
    v_org,v_case.event_id,v_target_boxer,v_case.event_date,v_case.venue_name,v_competition_category,v_division_code,
    v_case.contract_weight_kg,v_case.contract_weight_kg,coalesce(v_case.rounds,4),
    nullif(concat_ws(E'\n','再募集：マッチメイク案件から引継ぎ',v_case.conditions),''),'open',v_user
  ) returning id into v_open_match;

  update ringops.matchmaking_cases
  set status='cancelled', replacement_open_match_id=v_open_match, reopened_at=now()
  where id=p_case_id;

  return v_open_match;
end;
$function$;
