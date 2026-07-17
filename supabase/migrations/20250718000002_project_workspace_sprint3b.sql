-- Sprint 3B: Projects Workspace — tasks, milestones, files, discussions, goals, activity

create type public.project_task_status as enum ('todo', 'in_progress', 'review', 'done');
create type public.project_task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.project_member_role as enum ('owner', 'admin', 'collaborator', 'member');
create type public.project_goal_type as enum ('weekly', 'quarterly');
create type public.project_goal_status as enum ('active', 'completed', 'expired');

-- Extend impact events for workspace actions
alter type public.impact_event_type add value if not exists 'project_task_created';
alter type public.impact_event_type add value if not exists 'project_task_completed';
alter type public.impact_event_type add value if not exists 'project_file_uploaded';
alter type public.impact_event_type add value if not exists 'project_goal_completed';
alter type public.impact_event_type add value if not exists 'project_milestone_completed';

-- Link project to owner life mission (optional)
alter table public.projects
  add column if not exists mission_id uuid references public.missions(id) on delete set null;

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  assignee_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status public.project_task_status not null default 'todo',
  priority public.project_task_priority not null default 'medium',
  deadline date,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_tasks_project_status_idx on public.project_tasks(project_id, status, sort_order);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index project_milestones_project_idx on public.project_milestones(project_id, sort_order);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_size integer not null default 0 check (file_size >= 0),
  mime_type text,
  version integer not null default 1 check (version >= 1),
  parent_file_id uuid references public.project_files(id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_files_project_idx on public.project_files(project_id, created_at desc);

create table public.project_discussions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.project_discussions(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  parent_reply_id uuid references public.project_discussion_replies(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index project_discussions_project_idx on public.project_discussions(project_id, created_at desc);
create index project_discussion_replies_discussion_idx on public.project_discussion_replies(discussion_id, created_at);

create table public.project_goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  goal_type public.project_goal_type not null default 'weekly',
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  due_date date,
  status public.project_goal_status not null default 'active',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index project_goals_project_idx on public.project_goals(project_id, goal_type);

create table public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  activity_type text not null,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index project_activity_project_idx on public.project_activity(project_id, created_at desc);

create trigger project_tasks_updated_at
  before update on public.project_tasks
  for each row execute function public.handle_updated_at();

create trigger project_discussions_updated_at
  before update on public.project_discussions
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.project_tasks enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_files enable row level security;
alter table public.project_discussions enable row level security;
alter table public.project_discussion_replies enable row level security;
alter table public.project_goals enable row level security;
alter table public.project_activity enable row level security;

create policy "Project members read tasks"
  on public.project_tasks for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members manage tasks"
  on public.project_tasks for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_tasks.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read milestones"
  on public.project_milestones for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_milestones.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members manage milestones"
  on public.project_milestones for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_milestones.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_milestones.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read files"
  on public.project_files for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_files.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members upload files"
  on public.project_files for insert
  with check (
    auth.uid() = uploader_id
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_files.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read discussions"
  on public.project_discussions for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_discussions.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members create discussions"
  on public.project_discussions for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_discussions.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read replies"
  on public.project_discussion_replies for select
  using (
    exists (
      select 1 from public.project_discussions d
      join public.project_members pm on pm.project_id = d.project_id
      where d.id = project_discussion_replies.discussion_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members create replies"
  on public.project_discussion_replies for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.project_discussions d
      join public.project_members pm on pm.project_id = d.project_id
      where d.id = project_discussion_replies.discussion_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read goals"
  on public.project_goals for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_goals.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members manage goals"
  on public.project_goals for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_goals.project_id and pm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_goals.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members read activity"
  on public.project_activity for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_activity.project_id and pm.user_id = auth.uid()
    )
  );

create policy "Project members insert activity"
  on public.project_activity for insert
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = project_activity.project_id and pm.user_id = auth.uid()
    )
  );

-- Storage bucket for project files
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 10485760)
on conflict (id) do nothing;

create policy "Project members read project files storage"
  on storage.objects for select
  using (bucket_id = 'project-files');

create policy "Project members upload project files storage"
  on storage.objects for insert
  with check (bucket_id = 'project-files' and auth.uid() is not null);
