-- BELONG demo seed: projects and team memberships
-- Requires: supabase/seeds/02-communities.sql

insert into public.projects (id, name, description, status, progress, deadline, owner_id, community_id, organization_id)
values
  ('d4000000-0000-4000-8000-000000000001', 'BELONG Mobile App', 'Native-feel mobile experience for community feeds, missions, and messaging.', 'active', 45, (current_date + interval '90 days')::date, 'd1000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001'),
  ('d4000000-0000-4000-8000-000000000002', 'Carbon Tracker MVP', 'Neighborhood-level carbon footprint tracking with actionable weekly goals.', 'active', 62, (current_date + interval '60 days')::date, 'd1000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001'),
  ('d4000000-0000-4000-8000-000000000003', 'Founder OS Toolkit', 'Notion-style templates and workflows for early-stage founders.', 'planning', 18, (current_date + interval '120 days')::date, 'd1000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001'),
  ('d4000000-0000-4000-8000-000000000004', 'Design Token Library', 'Open-source design tokens and React components for product teams.', 'active', 78, (current_date + interval '45 days')::date, 'd1000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000002'),
  ('d4000000-0000-4000-8000-000000000005', 'City Budget Dashboard', 'Visualize municipal budgets with citizen-friendly charts and comparisons.', 'active', 38, (current_date + interval '75 days')::date, 'd1000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002'),
  ('d4000000-0000-4000-8000-000000000006', 'Neighborhood Watch App', 'Hyperlocal safety alerts and community check-ins.', 'planning', 12, (current_date + interval '150 days')::date, 'd1000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000004', 'd2000000-0000-4000-8000-000000000002'),
  ('d4000000-0000-4000-8000-000000000007', 'LLM Fine-tuning Kit', 'Starter kit for fine-tuning open models on domain-specific datasets.', 'active', 55, (current_date + interval '50 days')::date, 'd1000000-0000-4000-8000-00000000000a', 'd3000000-0000-4000-8000-000000000005', 'd2000000-0000-4000-8000-000000000003'),
  ('d4000000-0000-4000-8000-000000000008', 'Creator Payouts SDK', 'Drop-in SDK for creator tips, subscriptions, and marketplace payouts.', 'active', 71, (current_date + interval '30 days')::date, 'd1000000-0000-4000-8000-00000000000a', 'd3000000-0000-4000-8000-000000000006', 'd2000000-0000-4000-8000-000000000003'),
  ('d4000000-0000-4000-8000-000000000009', 'Community Analytics Hub', 'Cross-community insights dashboard for org admins and community leads.', 'completed', 100, (current_date - interval '14 days')::date, 'd1000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  progress = excluded.progress;

insert into public.project_members (project_id, user_id, role)
values
  ('d4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'owner'),
  ('d4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'member'),
  ('d4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'member'),
  ('d4000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'owner'),
  ('d4000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005', 'member'),
  ('d4000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000001', 'owner'),
  ('d4000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002', 'member'),
  ('d4000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 'owner'),
  ('d4000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000009', 'member'),
  ('d4000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004', 'owner'),
  ('d4000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000007', 'member'),
  ('d4000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000004', 'owner'),
  ('d4000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-00000000000a', 'owner'),
  ('d4000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000006', 'member'),
  ('d4000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-00000000000a', 'owner'),
  ('d4000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000003', 'member'),
  ('d4000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000008', 'member'),
  ('d4000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000001', 'owner'),
  ('d4000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000006', 'member')
on conflict (project_id, user_id) do nothing;

-- Workspace tasks and goals so project detail feels active
insert into public.project_tasks (project_id, creator_id, title, status, priority)
select v.project_id, v.creator_id, v.title, v.status::public.project_task_status, v.priority
from (values
  ('d4000000-0000-4000-8000-000000000001'::uuid, 'd1000000-0000-4000-8000-000000000001'::uuid, 'Design onboarding flow', 'in_progress', 'high'),
  ('d4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'Set up push notifications', 'todo', 'medium'),
  ('d4000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 'Publish v1 token package', 'review', 'high'),
  ('d4000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004', 'Import city budget CSV schema', 'in_progress', 'high'),
  ('d4000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-00000000000a', 'Write fine-tuning guide', 'done', 'medium')
) as v(project_id, creator_id, title, status, priority)
where not exists (
  select 1 from public.project_tasks t
  where t.project_id = v.project_id and t.title = v.title
);

insert into public.project_goals (project_id, creator_id, title, goal_type, progress_percent)
select v.project_id, v.creator_id, v.title, v.goal_type::public.project_goal_type, v.progress
from (values
  ('d4000000-0000-4000-8000-000000000001'::uuid, 'd1000000-0000-4000-8000-000000000001'::uuid, 'Ship beta to 50 testers', 'quarterly', 40),
  ('d4000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'Launch pilot in 3 neighborhoods', 'quarterly', 55),
  ('d4000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', '100 GitHub stars', 'weekly', 72)
) as v(project_id, creator_id, title, goal_type, progress)
where not exists (
  select 1 from public.project_goals g
  where g.project_id = v.project_id and g.title = v.title
);
