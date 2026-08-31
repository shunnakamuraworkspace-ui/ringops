alter table ringops.bouts
  add column if not exists competition_category text
  check (competition_category in ('men','women'));

create index if not exists ringops_bouts_competition_idx
  on ringops.bouts(competition_category, matchmaking_status);
