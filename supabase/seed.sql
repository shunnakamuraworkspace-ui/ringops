-- Fictional development data only. Never use as real boxer records.

insert into ringops.organizations(id, organization_type, legal_name, display_name, slug, country_code)
values
  ('10000000-0000-4000-8000-000000000001','gym','青空ボクシングジム','青空ボクシングジム','aozora-boxing','JP'),
  ('10000000-0000-4000-8000-000000000002','gym','東都ファイトジム','東都ファイトジム','toto-fight','JP'),
  ('10000000-0000-4000-8000-000000000003','gym','港町ボクシングクラブ','港町ボクシングクラブ','minatomachi-boxing','JP'),
  ('10000000-0000-4000-8000-000000000004','gym','北辰ボクシングジム','北辰ボクシングジム','hokushin-boxing','JP'),
  ('10000000-0000-4000-8000-000000000005','gym','西東京ボクシングジム','西東京ボクシングジム','west-tokyo-boxing','JP'),
  ('10000000-0000-4000-8000-000000000010','promoter','東京プロモーション','東京プロモーション','tokyo-promotion','JP')
on conflict (id) do nothing;

insert into ringops.boxers(
  id, organization_id, name, name_kana, normalized_name, nationality, country_code,
  prefecture_code, birthplace, birth_date, height_cm, reach_cm, division_code,
  boxer_class, stance, total_bouts, wins, losses, draws, ko_wins,
  last_bout_date, next_bout_date, next_event_name, next_venue_name, is_public
)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','山田 直樹','やまだ なおき','山田直樹','日本','JP','13','東京都','2000-02-14',169,171,'super_bantam','B','orthodox',8,6,2,0,3,'2026-06-12',null,null,null,true),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','佐藤 海斗','さとう かいと','佐藤海斗','日本','JP','13','東京都','1999-08-02',171,174,'super_bantam','B','southpaw',7,5,1,1,2,'2026-05-28','2026-09-18','RING NIGHT','後楽園ホール',true),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','鈴木 蓮','すずき れん','鈴木蓮','日本','JP','14','神奈川県','1997-11-19',173,176,'feather','A','orthodox',13,10,3,0,6,'2026-07-03','2026-10-08','BOXING GATE','後楽園ホール',true),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','高橋 悠真','たかはし ゆうま','高橋悠真','日本','JP','11','埼玉県','2002-05-06',175,178,'light','C','southpaw',3,2,1,0,1,'2026-04-21',null,null,null,true),
  ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','中村 拓海','なかむら たくみ','中村拓海','日本','JP','13','東京都','1996-03-27',174,177,'super_feather','A','orthodox',16,12,3,1,7,'2026-08-02',null,null,null,true)
on conflict (id) do nothing;

insert into ringops.rankings(boxer_id, ranking_body, division_code, rank, ranking_date, source)
values
  ('20000000-0000-4000-8000-000000000002','日本','super_bantam',14,'2026-08-01','development seed'),
  ('20000000-0000-4000-8000-000000000003','日本','feather',8,'2026-08-01','development seed'),
  ('20000000-0000-4000-8000-000000000003','OPBF','feather',11,'2026-08-01','development seed'),
  ('20000000-0000-4000-8000-000000000005','WBO Asia Pacific','super_feather',9,'2026-08-01','development seed'),
  ('20000000-0000-4000-8000-000000000005','OPBF','super_feather',13,'2026-08-01','development seed')
on conflict do nothing;

insert into ringops.boxer_match_statuses(
  boxer_id,status,available_from,min_contract_weight_kg,max_contract_weight_kg,desired_rounds,travel_condition,comment,verified_at
)
values
  ('20000000-0000-4000-8000-000000000001','accepting','2026-11-01',55.0,55.5,array[6]::smallint[],'国内可','11月以降で相談可',now()-interval '3 days'),
  ('20000000-0000-4000-8000-000000000002','conditional','2026-11-01',54.5,55.5,array[6,8]::smallint[],'要相談','次戦後の状態を見て相談',now()),
  ('20000000-0000-4000-8000-000000000003','paused',null,57.0,57.5,array[8]::smallint[],'国内可',null,now()-interval '5 days'),
  ('20000000-0000-4000-8000-000000000004','accepting','2026-09-01',61.0,61.5,array[4]::smallint[],'関東のみ','早期に相談可',now()-interval '8 days'),
  ('20000000-0000-4000-8000-000000000005','accepting','2026-12-01',58.5,59.5,array[8,10]::smallint[],'国内可','12月以降',now()-interval '1 day')
on conflict (boxer_id) do nothing;

insert into ringops.data_providers(provider_code,display_name,provider_type,enabled)
values
  ('ringops-admin','RINGOPS管理者','manual',true),
  ('jbc','JBC','official',false),
  ('opbf','OPBF','official',false),
  ('wbo-ap','WBO Asia Pacific','official',false),
  ('wba','WBA','official',false),
  ('wbc','WBC','official',false),
  ('ibf','IBF','official',false),
  ('wbo','WBO','official',false)
on conflict (provider_code) do nothing;
