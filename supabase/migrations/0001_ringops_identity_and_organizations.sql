create extension if not exists pgcrypto;
create schema if not exists ringops;

grant usage on schema ringops to anon, authenticated, service_role;

create type ringops.organization_type as enum ('gym', 'promoter', 'platform', 'other');
create type ringops.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type ringops.membership_role as enum ('owner', 'admin', 'matchmaker', 'staff', 'viewer');
create type ringops.membership_status as enum ('invited', 'active', 'suspended');

create table ringops.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ringops.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_type ringops.organization_type not null,
  legal_name text not null check (char_length(legal_name) between 1 and 200),
  display_name text not null check (char_length(display_name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  country_code text not null default 'JP' check (country_code ~ '^[A-Z]{2}$'),
  prefecture_code text check (prefecture_code is null or prefecture_code ~ '^[0-9]{2}$'),
  verification_status ringops.verification_status not null default 'unverified',
  verified_at timestamptz,
  verified_by uuid references ringops.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_verification_consistent check (
    (verification_status = 'verified' and verified_at is not null and verified_by is not null)
    or (verification_status <> 'verified' and verified_at is null and verified_by is null)
  )
);

create table ringops.organization_memberships (
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  user_id uuid not null references ringops.profiles(id) on delete cascade,
  role ringops.membership_role not null,
  status ringops.membership_status not null default 'invited',
  invited_by uuid references ringops.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint memberships_joined_at_consistent check (
    (status = 'active' and joined_at is not null)
    or (status <> 'active' and joined_at is null)
  )
);

create table ringops.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  email text not null,
  role ringops.membership_role not null,
  token_hash bytea not null unique,
  invited_by uuid not null references ringops.profiles(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table ringops.organization_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ringops.organizations(id) on delete cascade,
  status ringops.verification_status not null,
  submitted_by uuid references ringops.profiles(id) on delete set null,
  reviewed_by uuid references ringops.profiles(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  created_at timestamptz not null default now()
);

create table ringops.audit_logs (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references ringops.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  organization_id uuid references ringops.organizations(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now()
);

create index ringops_memberships_user_idx on ringops.organization_memberships(user_id, status, organization_id);
create index ringops_invitations_org_idx on ringops.organization_invitations(organization_id, expires_at desc);
create index ringops_audit_org_idx on ringops.audit_logs(organization_id, occurred_at desc);

create or replace function ringops.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ringops_profiles_updated_at before update on ringops.profiles for each row execute function ringops.set_updated_at();
create trigger ringops_organizations_updated_at before update on ringops.organizations for each row execute function ringops.set_updated_at();
create trigger ringops_memberships_updated_at before update on ringops.organization_memberships for each row execute function ringops.set_updated_at();

create or replace function ringops.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into ringops.profiles(id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(split_part(new.email, '@', 1), ''), 'ユーザー')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ringops_on_auth_user_created on auth.users;
create trigger ringops_on_auth_user_created after insert on auth.users for each row execute function ringops.handle_new_user();

create or replace function ringops.is_active_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ringops.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function ringops.has_organization_role(target_organization_id uuid, accepted_roles ringops.membership_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ringops.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(accepted_roles)
  );
$$;

create or replace function ringops.is_industry_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from ringops.organization_memberships m
    where m.user_id = (select auth.uid()) and m.status = 'active'
  );
$$;

create or replace function ringops.create_organization(
  p_display_name text,
  p_slug text,
  p_type text default 'gym'
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from ringops.profiles where id = v_user) then
    insert into ringops.profiles(id, display_name) values (v_user, 'ユーザー') on conflict do nothing;
  end if;
  insert into ringops.organizations(organization_type, legal_name, display_name, slug)
  values (p_type::ringops.organization_type, p_display_name, p_display_name, p_slug)
  returning id into v_org;
  insert into ringops.organization_memberships(organization_id, user_id, role, status, joined_at)
  values (v_org, v_user, 'owner', 'active', now());
  return v_org;
end;
$$;

create or replace function ringops.create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_role text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_token text := encode(gen_random_bytes(24), 'hex');
begin
  if not ringops.has_organization_role(p_organization_id, array['owner','admin']::ringops.membership_role[]) then
    raise exception 'permission denied';
  end if;
  insert into ringops.organization_invitations(organization_id, email, role, token_hash, invited_by)
  values (p_organization_id, lower(trim(p_email)), p_role::ringops.membership_role, digest(v_token, 'sha256'), auth.uid());
  return v_token;
end;
$$;

create or replace function ringops.accept_organization_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_inv ringops.organization_invitations%rowtype;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into v_inv
  from ringops.organization_invitations
  where token_hash = digest(p_token, 'sha256') and accepted_at is null and expires_at > now()
  limit 1;
  if v_inv.id is null then raise exception 'invitation invalid or expired'; end if;
  if lower(v_inv.email) <> v_email then raise exception 'invitation email mismatch'; end if;

  insert into ringops.organization_memberships(organization_id, user_id, role, status, invited_by, joined_at)
  values (v_inv.organization_id, auth.uid(), v_inv.role, 'active', v_inv.invited_by, now())
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active', joined_at = now();

  update ringops.organization_invitations set accepted_at = now() where id = v_inv.id;
  return v_inv.organization_id;
end;
$$;

alter table ringops.profiles enable row level security;
alter table ringops.organizations enable row level security;
alter table ringops.organization_memberships enable row level security;
alter table ringops.organization_invitations enable row level security;
alter table ringops.organization_verifications enable row level security;
alter table ringops.audit_logs enable row level security;

create policy "user reads own profile" on ringops.profiles for select to authenticated using (id = (select auth.uid()));
create policy "user updates own profile" on ringops.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "members read organizations" on ringops.organizations for select to authenticated using (ringops.is_active_organization_member(id));
create policy "members read memberships" on ringops.organization_memberships for select to authenticated using (ringops.is_active_organization_member(organization_id));
create policy "owners manage memberships" on ringops.organization_memberships for update to authenticated using (ringops.has_organization_role(organization_id, array['owner']::ringops.membership_role[])) with check (ringops.has_organization_role(organization_id, array['owner']::ringops.membership_role[]));
create policy "admins read invitations" on ringops.organization_invitations for select to authenticated using (ringops.has_organization_role(organization_id, array['owner','admin']::ringops.membership_role[]));
create policy "admins read verification history" on ringops.organization_verifications for select to authenticated using (ringops.has_organization_role(organization_id, array['owner','admin']::ringops.membership_role[]));
create policy "admins submit verification" on ringops.organization_verifications for insert to authenticated with check (status = 'pending' and submitted_by = (select auth.uid()) and ringops.has_organization_role(organization_id, array['owner','admin']::ringops.membership_role[]));
create policy "admins read audit logs" on ringops.audit_logs for select to authenticated using (ringops.has_organization_role(organization_id, array['owner','admin']::ringops.membership_role[]));

grant select, update on ringops.profiles to authenticated;
grant select on ringops.organizations, ringops.organization_memberships, ringops.organization_invitations, ringops.organization_verifications, ringops.audit_logs to authenticated;
grant insert on ringops.organization_verifications to authenticated;
grant execute on function ringops.create_organization(text,text,text) to authenticated;
grant execute on function ringops.create_organization_invitation(uuid,text,text) to authenticated;
grant execute on function ringops.accept_organization_invitation(text) to authenticated;
grant execute on function ringops.is_active_organization_member(uuid) to authenticated;
grant execute on function ringops.has_organization_role(uuid,ringops.membership_role[]) to authenticated;
grant execute on function ringops.is_industry_member() to authenticated;

grant all on all tables in schema ringops to service_role;
grant all on all sequences in schema ringops to service_role;
grant execute on all functions in schema ringops to service_role;
