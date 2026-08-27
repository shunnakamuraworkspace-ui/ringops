create policy "promoter creates event bouts"
on ringops.bouts for insert to authenticated
with check (
  event_id is not null
  and exists (
    select 1 from ringops.events e
    where e.id = bouts.event_id
      and ringops.has_organization_role(e.promoter_organization_id, array['owner','admin','matchmaker']::ringops.membership_role[])
  )
);

create policy "promoter updates event bouts"
on ringops.bouts for update to authenticated
using (
  event_id is not null
  and exists (
    select 1 from ringops.events e
    where e.id = bouts.event_id
      and ringops.has_organization_role(e.promoter_organization_id, array['owner','admin','matchmaker']::ringops.membership_role[])
  )
)
with check (
  event_id is not null
  and exists (
    select 1 from ringops.events e
    where e.id = bouts.event_id
      and ringops.has_organization_role(e.promoter_organization_id, array['owner','admin','matchmaker']::ringops.membership_role[])
  )
);

create policy "promoter deletes event bouts"
on ringops.bouts for delete to authenticated
using (
  event_id is not null
  and exists (
    select 1 from ringops.events e
    where e.id = bouts.event_id
      and ringops.has_organization_role(e.promoter_organization_id, array['owner','admin','matchmaker']::ringops.membership_role[])
  )
);

grant insert, update, delete on ringops.bouts to authenticated;

create index if not exists ringops_bouts_event_manage_idx on ringops.bouts(event_id, created_at);
