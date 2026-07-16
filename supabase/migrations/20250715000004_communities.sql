-- BELONG: communities
-- Migration: 20250715000004_communities

create type public.community_member_role as enum ('member', 'admin', 'owner');

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  tag text,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.community_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index communities_owner_idx on public.communities(owner_id);
create index community_members_user_idx on public.community_members(user_id);
create index community_members_community_idx on public.community_members(community_id);

create trigger communities_updated_at
  before update on public.communities
  for each row execute function public.handle_updated_at();

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy "Anyone can view communities"
  on public.communities for select using (true);

create policy "Authenticated users create communities"
  on public.communities for insert
  with check (auth.uid() = owner_id);

create policy "Owners update communities"
  on public.communities for update
  using (auth.uid() = owner_id);

create policy "Owners delete communities"
  on public.communities for delete
  using (auth.uid() = owner_id);

create policy "Anyone can view community members"
  on public.community_members for select using (true);

create policy "Users join communities"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "Users leave or admins manage members"
  on public.community_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = community_members.community_id
        and cm.user_id = auth.uid()
        and cm.role in ('admin', 'owner')
    )
  );
