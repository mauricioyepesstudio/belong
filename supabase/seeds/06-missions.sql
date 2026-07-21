-- BELONG demo seed: life missions, quarterly/weekly/daily missions
-- Requires: supabase/seeds/01-users.sql (organizations)

insert into public.missions (id, user_id, title, description, vision, is_primary, state, organization_id, category, activated_at)
values
  ('d7000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'Build BELONG into the home for mission-driven work', 'Create the platform where builders find community, ship projects, and grow impact.', 'Help 10,000 builders find their people and ship meaningful work.', true, 'active', 'd2000000-0000-4000-8000-000000000001', 'Product', now() - interval '180 days'),
  ('d7000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'Scale neighborhood climate action', 'Equip every community with tools to measure and reduce their carbon footprint.', 'Make climate action accessible to every neighborhood.', true, 'active', 'd2000000-0000-4000-8000-000000000001', 'Climate', now() - interval '120 days'),
  ('d7000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'Democratize design systems', 'Help early teams ship polished UI without a dedicated design org.', 'Great design should not be a Series B luxury.', true, 'active', 'd2000000-0000-4000-8000-000000000002', 'Design', now() - interval '90 days'),
  ('d7000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', 'Open civic data for everyone', 'Build tools that make public data understandable and actionable.', 'Empower citizens with transparent, usable public data.', true, 'active', 'd2000000-0000-4000-8000-000000000002', 'Civic', now() - interval '200 days'),
  ('d7000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000005', 'Improve preventive health access', 'Connect communities with better preventive care tools and education.', 'Health should be proactive, not reactive.', true, 'active', 'd2000000-0000-4000-8000-000000000002', 'Health', now() - interval '60 days'),
  ('d7000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000006', 'Go indie and stay profitable', 'Leave big tech and build sustainable indie products.', 'Earn a living building tools I believe in.', true, 'active', 'd2000000-0000-4000-8000-000000000001', 'Career', now() - interval '45 days'),
  ('d7000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000007', 'Bridge African founders globally', 'Connect builders across Africa with mentors, peers, and capital.', 'No founder builds alone.', true, 'active', 'd2000000-0000-4000-8000-000000000002', 'Community', now() - interval '150 days'),
  ('d7000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000008', 'Earn from writing and small bets', 'Grow newsletter + digital products to full-time income.', 'Creative work should pay the bills.', true, 'active', 'd2000000-0000-4000-8000-000000000003', 'Creator', now() - interval '30 days'),
  ('d7000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000009', 'Free world-class tech education', 'Publish open curricula that rival bootcamps.', 'Learning should be free and community-powered.', true, 'active', 'd2000000-0000-4000-8000-000000000003', 'Education', now() - interval '100 days'),
  ('d7000000-0000-4000-8000-00000000000a', 'd1000000-0000-4000-8000-00000000000a', 'Creator ownership economy', 'Give creators direct relationships with their audience and revenue.', 'Creators should own their audience.', true, 'active', 'd2000000-0000-4000-8000-000000000003', 'Creator', now() - interval '250 days'),
  -- Org-scoped team missions
  ('d7000000-0000-4000-8000-000000000011', 'd1000000-0000-4000-8000-000000000001', 'Launch BELONG public beta', 'Ship production-ready beta with populated demo data and polished UX.', 'Prove BELONG works for real communities.', false, 'active', 'd2000000-0000-4000-8000-000000000001', 'Product', now() - interval '14 days'),
  ('d7000000-0000-4000-8000-000000000012', 'd1000000-0000-4000-8000-000000000004', 'Deploy budget dashboard to 5 cities', 'Roll out civic budget visualization to partner municipalities.', 'Transparency builds trust.', false, 'active', 'd2000000-0000-4000-8000-000000000002', 'Civic', now() - interval '21 days'),
  ('d7000000-0000-4000-8000-000000000013', 'd1000000-0000-4000-8000-00000000000a', 'Creator payouts GA', 'General availability for tips, subscriptions, and marketplace.', 'Creators get paid on day one.', false, 'active', 'd2000000-0000-4000-8000-000000000003', 'Product', now() - interval '7 days')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  state = excluded.state;

insert into public.mission_milestones (mission_id, title, description, target_date, sort_order)
select v.mission_id, v.title, v.description, v.target_date, v.sort_order
from (values
  ('d7000000-0000-4000-8000-000000000001'::uuid, 'Complete beta polish sprint', 'UI consistency, loading states, and demo data', (current_date + interval '30 days')::date, 1),
  ('d7000000-0000-4000-8000-000000000001', 'Onboard 100 beta users', 'Invite-first cohort from founder communities', (current_date + interval '60 days')::date, 2),
  ('d7000000-0000-4000-8000-000000000011', 'Production deployment', 'Deploy to production with monitoring', (current_date + interval '14 days')::date, 1),
  ('d7000000-0000-4000-8000-000000000012', 'London pilot launch', 'First city live with real budget data', (current_date + interval '45 days')::date, 1)
) as v(mission_id, title, description, target_date, sort_order)
where not exists (
  select 1 from public.mission_milestones m
  where m.mission_id = v.mission_id and m.title = v.title
);

insert into public.quarterly_goals (id, user_id, mission_id, title, description, progress_percent, due_date, status)
values
  ('d7100000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'Q3: Ship beta-ready platform', 'Polish, demo data, and external beta cohort', 65, (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date, 'active'),
  ('d7100000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000002', 'Q3: Expand climate pilot', 'Three neighborhoods to ten', 40, (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date, 'active'),
  ('d7100000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-00000000000a', 'd7000000-0000-4000-8000-00000000000a', 'Q3: Creator monetization', 'Tips, subscriptions, marketplace live', 55, (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date, 'active')
on conflict (id) do update set progress_percent = excluded.progress_percent;

insert into public.weekly_goals (id, user_id, mission_id, quarterly_goal_id, title, target_count, current_count, week_start, week_end, status)
values
  ('d7200000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'd7100000-0000-4000-8000-000000000001', 'Ship 5 beta polish commits', 5, 3, date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, 'active'),
  ('d7200000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000002', 'd7100000-0000-4000-8000-000000000002', 'Run 10 user interviews', 10, 4, date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, 'active'),
  ('d7200000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'd7000000-0000-4000-8000-000000000003', null, 'Publish design token v1', 1, 1, date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, 'completed'),
  ('d7200000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-00000000000a', 'd7000000-0000-4000-8000-00000000000a', 'd7100000-0000-4000-8000-000000000003', 'Onboard 3 creators to payouts', 3, 2, date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, 'active')
on conflict (id) do update set current_count = excluded.current_count;

insert into public.daily_missions (id, user_id, mission_id, weekly_goal_id, title, description, action_href, impact_points, status, mission_date)
values
  ('d7300000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'd7200000-0000-4000-8000-000000000001', 'Review beta feedback inbox', 'Respond to 3 pieces of beta user feedback', '/messages', 15, 'pending', current_date),
  ('d7300000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001', 'd7200000-0000-4000-8000-000000000001', 'Share a community post', 'Publish an update in Indie Founders Circle', '/community/indie-founders', 10, 'completed', current_date - 1),
  ('d7300000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002', 'd7000000-0000-4000-8000-000000000002', 'd7200000-0000-4000-8000-000000000002', 'Schedule 2 pilot interviews', 'Reach out to neighborhood leads', '/community/climate-action', 15, 'pending', current_date),
  ('d7300000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 'd7000000-0000-4000-8000-000000000003', 'd7200000-0000-4000-8000-000000000003', 'Review token contrast audit', 'Check dark mode accessibility report', '/projects', 10, 'completed', current_date),
  ('d7300000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004', 'd7000000-0000-4000-8000-000000000004', null, 'Parse London Q2 budget CSV', 'Validate import pipeline on new data', '/projects', 20, 'pending', current_date),
  ('d7300000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000006', 'd7000000-0000-4000-8000-000000000006', null, 'Ship one indie feature', 'Pick the smallest user-requested improvement', '/dashboard', 15, 'pending', current_date),
  ('d7300000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000008', 'd7000000-0000-4000-8000-000000000008', null, 'Write today''s newsletter draft', '500 words on creator monetization lessons', '/dashboard', 10, 'pending', current_date),
  ('d7300000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-00000000000a', 'd7000000-0000-4000-8000-00000000000a', 'd7200000-0000-4000-8000-000000000004', 'Test Stripe Connect onboarding', 'Walk through creator payout setup', '/creator', 20, 'completed', current_date - 1),
  ('d7300000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000009', 'd7000000-0000-4000-8000-000000000009', null, 'Publish one curriculum module', 'Release week 4 exercises', '/projects', 15, 'pending', current_date),
  ('d7300000-0000-4000-8000-00000000000a', 'd1000000-0000-4000-8000-000000000007', 'd7000000-0000-4000-8000-000000000007', null, 'Connect with 2 new founders', 'Send thoughtful intro messages', '/community?tab=people', 10, 'pending', current_date)
on conflict (id) do update set status = excluded.status;

update public.daily_missions
set completed_at = coalesce(completed_at, now())
where status = 'completed' and completed_at is null
  and id in (
    'd7300000-0000-4000-8000-000000000002',
    'd7300000-0000-4000-8000-000000000004',
    'd7300000-0000-4000-8000-000000000008'
  );

-- Link projects to life missions where relevant
update public.projects set mission_id = 'd7000000-0000-4000-8000-000000000001' where id = 'd4000000-0000-4000-8000-000000000001';
update public.projects set mission_id = 'd7000000-0000-4000-8000-000000000002' where id = 'd4000000-0000-4000-8000-000000000002';
update public.projects set mission_id = 'd7000000-0000-4000-8000-000000000003' where id = 'd4000000-0000-4000-8000-000000000004';
update public.projects set mission_id = 'd7000000-0000-4000-8000-000000000004' where id = 'd4000000-0000-4000-8000-000000000005';
update public.projects set mission_id = 'd7000000-0000-4000-8000-00000000000a' where id = 'd4000000-0000-4000-8000-000000000008';

insert into public.impact_snapshots (user_id, score, recorded_date)
select u.id, s.score, current_date
from public.users u
join (values
  ('d1000000-0000-4000-8000-000000000001'::uuid, 420),
  ('d1000000-0000-4000-8000-000000000002', 380),
  ('d1000000-0000-4000-8000-000000000003', 310),
  ('d1000000-0000-4000-8000-000000000004', 290),
  ('d1000000-0000-4000-8000-00000000000a', 450)
) as s(id, score) on s.id = u.id
on conflict (user_id, recorded_date) do update set score = excluded.score;
