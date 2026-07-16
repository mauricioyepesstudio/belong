-- BELONG: Identity Engine profile extensions
-- Migration: 20250715000015_identity_profiles

create table public.identity_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  strengths text[] not null default '{}',
  interests text[] not null default '{}',
  values text[] not null default '{}',
  personality jsonb not null default '{"traits":[]}',
  experience jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger identity_profiles_updated_at
  before update on public.identity_profiles
  for each row execute function public.handle_updated_at();

alter table public.identity_profiles enable row level security;

create policy "Anyone can view identity profiles"
  on public.identity_profiles for select
  using (true);

create policy "Users manage own identity profile"
  on public.identity_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
