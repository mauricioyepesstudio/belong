-- BELONG: Daily mission participants (Sprint 2 — Mission Detail)
-- Migration: 20250715000016_daily_mission_participants

create table public.daily_mission_participants (
  id uuid primary key default gen_random_uuid(),
  daily_mission_id uuid not null references public.daily_missions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (daily_mission_id, user_id)
);

create index daily_mission_participants_mission_idx
  on public.daily_mission_participants(daily_mission_id);

create index daily_mission_participants_user_idx
  on public.daily_mission_participants(user_id);

alter table public.daily_mission_participants enable row level security;

-- Allow authenticated users to view daily missions (join flow + detail page)
drop policy if exists "Users manage own daily missions" on public.daily_missions;

create policy "Authenticated users can view daily missions"
  on public.daily_missions for select
  using (auth.uid() is not null);

create policy "Owners insert daily missions"
  on public.daily_missions for insert
  with check (auth.uid() = user_id);

create policy "Owners update daily missions"
  on public.daily_missions for update
  using (auth.uid() = user_id);

create policy "Owners delete daily missions"
  on public.daily_missions for delete
  using (auth.uid() = user_id);

create policy "Anyone can view mission participants"
  on public.daily_mission_participants for select
  using (auth.uid() is not null);

create policy "Users join missions"
  on public.daily_mission_participants for insert
  with check (auth.uid() = user_id);

create policy "Users leave missions"
  on public.daily_mission_participants for delete
  using (auth.uid() = user_id);
