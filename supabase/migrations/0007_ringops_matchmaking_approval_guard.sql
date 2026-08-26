drop policy if exists "participants update cases" on ringops.matchmaking_cases;

create policy "participants update cases"
on ringops.matchmaking_cases for update to authenticated
using (ringops.is_case_participant(id))
with check (
  ringops.is_case_participant(id)
  and (
    status <> 'confirmed'
    or not exists (
      select 1
      from ringops.matchmaking_case_organizations co
      where co.case_id = matchmaking_cases.id
        and co.role in ('gym_a','gym_b')
        and co.approved_at is null
    )
  )
);
