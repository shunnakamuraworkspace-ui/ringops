create or replace function ringops.shares_active_organization(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from ringops.organization_memberships mine
    join ringops.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = target_user_id
      and theirs.status = 'active'
  );
$$;

revoke execute on function ringops.shares_active_organization(uuid) from public, anon;
grant execute on function ringops.shares_active_organization(uuid) to authenticated;

create policy "organization members view shared profiles"
on ringops.profiles for select to authenticated
using (id = auth.uid() or ringops.shares_active_organization(id));

grant select on ringops.profiles to authenticated;
