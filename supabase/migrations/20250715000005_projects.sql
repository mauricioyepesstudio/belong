-- BELONG: projects
-- Migration: 20250715000005_projects

create type public.project_status as enum ('planning', 'active', 'completed', 'archived');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  deadline date,
  owner_id uuid not null references public.users(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index projects_owner_idx on public.projects(owner_id);
create index projects_community_idx on public.projects(community_id);
create index project_members_user_idx on public.project_members(user_id);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Anyone can view projects"
  on public.projects for select using (true);

create policy "Owners create projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Owners and members update projects"
  on public.projects for update
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );

create policy "Owners delete projects"
  on public.projects for delete
  using (auth.uid() = owner_id);

create policy "Anyone can view project members"
  on public.project_members for select using (true);

create policy "Project owners add members"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
    or auth.uid() = user_id
  );

create policy "Members can leave projects"
  on public.project_members for delete
  using (auth.uid() = user_id);
