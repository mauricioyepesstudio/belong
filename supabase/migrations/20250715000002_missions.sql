-- BELONG: missions
-- Migration: 20250715000002_missions

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index missions_user_id_idx on public.missions(user_id);

create trigger missions_updated_at
  before update on public.missions
  for each row execute function public.handle_updated_at();

alter table public.missions enable row level security;

create policy "Anyone can view missions"
  on public.missions for select
  using (true);

create policy "Users manage own missions"
  on public.missions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
