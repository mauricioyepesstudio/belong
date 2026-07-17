-- Sprint 4A: Team & Organization Engine

create type public.organization_member_role as enum (
  'owner',
  'admin',
  'manager',
  'member',
  'guest'
);

alter type public.impact_event_module add value if not exists 'organization';
alter type public.impact_event_type add value if not exists 'organization_created';
alter type public.impact_event_type add value if not exists 'organization_join';
alter type public.impact_event_type add value if not exists 'organization_invite_accepted';

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  website text,
  owner_id uuid not null references public.users(id) on delete cascade,
  impact_score integer not null default 0 check (impact_score >= 0),
  reputation_level text not null default 'Emerging',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organizations_owner_idx on public.organizations(owner_id);
create index organization_members_user_idx on public.organization_members(user_id);
create index organization_members_org_idx on public.organization_members(organization_id);

alter table public.communities
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.projects
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.missions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists communities_organization_idx on public.communities(organization_id);
create index if not exists projects_organization_idx on public.projects(organization_id);
create index if not exists missions_organization_idx on public.missions(organization_id);

-- Backfill: one organization per user who owns communities, projects, or missions
insert into public.organizations (name, slug, description, owner_id)
select distinct on (u.id)
  coalesce(nullif(trim(u.full_name), ''), 'Builder') || '''s Organization',
  'org-' || substr(replace(u.id::text, '-', ''), 1, 12),
  'Default organization for existing BELONG assets',
  u.id
from public.users u
where exists (select 1 from public.communities c where c.owner_id = u.id)
   or exists (select 1 from public.projects p where p.owner_id = u.id)
   or exists (select 1 from public.missions m where m.user_id = u.id)
on conflict (slug) do nothing;

insert into public.organization_members (organization_id, user_id, role)
select o.id, o.owner_id, 'owner'::public.organization_member_role
from public.organizations o
on conflict (organization_id, user_id) do nothing;

update public.communities c
set organization_id = o.id
from public.organizations o
where c.organization_id is null
  and o.owner_id = c.owner_id;

update public.projects p
set organization_id = coalesce(
  (select c.organization_id from public.communities c where c.id = p.community_id),
  (select o.id from public.organizations o where o.owner_id = p.owner_id limit 1)
)
where p.organization_id is null;

update public.missions m
set organization_id = o.id
from public.organizations o
where m.organization_id is null
  and o.owner_id = m.user_id;

alter table public.communities alter column organization_id set not null;
alter table public.projects alter column organization_id set not null;
alter table public.missions alter column organization_id set not null;

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "Anyone can view organizations"
  on public.organizations for select using (true);

create policy "Authenticated users create organizations"
  on public.organizations for insert
  with check (auth.uid() = owner_id);

create policy "Org owners and admins update organizations"
  on public.organizations for update
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

create policy "Org owners delete organizations"
  on public.organizations for delete
  using (auth.uid() = owner_id);

create policy "Anyone can view organization members"
  on public.organization_members for select using (true);

create policy "Org managers can insert members"
  on public.organization_members for insert
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin', 'manager')
    )
    or auth.uid() = user_id
  );

create policy "Org admins update member roles"
  on public.organization_members for update
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

create policy "Members leave or admins remove"
  on public.organization_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin', 'manager')
    )
  );

alter publication supabase_realtime add table public.organization_members;
