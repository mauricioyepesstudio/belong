-- BELONG: project workspace — community linkage + activity feed
-- Migration: 20250717000002_project_workspace

-- Backfill community_id from owner's first community membership
update public.projects p
set community_id = (
  select cm.community_id
  from public.community_members cm
  where cm.user_id = p.owner_id
  order by cm.joined_at asc
  limit 1
)
where p.community_id is null;

-- Remove projects that cannot be linked to a community
delete from public.projects where community_id is null;

alter table public.projects
  alter column community_id set not null;

create index if not exists projects_community_created_idx
  on public.projects(community_id, created_at desc);

create table public.project_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.project_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.project_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.project_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_posts_project_idx on public.project_posts(project_id);
create index project_posts_author_idx on public.project_posts(author_id);
create index project_posts_created_idx on public.project_posts(project_id, created_at desc);
create index project_post_likes_post_idx on public.project_post_likes(post_id);
create index project_post_comments_post_idx on public.project_post_comments(post_id);

create trigger project_posts_updated_at
  before update on public.project_posts
  for each row execute function public.handle_updated_at();

create trigger project_post_comments_updated_at
  before update on public.project_post_comments
  for each row execute function public.handle_updated_at();

alter table public.project_posts enable row level security;
alter table public.project_post_likes enable row level security;
alter table public.project_post_comments enable row level security;

create policy "Anyone can view project posts"
  on public.project_posts for select using (true);

create policy "Project members create posts"
  on public.project_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.project_members pm
      where pm.project_id = project_posts.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Authors update project posts"
  on public.project_posts for update
  using (auth.uid() = author_id);

create policy "Authors delete project posts"
  on public.project_posts for delete
  using (auth.uid() = author_id);

create policy "Anyone can view project post likes"
  on public.project_post_likes for select using (true);

create policy "Project members like posts"
  on public.project_post_likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.project_posts p
      join public.project_members pm on pm.project_id = p.project_id
      where p.id = project_post_likes.post_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Users unlike project posts"
  on public.project_post_likes for delete
  using (auth.uid() = user_id);

create policy "Anyone can view project post comments"
  on public.project_post_comments for select using (true);

create policy "Project members comment on posts"
  on public.project_post_comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.project_posts p
      join public.project_members pm on pm.project_id = p.project_id
      where p.id = project_post_comments.post_id
        and pm.user_id = auth.uid()
    )
  );

create policy "Authors update project comments"
  on public.project_post_comments for update
  using (auth.uid() = author_id);

create policy "Authors delete project comments"
  on public.project_post_comments for delete
  using (auth.uid() = author_id);
