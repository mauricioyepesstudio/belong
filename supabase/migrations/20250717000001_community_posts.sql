-- BELONG: community posts, comments, and likes
-- Migration: 20250717000001_community_posts

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_posts_community_idx on public.community_posts(community_id);
create index community_posts_author_idx on public.community_posts(author_id);
create index community_posts_created_idx on public.community_posts(community_id, created_at desc);
create index community_post_likes_post_idx on public.community_post_likes(post_id);
create index community_post_likes_user_idx on public.community_post_likes(user_id);
create index community_post_comments_post_idx on public.community_post_comments(post_id);

create trigger community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.handle_updated_at();

create trigger community_post_comments_updated_at
  before update on public.community_post_comments
  for each row execute function public.handle_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
alter table public.community_post_comments enable row level security;

create policy "Anyone can view community posts"
  on public.community_posts for select using (true);

create policy "Members create community posts"
  on public.community_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.community_members cm
      where cm.community_id = community_posts.community_id
        and cm.user_id = auth.uid()
    )
  );

create policy "Authors update community posts"
  on public.community_posts for update
  using (auth.uid() = author_id);

create policy "Authors delete community posts"
  on public.community_posts for delete
  using (auth.uid() = author_id);

create policy "Anyone can view post likes"
  on public.community_post_likes for select using (true);

create policy "Members like posts"
  on public.community_post_likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.community_posts p
      join public.community_members cm on cm.community_id = p.community_id
      where p.id = community_post_likes.post_id
        and cm.user_id = auth.uid()
    )
  );

create policy "Users unlike posts"
  on public.community_post_likes for delete
  using (auth.uid() = user_id);

create policy "Anyone can view post comments"
  on public.community_post_comments for select using (true);

create policy "Members comment on posts"
  on public.community_post_comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.community_posts p
      join public.community_members cm on cm.community_id = p.community_id
      where p.id = community_post_comments.post_id
        and cm.user_id = auth.uid()
    )
  );

create policy "Authors update comments"
  on public.community_post_comments for update
  using (auth.uid() = author_id);

create policy "Authors delete comments"
  on public.community_post_comments for delete
  using (auth.uid() = author_id);
