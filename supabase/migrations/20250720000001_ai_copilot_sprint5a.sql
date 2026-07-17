-- Sprint 5A: BELONG AI Copilot — auditable AI action ledger

create type public.ai_copilot_context_type as enum ('community', 'organization', 'project');

create type public.ai_copilot_action_type as enum (
  'summarize_discussions',
  'generate_tasks',
  'generate_milestones',
  'suggest_missions',
  'answer_question',
  'create_announcement',
  'weekly_summary'
);

create type public.ai_copilot_action_status as enum ('completed', 'failed', 'applied');

create table public.ai_copilot_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  context_type public.ai_copilot_context_type not null,
  context_id uuid not null,
  action_type public.ai_copilot_action_type not null,
  status public.ai_copilot_action_status not null default 'completed',
  prompt text,
  input_summary jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  model text,
  tokens_used int,
  error_message text,
  applied boolean not null default false,
  applied_entity_type text,
  applied_entity_id uuid,
  created_at timestamptz not null default now()
);

create index ai_copilot_actions_user_idx
  on public.ai_copilot_actions (user_id, created_at desc);

create index ai_copilot_actions_context_idx
  on public.ai_copilot_actions (context_type, context_id, created_at desc);

alter table public.ai_copilot_actions enable row level security;

create policy "Users read own ai copilot actions"
  on public.ai_copilot_actions for select
  using (auth.uid() = user_id);

create policy "Users insert own ai copilot actions"
  on public.ai_copilot_actions for insert
  with check (auth.uid() = user_id);

create policy "Users update own ai copilot actions"
  on public.ai_copilot_actions for update
  using (auth.uid() = user_id);

alter type public.impact_event_type add value if not exists 'ai_copilot_applied';
