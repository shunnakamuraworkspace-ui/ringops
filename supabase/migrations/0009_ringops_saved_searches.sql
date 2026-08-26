create table ringops.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references ringops.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index ringops_saved_searches_user_updated_idx
  on ringops.saved_searches (user_id, updated_at desc);

create trigger ringops_saved_searches_updated_at
before update on ringops.saved_searches
for each row execute function ringops.set_updated_at();

alter table ringops.saved_searches enable row level security;

create policy "users can view own saved searches"
on ringops.saved_searches
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users can create own saved searches"
on ringops.saved_searches
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and ringops.is_industry_member()
);

create policy "users can update own saved searches"
on ringops.saved_searches
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users can delete own saved searches"
on ringops.saved_searches
for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update, delete on ringops.saved_searches to authenticated;
grant all on ringops.saved_searches to service_role;
