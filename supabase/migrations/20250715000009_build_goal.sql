-- BELONG: onboarding build goal
-- Migration: 20250715000009_build_goal

create type public.build_goal as enum (
  'startup',
  'career',
  'learn',
  'health',
  'relationships',
  'community',
  'travel',
  'creator'
);

alter table public.users
  add column build_goal public.build_goal,
  add column build_vision text;

create index users_build_goal_idx on public.users(build_goal);
