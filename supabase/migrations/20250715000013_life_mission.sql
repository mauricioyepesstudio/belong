-- BELONG: Life Mission Engine fields
-- Migration: 20250715000013_life_mission

create type public.mission_state as enum (
  'draft',
  'discovering',
  'active',
  'paused',
  'completed',
  'archived'
);

alter table public.missions
  add column if not exists state public.mission_state not null default 'draft',
  add column if not exists vision text,
  add column if not exists category text,
  add column if not exists activated_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Backfill existing primary missions as active
update public.missions
set state = 'active', activated_at = coalesce(activated_at, created_at)
where is_primary = true and state = 'draft';

create index if not exists missions_user_state_idx on public.missions(user_id, state);

create table if not exists public.mission_milestones (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  completed_at timestamptz,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists mission_milestones_mission_idx
  on public.mission_milestones(mission_id, sort_order);

alter table public.mission_milestones enable row level security;

create policy "Anyone can view mission milestones"
  on public.mission_milestones for select
  using (true);

create policy "Users manage milestones on own missions"
  on public.mission_milestones for all
  using (
    exists (
      select 1 from public.missions m
      where m.id = mission_milestones.mission_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.missions m
      where m.id = mission_milestones.mission_id
        and m.user_id = auth.uid()
    )
  );
