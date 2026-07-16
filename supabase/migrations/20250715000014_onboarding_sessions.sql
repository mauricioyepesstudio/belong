-- BELONG: Onboarding sessions (draft + resume)
-- Migration: 20250715000014_onboarding_sessions

create type public.onboarding_session_status as enum ('in_progress', 'completed', 'abandoned');

create table public.onboarding_sessions (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_step text not null default 'purpose',
  draft jsonb not null default '{}',
  status public.onboarding_session_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger onboarding_sessions_updated_at
  before update on public.onboarding_sessions
  for each row execute function public.handle_updated_at();

create index onboarding_sessions_status_idx on public.onboarding_sessions(status);

alter table public.onboarding_sessions enable row level security;

create policy "Users manage own onboarding session"
  on public.onboarding_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
