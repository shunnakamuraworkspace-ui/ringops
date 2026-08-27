alter table ringops.bouts
  add column if not exists matchmaking_status text not null default 'recruiting'
  check (matchmaking_status in ('recruiting','negotiating','confirmed'));

update ringops.bouts
set matchmaking_status = case
  when boxer_a_id is not null and boxer_b_id is not null then 'confirmed'
  else matchmaking_status
end;

create index if not exists ringops_bouts_matchmaking_status_idx
  on ringops.bouts(event_id, matchmaking_status, created_at);
