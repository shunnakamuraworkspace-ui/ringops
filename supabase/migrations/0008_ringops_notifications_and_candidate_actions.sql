create or replace function ringops.notify_organization(
  p_organization_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_target_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into ringops.notifications(user_id, notification_type, title, body, target_url)
  select m.user_id, p_type, p_title, p_body, p_target_url
  from ringops.organization_memberships m
  where m.organization_id = p_organization_id
    and m.status = 'active'
    and m.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
end;
$$;

create or replace function ringops.notify_new_case_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case ringops.matchmaking_cases%rowtype;
  v_boxer_name text;
begin
  if new.role not in ('gym_a','gym_b') then return new; end if;
  select * into v_case from ringops.matchmaking_cases where id = new.case_id;
  select name into v_boxer_name from ringops.boxers where id = coalesce(v_case.boxer_b_id, v_case.boxer_a_id);
  perform ringops.notify_organization(
    new.organization_id,
    'matchmaking_consultation',
    'マッチメイク相談が届きました',
    concat(coalesce(v_boxer_name,'選手'), 'について相談が届いています。'),
    '/matchmaking'
  );
  return new;
end;
$$;

create trigger ringops_case_participant_notification
after insert on ringops.matchmaking_case_organizations
for each row execute function ringops.notify_new_case_participant();

create or replace function ringops.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  for v_org in
    select co.organization_id
    from ringops.conversation_organizations co
    where co.conversation_id = new.conversation_id
      and not exists (
        select 1 from ringops.organization_memberships mine
        where mine.organization_id = co.organization_id
          and mine.user_id = new.sender_profile_id
          and mine.status = 'active'
      )
  loop
    perform ringops.notify_organization(v_org, 'message', '新しい連絡があります', left(new.body, 180), '/messages');
  end loop;
  return new;
end;
$$;

create trigger ringops_message_notification
after insert on ringops.messages
for each row execute function ringops.notify_new_message();

create or replace function ringops.notify_matching_open_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  for v_org in
    select distinct b.organization_id
    from ringops.boxers b
    join ringops.boxer_match_statuses s on s.boxer_id = b.id
    where b.is_public
      and b.organization_id <> new.organization_id
      and b.division_code = new.division_code
      and s.status in ('accepting','conditional')
      and (new.preferred_class is null or b.boxer_class = new.preferred_class)
      and (new.preferred_stance is null or b.stance = new.preferred_stance)
      and (new.min_bouts is null or b.total_bouts >= new.min_bouts)
      and (new.max_bouts is null or b.total_bouts <= new.max_bouts)
      and new.rounds = any(s.desired_rounds)
      and (
        new.contract_weight_min_kg is null
        or s.max_contract_weight_kg is null
        or s.max_contract_weight_kg >= new.contract_weight_min_kg
      )
      and (
        new.contract_weight_max_kg is null
        or s.min_contract_weight_kg is null
        or s.min_contract_weight_kg <= new.contract_weight_max_kg
      )
      and (new.event_date is null or s.available_from is null or s.available_from <= new.event_date)
      and (new.event_date is null or s.available_to is null or s.available_to >= new.event_date)
  loop
    perform ringops.notify_organization(
      v_org,
      'open_match_match',
      '条件に合う対戦相手募集があります',
      concat(new.rounds, 'R / ', new.division_code, ' の募集条件に所属選手が一致しています。'),
      '/open-matches'
    );
  end loop;
  return new;
end;
$$;

create trigger ringops_open_match_notification
after insert on ringops.open_matches
for each row when (new.status = 'open') execute function ringops.notify_matching_open_match();

create or replace function ringops.create_stale_match_status_notifications(p_days integer default 14)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_row record;
begin
  for v_row in
    select s.boxer_id, b.name, b.organization_id
    from ringops.boxer_match_statuses s
    join ringops.boxers b on b.id = s.boxer_id
    where s.verified_at < now() - make_interval(days => greatest(p_days, 1))
  loop
    if not exists (
      select 1
      from ringops.notifications n
      join ringops.organization_memberships m on m.user_id = n.user_id
      where m.organization_id = v_row.organization_id
        and n.notification_type = 'match_status_stale'
        and n.target_url = '/gym'
        and n.created_at > now() - interval '1 day'
    ) then
      perform ringops.notify_organization(
        v_row.organization_id,
        'match_status_stale',
        concat(v_row.name, 'の受付状況を確認してください'),
        'MATCH STATUSの確認日時が古くなっています。「そのまま確認」または内容を変更してください。',
        '/gym'
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function ringops.save_candidate_boxer(p_boxer_id uuid, p_list_name text default '候補選手')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_list uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select m.organization_id into v_org
  from ringops.organization_memberships m
  where m.user_id = v_user
    and m.status = 'active'
    and m.role in ('owner','admin','matchmaker','staff')
  order by case m.role when 'owner' then 1 when 'admin' then 2 when 'matchmaker' then 3 else 4 end
  limit 1;
  if v_org is null then raise exception 'active organization required'; end if;

  select id into v_list
  from ringops.candidate_lists
  where organization_id = v_org and name = p_list_name
  order by created_at
  limit 1;

  if v_list is null then
    insert into ringops.candidate_lists(organization_id, name, created_by)
    values (v_org, p_list_name, v_user)
    returning id into v_list;
  end if;

  insert into ringops.candidate_list_boxers(list_id, boxer_id)
  values (v_list, p_boxer_id)
  on conflict do nothing;
  return v_list;
end;
$$;

revoke execute on function ringops.notify_organization(uuid,text,text,text,text) from public, anon, authenticated;
revoke execute on function ringops.notify_new_case_participant() from public, anon, authenticated;
revoke execute on function ringops.notify_new_message() from public, anon, authenticated;
revoke execute on function ringops.notify_matching_open_match() from public, anon, authenticated;
revoke execute on function ringops.create_stale_match_status_notifications(integer) from public, anon, authenticated;
grant execute on function ringops.create_stale_match_status_notifications(integer) to service_role;
grant execute on function ringops.save_candidate_boxer(uuid,text) to authenticated;
