-- BELONG Engine: missions, momentum, impact history, graph skills, contributions
-- Migration: 20250715000012_belong_engine

create type public.daily_mission_status as enum ('pending', 'completed', 'skipped');
create type public.weekly_goal_status as enum ('active', 'completed', 'expired');

-- Momentum & streaks
create table public.user_momentum (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  weekly_completions integer not null default 0 check (weekly_completions >= 0),
  week_start date,
  updated_at timestamptz not null default now()
);

create trigger user_momentum_updated_at
  before update on public.user_momentum
  for each row execute function public.handle_updated_at();

-- Daily missions (purpose-driven tasks)
create table public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  action_href text not null default '/dashboard',
  impact_points integer not null default 10 check (impact_points > 0),
  status public.daily_mission_status not null default 'pending',
  mission_date date not null default (timezone('utc', now()))::date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index daily_missions_user_date_idx on public.daily_missions(user_id, mission_date desc);
create unique index daily_missions_user_date_title_idx on public.daily_missions(user_id, mission_date, title);

-- Weekly goals
create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  target_count integer not null default 1 check (target_count > 0),
  current_count integer not null default 0 check (current_count >= 0),
  action_href text not null default '/dashboard',
  impact_points integer not null default 25 check (impact_points > 0),
  status public.weekly_goal_status not null default 'active',
  week_start date not null,
  week_end date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index weekly_goals_user_week_idx on public.weekly_goals(user_id, week_start desc);

-- Impact history for ripple visualization
create table public.impact_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null check (score >= 0),
  recorded_date date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  unique (user_id, recorded_date)
);

create index impact_snapshots_user_idx on public.impact_snapshots(user_id, recorded_date desc);

-- Skills for BELONG Graph
create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill text not null,
  created_at timestamptz not null default now(),
  unique (user_id, skill)
);

create index user_skills_user_idx on public.user_skills(user_id);

-- Community contribution log
create table public.community_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  contribution_type text not null,
  points integer not null default 5 check (points > 0),
  created_at timestamptz not null default now()
);

create index community_contributions_user_idx on public.community_contributions(user_id, created_at desc);

-- Reputation fields
alter table public.users
  add column if not exists founder_reputation integer not null default 0 check (founder_reputation >= 0),
  add column if not exists community_contribution_points integer not null default 0 check (community_contribution_points >= 0);

-- RLS
alter table public.user_momentum enable row level security;
alter table public.daily_missions enable row level security;
alter table public.weekly_goals enable row level security;
alter table public.impact_snapshots enable row level security;
alter table public.user_skills enable row level security;
alter table public.community_contributions enable row level security;

create policy "Users manage own momentum"
  on public.user_momentum for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own daily missions"
  on public.daily_missions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own weekly goals"
  on public.weekly_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view own impact snapshots"
  on public.impact_snapshots for select
  using (auth.uid() = user_id);

create policy "Users insert own impact snapshots"
  on public.impact_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users manage own skills"
  on public.user_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view community contributions"
  on public.community_contributions for select
  using (true);

create policy "Users log own contributions"
  on public.community_contributions for insert
  with check (auth.uid() = user_id);

-- Streak + momentum update
create or replace function public.record_user_activity(p_user_id uuid)
returns public.user_momentum
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_week_start date := date_trunc('week', v_today::timestamp)::date;
  v_row public.user_momentum;
begin
  insert into public.user_momentum (user_id, last_active_date, week_start, current_streak, longest_streak)
  values (p_user_id, v_today, v_week_start, 1, 1)
  on conflict (user_id) do nothing;

  select * into v_row from public.user_momentum where user_id = p_user_id for update;

  if v_row.week_start is distinct from v_week_start then
    v_row.week_start := v_week_start;
    v_row.weekly_completions := 0;
  end if;

  if v_row.last_active_date is null then
    v_row.current_streak := 1;
  elsif v_row.last_active_date = v_today then
    null;
  elsif v_row.last_active_date = v_today - 1 then
    v_row.current_streak := v_row.current_streak + 1;
  else
    v_row.current_streak := 1;
  end if;

  v_row.longest_streak := greatest(v_row.longest_streak, v_row.current_streak);
  v_row.last_active_date := v_today;
  v_row.updated_at := now();

  update public.user_momentum set
    current_streak = v_row.current_streak,
    longest_streak = v_row.longest_streak,
    last_active_date = v_row.last_active_date,
    week_start = v_row.week_start,
    weekly_completions = v_row.weekly_completions,
    updated_at = v_row.updated_at
  where user_id = p_user_id;

  return v_row;
end;
$$;
