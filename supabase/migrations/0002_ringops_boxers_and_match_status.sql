create type ringops.boxer_class as enum ('A', 'B', 'C');
create type ringops.stance as enum ('orthodox', 'southpaw');
create type ringops.match_status as enum ('accepting', 'conditional', 'paused');

create table ringops.boxers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ringops.organizations(id),
  name text not null,
  name_kana text not null,
  normalized_name text not null,
  photo_url text,
  nationality text,
  country_code text not null default 'JP',
  residence_country_code text,
  domestic_or_international text not null default 'domestic' check (domestic_or_international in ('domestic','international')),
  prefecture_code text,
  birthplace text,
  birth_date date,
  height_cm numeric(5,2),
  reach_cm numeric(5,2),
  division_code text not null,
  boxer_class ringops.boxer_class not null,
  stance ringops.stance not null,
  total_bouts smallint not null default 0 check (total_bouts >= 0),
  wins smallint not null default 0 check (wins >= 0),
  losses smallint not null default 0 check (losses >= 0),
  draws smallint not null default 0 check (draws >= 0),
  ko_wins smallint not null default 0 check (ko_wins >= 0 and ko_wins <= wins),
  last_bout_date date,
  last_opponent_name text,
  last_result text,
  next_bout_date date,
  next_opponent_name text,
  next_event_name text,
  next_venue_name text,
  external_ids jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boxer_record_totals_valid check (wins + losses + draws <= total_bouts)
);

create table ringops.rankings (
  id uuid primary key default gen_random_uuid(),
  boxer_id uuid not null references ringops.boxers(id) on delete cascade,
  ranking_body text not null,
  division_code text not null,
  rank smallint check (rank is null or rank > 0),
  champion_status text not null default 'none',
  ranking_date date not null,
  source text,
  source_url text,
  fetched_at timestamptz,
  verified_at timestamptz,
  last_updated_at timestamptz not null default now(),
  unique (boxer_id, ranking_body, division_code, ranking_date)
);

create table ringops.boxer_social_links (
  id uuid primary key default gen_random_uuid(),
  boxer_id uuid not null references ringops.boxers(id) on delete cascade,
  platform text not null check (platform in ('instagram','x','tiktok','youtube','other')),
  url text not null,
  display_order smallint not null default 0,
  unique (boxer_id, platform, url)
);

create table ringops.boxer_match_statuses (
  boxer_id uuid primary key references ringops.boxers(id) on delete cascade,
  status ringops.match_status not null,
  available_from date,
  available_to date,
  min_contract_weight_kg numeric(5,2),
  max_contract_weight_kg numeric(5,2),
  desired_rounds smallint[] not null default '{}',
  travel_condition text,
  comment text check (comment is null or char_length(comment) <= 1000),
  updated_at timestamptz not null default now(),
  updated_by uuid references ringops.profiles(id) on delete set null,
  verified_at timestamptz not null default now(),
  verified_by uuid references ringops.profiles(id) on delete set null,
  version integer not null default 1,
  constraint match_status_date_range_valid check (available_to is null or available_from is null or available_to >= available_from),
  constraint match_status_weight_range_valid check (max_contract_weight_kg is null or min_contract_weight_kg is null or max_contract_weight_kg >= min_contract_weight_kg),
  constraint match_status_rounds_valid check (desired_rounds <@ array[4,6,8,10,12]::smallint[])
);

create table ringops.boxer_correction_requests (
  id uuid primary key default gen_random_uuid(),
  boxer_id uuid not null references ringops.boxers(id) on delete cascade,
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  requested_by uuid not null references ringops.profiles(id) on delete restrict,
  field_name text not null,
  requested_value text,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index ringops_boxers_directory_idx on ringops.boxers(division_code, boxer_class, stance, is_public);
create index ringops_boxers_record_idx on ringops.boxers(total_bouts, wins, losses, ko_wins);
create index ringops_boxers_dates_idx on ringops.boxers(last_bout_date, next_bout_date);
create index ringops_boxers_normalized_name_idx on ringops.boxers(normalized_name);
create index ringops_rankings_search_idx on ringops.rankings(ranking_body, division_code, rank, ranking_date desc);
create index ringops_match_status_search_idx on ringops.boxer_match_statuses(status, available_from, available_to, min_contract_weight_kg, max_contract_weight_kg);
create index ringops_match_status_rounds_idx on ringops.boxer_match_statuses using gin(desired_rounds);

create trigger ringops_boxers_updated_at before update on ringops.boxers for each row execute function ringops.set_updated_at();

alter table ringops.boxers enable row level security;
alter table ringops.rankings enable row level security;
alter table ringops.boxer_social_links enable row level security;
alter table ringops.boxer_match_statuses enable row level security;
alter table ringops.boxer_correction_requests enable row level security;

create policy "anyone views public boxers" on ringops.boxers for select to anon, authenticated using (is_public);
create policy "anyone views public boxer rankings" on ringops.rankings for select to anon, authenticated using (exists (select 1 from ringops.boxers b where b.id = rankings.boxer_id and b.is_public));
create policy "anyone views public boxer social links" on ringops.boxer_social_links for select to anon, authenticated using (exists (select 1 from ringops.boxers b where b.id = boxer_social_links.boxer_id and b.is_public));
create policy "public views organizations with public boxers" on ringops.organizations for select to anon, authenticated using (exists (select 1 from ringops.boxers b where b.organization_id = organizations.id and b.is_public));

create policy "industry views match status" on ringops.boxer_match_statuses for select to authenticated using (ringops.is_industry_member());
create policy "gym creates own boxer status" on ringops.boxer_match_statuses for insert to authenticated with check (
  exists (select 1 from ringops.boxers b where b.id = boxer_match_statuses.boxer_id and ringops.has_organization_role(b.organization_id, array['owner','admin','matchmaker']::ringops.membership_role[]))
);
create policy "gym updates own boxer status" on ringops.boxer_match_statuses for update to authenticated using (
  exists (select 1 from ringops.boxers b where b.id = boxer_match_statuses.boxer_id and ringops.has_organization_role(b.organization_id, array['owner','admin','matchmaker']::ringops.membership_role[]))
) with check (
  exists (select 1 from ringops.boxers b where b.id = boxer_match_statuses.boxer_id and ringops.has_organization_role(b.organization_id, array['owner','admin','matchmaker']::ringops.membership_role[]))
);

create policy "gym submits correction request" on ringops.boxer_correction_requests for insert to authenticated with check (
  requested_by = (select auth.uid()) and ringops.is_active_organization_member(organization_id)
  and exists (select 1 from ringops.boxers b where b.id = boxer_correction_requests.boxer_id and b.organization_id = boxer_correction_requests.organization_id)
);
create policy "gym reads correction requests" on ringops.boxer_correction_requests for select to authenticated using (ringops.is_active_organization_member(organization_id));

grant select on ringops.organizations, ringops.boxers, ringops.rankings, ringops.boxer_social_links to anon, authenticated;
grant select, insert, update on ringops.boxer_match_statuses to authenticated;
grant select, insert on ringops.boxer_correction_requests to authenticated;
grant all on ringops.boxers, ringops.rankings, ringops.boxer_social_links, ringops.boxer_match_statuses, ringops.boxer_correction_requests to service_role;
