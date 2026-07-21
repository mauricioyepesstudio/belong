-- BELONG demo seed: community events and registrations
-- Requires: supabase/seeds/02-communities.sql

insert into public.events (id, title, description, location, starts_at, ends_at, community_id, created_by)
values
  ('d5000000-0000-4000-8000-000000000001', 'Founder Coworking Hour', 'Bring your laptop, share blockers, and ship together in a focused virtual session.', 'Online — BELONG Live', (current_date + interval '3 days') + time '17:00', (current_date + interval '3 days') + time '19:00', 'd3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001'),
  ('d5000000-0000-4000-8000-000000000002', 'Climate Tech Demo Night', 'Five teams demo early prototypes and get feedback from builders and mentors.', 'Austin Community Hub', (current_date + interval '10 days') + time '18:30', (current_date + interval '10 days') + time '21:00', 'd3000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002'),
  ('d5000000-0000-4000-8000-000000000003', 'Design Systems Workshop', 'Hands-on session building tokens, components, and documentation for your product.', 'Online — Zoom', (current_date + interval '5 days') + time '14:00', (current_date + interval '5 days') + time '16:00', 'd3000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003'),
  ('d5000000-0000-4000-8000-000000000004', 'Civic Tech Open Data Sprint', 'Weekend hackathon improving public datasets for local governments.', 'London Civic Lab', (current_date + interval '14 days') + time '10:00', (current_date + interval '15 days') + time '18:00', 'd3000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004'),
  ('d5000000-0000-4000-8000-000000000005', 'AI Builders Show & Tell', 'Lightning talks on agents, RAG pipelines, and production LLM workflows.', 'Online — BELONG Live', (current_date + interval '7 days') + time '16:00', (current_date + interval '7 days') + time '17:30', 'd3000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-00000000000a'),
  ('d5000000-0000-4000-8000-000000000006', 'Creator Monetization AMA', 'Ask anything about tips, subscriptions, and marketplace sales on BELONG.', 'Online — BELONG Live', (current_date + interval '2 days') + time '12:00', (current_date + interval '2 days') + time '13:00', 'd3000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000008'),
  ('d5000000-0000-4000-8000-000000000007', 'Indie Founders Breakfast Club', 'Casual morning check-in for founders sharing weekly goals and wins.', 'San Francisco — The Grove', (current_date + interval '6 days') + time '08:30', (current_date + interval '6 days') + time '10:00', 'd3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001'),
  ('d5000000-0000-4000-8000-000000000008', 'Health Tech Mentorship Circle', 'Small-group mentoring for founders building in preventive care.', 'Online — Zoom', (current_date + interval '12 days') + time '15:00', (current_date + interval '12 days') + time '16:30', 'd3000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  starts_at = excluded.starts_at;

insert into public.event_registrations (event_id, user_id)
values
  ('d5000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002'),
  ('d5000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006'),
  ('d5000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008'),
  ('d5000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001'),
  ('d5000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005'),
  ('d5000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000004'),
  ('d5000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009'),
  ('d5000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003'),
  ('d5000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000007'),
  ('d5000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000006'),
  ('d5000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000009'),
  ('d5000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000003'),
  ('d5000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-00000000000a'),
  ('d5000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-00000000000a'),
  ('d5000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000007')
on conflict (event_id, user_id) do nothing;
