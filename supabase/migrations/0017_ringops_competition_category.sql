alter table ringops.boxers
  add column if not exists competition_category text
  check (competition_category in ('men','women'));

update ringops.boxers
set competition_category = 'men'
where competition_category is null
  and id::text like '20000000-%';

comment on column ringops.boxers.competition_category is
  'Competition category used for boxing rules/divisions: men or women. This is an operational competition classification, not a general personal sex/gender field.';
