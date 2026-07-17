-- Sprint 2C: Mission Engine hierarchy — quarterly goals + FK linkage
-- Migration: 20250717000004_mission_engine_hierarchy

create type public.quarterly_goal_status as enum ('active', 'completed', 'expired');

create table public.quarterly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  title text not null,
  description text,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  due_date date not null,
  status public.quarterly_goal_status not null default 'active',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quarterly_goals_user_due_idx on public.quarterly_goals(user_id, due_date desc);
create index quarterly_goals_mission_idx on public.quarterly_goals(mission_id);

create trigger quarterly_goals_updated_at
  before update on public.quarterly_goals
  for each row execute function public.handle_updated_at();

alter table public.weekly_goals
  add column if not exists mission_id uuid references public.missions(id) on delete set null,
  add column if not exists quarterly_goal_id uuid references public.quarterly_goals(id) on delete set null;

alter table public.daily_missions
  add column if not exists mission_id uuid references public.missions(id) on delete set null,
  add column if not exists weekly_goal_id uuid references public.weekly_goals(id) on delete set null;

create index if not exists weekly_goals_mission_idx on public.weekly_goals(mission_id);
create index if not exists weekly_goals_quarterly_idx on public.weekly_goals(quarterly_goal_id);
create index if not exists daily_missions_mission_idx on public.daily_missions(mission_id);
create index if not exists daily_missions_weekly_idx on public.daily_missions(weekly_goal_id);

create unique index if not exists missions_one_primary_per_user
  on public.missions(user_id)
  where is_primary = true and state <> 'archived';

alter table public.quarterly_goals enable row level security;

create policy "Users manage own quarterly goals"
  on public.quarterly_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill mission_id on existing weekly/daily rows from primary mission
update public.weekly_goals wg
set mission_id = m.id
from public.missions m
where m.user_id = wg.user_id
  and m.is_primary = true
  and m.state <> 'archived'
  and wg.mission_id is null;

update public.daily_missions dm
set mission_id = m.id
from public.missions m
where m.user_id = dm.user_id
  and m.is_primary = true
  and m.state <> 'archived'
  and dm.mission_id is null;
