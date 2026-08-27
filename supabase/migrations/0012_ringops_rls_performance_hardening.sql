drop policy if exists "org creates open matches" on ringops.open_matches;
create policy "org creates open matches" on ringops.open_matches for insert to authenticated
with check (
  created_by = (select auth.uid())
  and ringops.has_organization_role(organization_id,array['owner','admin','matchmaker']::ringops.membership_role[])
);

drop policy if exists "participants send messages" on ringops.messages;
create policy "participants send messages" on ringops.messages for insert to authenticated
with check (
  sender_profile_id = (select auth.uid())
  and exists(
    select 1 from ringops.conversation_organizations co
    where co.conversation_id=messages.conversation_id
      and ringops.is_active_organization_member(co.organization_id)
  )
);

drop policy if exists "user views notifications" on ringops.notifications;
create policy "user views notifications" on ringops.notifications for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "user updates notifications" on ringops.notifications;
create policy "user updates notifications" on ringops.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "organization members view shared profiles" on ringops.profiles;
create policy "organization members view shared profiles" on ringops.profiles for select to authenticated
using (id = (select auth.uid()) or ringops.shares_active_organization(id));

drop policy if exists "conversation participants view sender profiles" on ringops.profiles;
create policy "conversation participants view sender profiles" on ringops.profiles for select to authenticated
using (id = (select auth.uid()) or ringops.shares_active_organization(id) or ringops.shares_conversation(id));

create index if not exists ringops_boxers_organization_idx on ringops.boxers(organization_id);
create index if not exists ringops_events_promoter_idx on ringops.events(promoter_organization_id);
create index if not exists ringops_bouts_event_fk_idx on ringops.bouts(event_id);
create index if not exists ringops_bouts_boxer_a_idx on ringops.bouts(boxer_a_id);
create index if not exists ringops_bouts_boxer_b_idx on ringops.bouts(boxer_b_id);
create index if not exists ringops_open_matches_organization_idx on ringops.open_matches(organization_id);
create index if not exists ringops_open_matches_target_boxer_idx on ringops.open_matches(target_boxer_id);
create index if not exists ringops_open_matches_event_idx on ringops.open_matches(event_id);
create index if not exists ringops_cases_event_idx on ringops.matchmaking_cases(event_id);
create index if not exists ringops_cases_promoter_idx on ringops.matchmaking_cases(promoter_organization_id);
create index if not exists ringops_cases_boxer_a_idx on ringops.matchmaking_cases(boxer_a_id);
create index if not exists ringops_cases_boxer_b_idx on ringops.matchmaking_cases(boxer_b_id);
create index if not exists ringops_cases_replacement_open_match_idx on ringops.matchmaking_cases(replacement_open_match_id);
create index if not exists ringops_case_orgs_organization_idx on ringops.matchmaking_case_organizations(organization_id);
create index if not exists ringops_event_orgs_organization_idx on ringops.event_organizations(organization_id);
create index if not exists ringops_candidate_lists_organization_idx on ringops.candidate_lists(organization_id);
create index if not exists ringops_candidate_list_boxers_boxer_idx on ringops.candidate_list_boxers(boxer_id);
create index if not exists ringops_conversations_case_idx on ringops.conversations(matchmaking_case_id);
create index if not exists ringops_conversations_event_idx on ringops.conversations(event_id);
create index if not exists ringops_conversation_orgs_organization_idx on ringops.conversation_organizations(organization_id);
create index if not exists ringops_messages_sender_idx on ringops.messages(sender_profile_id);
notify pgrst, 'reload schema';
