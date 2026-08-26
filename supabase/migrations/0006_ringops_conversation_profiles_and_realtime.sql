create or replace function ringops.shares_conversation(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from ringops.messages target_message
    join ringops.conversation_organizations target_co on target_co.conversation_id = target_message.conversation_id
    join ringops.conversation_organizations mine_co on mine_co.conversation_id = target_message.conversation_id
    join ringops.organization_memberships mine on mine.organization_id = mine_co.organization_id
    where target_message.sender_profile_id = target_user_id
      and mine.user_id = auth.uid()
      and mine.status = 'active'
  );
$$;

revoke execute on function ringops.shares_conversation(uuid) from public, anon;
grant execute on function ringops.shares_conversation(uuid) to authenticated;

create policy "conversation participants view sender profiles"
on ringops.profiles for select to authenticated
using (id = auth.uid() or ringops.shares_active_organization(id) or ringops.shares_conversation(id));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table ringops.messages;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
