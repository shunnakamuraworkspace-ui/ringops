-- Operational access not covered by the public directory policies.

create policy "organization members view own boxers"
on ringops.boxers for select to authenticated
using (ringops.is_active_organization_member(organization_id));

create policy "organization members view own social links"
on ringops.boxer_social_links for select to authenticated
using (
  exists (
    select 1 from ringops.boxers b
    where b.id = boxer_social_links.boxer_id
      and ringops.is_active_organization_member(b.organization_id)
  )
);

-- Staff may view their own organization's profile even before it has a public boxer.
-- This works alongside the existing active-member policy and public-gym policy.

grant select on ringops.boxers, ringops.boxer_social_links to authenticated;
