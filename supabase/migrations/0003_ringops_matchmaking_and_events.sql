create type ringops.open_match_status as enum ('open','paused','matched','closed');
create type ringops.case_status as enum ('recruiting','consulting','negotiating','gym_confirmation_pending','provisional','confirmed','cancelled');
create type ringops.event_status as enum ('planning','matching','confirmed','completed','cancelled');

create table ringops.data_providers (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null unique,
  display_name text not null,
  provider_type text not null check (provider_type in ('official','licensed','manual','other')),
  base_url text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.boxer_source_records (
  id uuid primary key default gen_random_uuid(),
  boxer_id uuid not null references ringops.boxers(id) on delete cascade,
  provider_id uuid not null references ringops.data_providers(id) on delete restrict,
  external_id text not null,
  source_url text,
  fetched_at timestamptz,
  verified_at timestamptz,
  last_synced_at timestamptz,
  raw_reference jsonb,
  unique(provider_id, external_id)
);

create table ringops.events (
  id uuid primary key default gen_random_uuid(),
  promoter_organization_id uuid not null references ringops.organizations(id),
  name text not null,
  event_date date not null,
  venue_name text not null,
  status ringops.event_status not null default 'planning',
  ticket_external_event_id text,
  created_by uuid references ringops.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.event_organizations (
  event_id uuid not null references ringops.events(id) on delete cascade,
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  role text not null check (role in ('promoter','participating_gym','staff','other')),
  primary key(event_id, organization_id)
);

create table ringops.bouts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references ringops.events(id) on delete set null,
  bout_date date not null,
  venue_name text,
  division_code text,
  contract_weight_kg numeric(5,2),
  scheduled_rounds smallint check (scheduled_rounds in (4,6,8,10,12)),
  boxer_a_id uuid references ringops.boxers(id) on delete set null,
  boxer_b_id uuid references ringops.boxers(id) on delete set null,
  winner_boxer_id uuid references ringops.boxers(id) on delete set null,
  result_method text,
  result_round smallint,
  result_time text,
  source text,
  source_url text,
  fetched_at timestamptz,
  verified_at timestamptz,
  ticket_external_bout_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (boxer_a_id is null or boxer_b_id is null or boxer_a_id <> boxer_b_id)
);

create table ringops.open_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ringops.organizations(id),
  event_id uuid references ringops.events(id) on delete set null,
  target_boxer_id uuid references ringops.boxers(id) on delete set null,
  event_date date,
  venue_name text,
  division_code text not null,
  contract_weight_min_kg numeric(5,2),
  contract_weight_max_kg numeric(5,2),
  rounds smallint not null check (rounds in (4,6,8,10,12)),
  preferred_class ringops.boxer_class,
  preferred_stance ringops.stance,
  min_bouts smallint,
  max_bouts smallint,
  region_condition text,
  travel_condition text,
  deadline date,
  comment text check (comment is null or char_length(comment) <= 1500),
  status ringops.open_match_status not null default 'open',
  created_by uuid references ringops.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.matchmaking_cases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references ringops.events(id) on delete set null,
  proposed_event_name text,
  promoter_organization_id uuid references ringops.organizations(id),
  boxer_a_id uuid references ringops.boxers(id) on delete set null,
  boxer_b_id uuid references ringops.boxers(id) on delete set null,
  event_date date,
  venue_name text,
  contract_weight_kg numeric(5,2),
  rounds smallint check (rounds in (4,6,8,10,12)),
  conditions text,
  status ringops.case_status not null default 'consulting',
  created_by uuid references ringops.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.matchmaking_case_organizations (
  case_id uuid not null references ringops.matchmaking_cases(id) on delete cascade,
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  role text not null check (role in ('promoter','gym_a','gym_b','observer')),
  approved_at timestamptz,
  approved_by uuid references ringops.profiles(id) on delete set null,
  primary key(case_id, organization_id)
);

create table ringops.candidate_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  event_id uuid references ringops.events(id) on delete set null,
  name text not null,
  created_by uuid references ringops.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.candidate_list_boxers (
  list_id uuid not null references ringops.candidate_lists(id) on delete cascade,
  boxer_id uuid not null references ringops.boxers(id) on delete cascade,
  note text,
  added_at timestamptz not null default now(),
  primary key(list_id, boxer_id)
);

create table ringops.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null check (conversation_type in ('dm','matchmaking_case','event','organization')),
  matchmaking_case_id uuid references ringops.matchmaking_cases(id) on delete cascade,
  event_id uuid references ringops.events(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.conversation_organizations (
  conversation_id uuid not null references ringops.conversations(id) on delete cascade,
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  primary key(conversation_id, organization_id)
);

create table ringops.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ringops.conversations(id) on delete cascade,
  sender_profile_id uuid not null references ringops.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table ringops.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references ringops.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  target_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index ringops_provider_boxer_idx on ringops.boxer_source_records(boxer_id,last_synced_at desc);
create index ringops_events_date_idx on ringops.events(event_date,status);
create index ringops_bouts_date_idx on ringops.bouts(bout_date,event_id);
create index ringops_open_matches_search_idx on ringops.open_matches(status,division_code,rounds,event_date,deadline);
create index ringops_cases_status_idx on ringops.matchmaking_cases(status,event_date);
create index ringops_messages_conversation_idx on ringops.messages(conversation_id,created_at);
create index ringops_notifications_user_idx on ringops.notifications(user_id,read_at,created_at desc);

create trigger ringops_data_providers_updated_at before update on ringops.data_providers for each row execute function ringops.set_updated_at();
create trigger ringops_events_updated_at before update on ringops.events for each row execute function ringops.set_updated_at();
create trigger ringops_bouts_updated_at before update on ringops.bouts for each row execute function ringops.set_updated_at();
create trigger ringops_open_matches_updated_at before update on ringops.open_matches for each row execute function ringops.set_updated_at();
create trigger ringops_cases_updated_at before update on ringops.matchmaking_cases for each row execute function ringops.set_updated_at();
create trigger ringops_candidate_lists_updated_at before update on ringops.candidate_lists for each row execute function ringops.set_updated_at();
create trigger ringops_conversations_updated_at before update on ringops.conversations for each row execute function ringops.set_updated_at();

create or replace function ringops.is_case_participant(p_case_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ringops.matchmaking_case_organizations co
    join ringops.organization_memberships m on m.organization_id = co.organization_id
    where co.case_id = p_case_id and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function ringops.start_boxer_consultation(
  p_boxer_id uuid,
  p_event_name text,
  p_event_date date,
  p_contract_weight_kg numeric,
  p_rounds smallint,
  p_message text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request_org uuid;
  v_request_type ringops.organization_type;
  v_target_org uuid;
  v_case uuid;
  v_conversation uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select m.organization_id, o.organization_type into v_request_org, v_request_type
  from ringops.organization_memberships m
  join ringops.organizations o on o.id = m.organization_id
  where m.user_id = v_user and m.status = 'active'
  order by case m.role when 'owner' then 1 when 'admin' then 2 when 'matchmaker' then 3 else 9 end
  limit 1;
  if v_request_org is null then raise exception 'active organization required'; end if;
  select organization_id into v_target_org from ringops.boxers where id = p_boxer_id and is_public;
  if v_target_org is null then raise exception 'boxer not found'; end if;

  insert into ringops.matchmaking_cases(
    proposed_event_name, promoter_organization_id, boxer_b_id, event_date, contract_weight_kg, rounds, conditions, status, created_by
  ) values (
    p_event_name,
    case when v_request_type = 'promoter' then v_request_org else null end,
    p_boxer_id, p_event_date, p_contract_weight_kg, p_rounds, p_message, 'consulting', v_user
  ) returning id into v_case;

  insert into ringops.matchmaking_case_organizations(case_id,organization_id,role)
  values (v_case,v_request_org,case when v_request_type='promoter' then 'promoter' else 'gym_a' end)
  on conflict do nothing;
  insert into ringops.matchmaking_case_organizations(case_id,organization_id,role)
  values (v_case,v_target_org,'gym_b') on conflict do nothing;

  insert into ringops.conversations(conversation_type,matchmaking_case_id,title)
  values ('matchmaking_case',v_case,p_event_name) returning id into v_conversation;
  insert into ringops.conversation_organizations(conversation_id,organization_id) values (v_conversation,v_request_org) on conflict do nothing;
  insert into ringops.conversation_organizations(conversation_id,organization_id) values (v_conversation,v_target_org) on conflict do nothing;
  insert into ringops.messages(conversation_id,sender_profile_id,body) values (v_conversation,v_user,p_message);

  return v_case;
end;
$$;

create or replace function ringops.set_case_approval(p_case_id uuid, p_approved boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid;
  v_all_approved boolean;
begin
  select m.organization_id into v_org
  from ringops.organization_memberships m
  join ringops.matchmaking_case_organizations co on co.organization_id=m.organization_id and co.case_id=p_case_id
  where m.user_id=auth.uid() and m.status='active' and m.role in ('owner','admin','matchmaker')
  limit 1;
  if v_org is null then raise exception 'permission denied'; end if;

  update ringops.matchmaking_case_organizations
  set approved_at = case when p_approved then now() else null end,
      approved_by = case when p_approved then auth.uid() else null end
  where case_id=p_case_id and organization_id=v_org;

  select not exists(
    select 1 from ringops.matchmaking_case_organizations
    where case_id=p_case_id and role in ('gym_a','gym_b') and approved_at is null
  ) into v_all_approved;
  if v_all_approved then update ringops.matchmaking_cases set status='confirmed' where id=p_case_id; end if;
end;
$$;

alter table ringops.data_providers enable row level security;
alter table ringops.boxer_source_records enable row level security;
alter table ringops.events enable row level security;
alter table ringops.event_organizations enable row level security;
alter table ringops.bouts enable row level security;
alter table ringops.open_matches enable row level security;
alter table ringops.matchmaking_cases enable row level security;
alter table ringops.matchmaking_case_organizations enable row level security;
alter table ringops.candidate_lists enable row level security;
alter table ringops.candidate_list_boxers enable row level security;
alter table ringops.conversations enable row level security;
alter table ringops.conversation_organizations enable row level security;
alter table ringops.messages enable row level security;
alter table ringops.notifications enable row level security;

create policy "industry views providers" on ringops.data_providers for select to authenticated using (ringops.is_industry_member());
create policy "industry views provenance" on ringops.boxer_source_records for select to authenticated using (ringops.is_industry_member());
create policy "industry views events" on ringops.events for select to authenticated using (ringops.is_industry_member());
create policy "promoter creates events" on ringops.events for insert to authenticated with check (ringops.has_organization_role(promoter_organization_id,array['owner','admin','matchmaker']::ringops.membership_role[]));
create policy "promoter updates events" on ringops.events for update to authenticated using (ringops.has_organization_role(promoter_organization_id,array['owner','admin','matchmaker']::ringops.membership_role[])) with check (ringops.has_organization_role(promoter_organization_id,array['owner','admin','matchmaker']::ringops.membership_role[]));
create policy "industry views event orgs" on ringops.event_organizations for select to authenticated using (ringops.is_industry_member());

create policy "anyone views public bouts" on ringops.bouts for select to anon,authenticated using (
  (boxer_a_id is null or exists(select 1 from ringops.boxers b where b.id=bouts.boxer_a_id and b.is_public))
  and (boxer_b_id is null or exists(select 1 from ringops.boxers b where b.id=bouts.boxer_b_id and b.is_public))
);

create policy "industry views open matches" on ringops.open_matches for select to authenticated using (ringops.is_industry_member());
create policy "org creates open matches" on ringops.open_matches for insert to authenticated with check (created_by=auth.uid() and ringops.has_organization_role(organization_id,array['owner','admin','matchmaker']::ringops.membership_role[]));
create policy "org updates open matches" on ringops.open_matches for update to authenticated using (ringops.has_organization_role(organization_id,array['owner','admin','matchmaker']::ringops.membership_role[])) with check (ringops.has_organization_role(organization_id,array['owner','admin','matchmaker']::ringops.membership_role[]));

create policy "participants view cases" on ringops.matchmaking_cases for select to authenticated using (ringops.is_case_participant(id));
create policy "participants update cases" on ringops.matchmaking_cases for update to authenticated using (ringops.is_case_participant(id)) with check (ringops.is_case_participant(id));
create policy "participants view case orgs" on ringops.matchmaking_case_organizations for select to authenticated using (ringops.is_case_participant(case_id));

create policy "org views candidate lists" on ringops.candidate_lists for select to authenticated using (ringops.is_active_organization_member(organization_id));
create policy "org manages candidate lists" on ringops.candidate_lists for all to authenticated using (ringops.has_organization_role(organization_id,array['owner','admin','matchmaker','staff']::ringops.membership_role[])) with check (ringops.has_organization_role(organization_id,array['owner','admin','matchmaker','staff']::ringops.membership_role[]));
create policy "org views candidate boxers" on ringops.candidate_list_boxers for select to authenticated using (exists(select 1 from ringops.candidate_lists l where l.id=candidate_list_boxers.list_id and ringops.is_active_organization_member(l.organization_id)));
create policy "org manages candidate boxers" on ringops.candidate_list_boxers for all to authenticated using (exists(select 1 from ringops.candidate_lists l where l.id=candidate_list_boxers.list_id and ringops.has_organization_role(l.organization_id,array['owner','admin','matchmaker','staff']::ringops.membership_role[]))) with check (exists(select 1 from ringops.candidate_lists l where l.id=candidate_list_boxers.list_id and ringops.has_organization_role(l.organization_id,array['owner','admin','matchmaker','staff']::ringops.membership_role[])));

create policy "participants view conversations" on ringops.conversations for select to authenticated using (exists(select 1 from ringops.conversation_organizations co where co.conversation_id=conversations.id and ringops.is_active_organization_member(co.organization_id)));
create policy "participants view conversation orgs" on ringops.conversation_organizations for select to authenticated using (ringops.is_active_organization_member(organization_id));
create policy "participants view messages" on ringops.messages for select to authenticated using (exists(select 1 from ringops.conversation_organizations co where co.conversation_id=messages.conversation_id and ringops.is_active_organization_member(co.organization_id)));
create policy "participants send messages" on ringops.messages for insert to authenticated with check (sender_profile_id=auth.uid() and exists(select 1 from ringops.conversation_organizations co where co.conversation_id=messages.conversation_id and ringops.is_active_organization_member(co.organization_id)));
create policy "user views notifications" on ringops.notifications for select to authenticated using (user_id=auth.uid());
create policy "user updates notifications" on ringops.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

grant select on ringops.bouts to anon,authenticated;
grant select on ringops.data_providers,ringops.boxer_source_records,ringops.events,ringops.event_organizations,ringops.open_matches,ringops.matchmaking_cases,ringops.matchmaking_case_organizations,ringops.candidate_lists,ringops.candidate_list_boxers,ringops.conversations,ringops.conversation_organizations,ringops.messages,ringops.notifications to authenticated;
grant insert,update on ringops.events,ringops.open_matches,ringops.matchmaking_cases,ringops.candidate_lists,ringops.candidate_list_boxers,ringops.messages,ringops.notifications to authenticated;
grant execute on function ringops.start_boxer_consultation(uuid,text,date,numeric,smallint,text) to authenticated;
grant execute on function ringops.set_case_approval(uuid,boolean) to authenticated;
grant execute on function ringops.is_case_participant(uuid) to authenticated;
grant all on ringops.data_providers,ringops.boxer_source_records,ringops.events,ringops.event_organizations,ringops.bouts,ringops.open_matches,ringops.matchmaking_cases,ringops.matchmaking_case_organizations,ringops.candidate_lists,ringops.candidate_list_boxers,ringops.conversations,ringops.conversation_organizations,ringops.messages,ringops.notifications to service_role;
