-- Sprint 3A: Identity & Reputation Engine — universal impact event ledger

create type public.impact_event_module as enum ('mission', 'community', 'project', 'system');
create type public.impact_event_type as enum (
  'mission_completed',
  'weekly_goal_completed',
  'quarterly_goal_completed',
  'community_join',
  'community_post',
  'community_comment',
  'community_like',
  'project_created',
  'project_join',
  'project_post',
  'project_comment',
  'project_completed',
  'streak_activity',
  'connection_accepted'
);

create table public.impact_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  module public.impact_event_module not null,
  event_type public.impact_event_type not null,
  points integer not null default 0 check (points >= 0),
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index impact_events_user_created_idx on public.impact_events(user_id, created_at desc);
create index impact_events_user_type_idx on public.impact_events(user_id, event_type);
create index impact_events_module_idx on public.impact_events(user_id, module);

alter table public.impact_events enable row level security;

create policy "Users read own impact events"
  on public.impact_events for select
  using (auth.uid() = user_id);

create policy "Users insert own impact events"
  on public.impact_events for insert
  with check (auth.uid() = user_id);

-- Backfill from existing contribution log
insert into public.impact_events (user_id, module, event_type, points, source_id, metadata, created_at)
select
  cc.user_id,
  'community'::public.impact_event_module,
  case cc.contribution_type
    when 'join' then 'community_join'::public.impact_event_type
    when 'post' then 'community_post'::public.impact_event_type
    when 'comment' then 'community_comment'::public.impact_event_type
    when 'like' then 'community_like'::public.impact_event_type
    else 'community_post'::public.impact_event_type
  end,
  cc.points,
  cc.community_id::text,
  jsonb_build_object('community_id', cc.community_id, 'contribution_type', cc.contribution_type),
  cc.created_at
from public.community_contributions cc;

-- Backfill completed missions
insert into public.impact_events (user_id, module, event_type, points, source_id, metadata, created_at)
select
  dm.user_id,
  'mission'::public.impact_event_module,
  'mission_completed'::public.impact_event_type,
  dm.impact_points,
  dm.id::text,
  jsonb_build_object('title', dm.title),
  coalesce(dm.completed_at, dm.created_at)
from public.daily_missions dm
where dm.status = 'completed';
