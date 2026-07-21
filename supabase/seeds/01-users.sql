-- BELONG demo seed: users, profiles, skills, momentum, organizations
-- Idempotent — safe to re-run on db:reset. Demo accounts use @demo.belong.app
-- Password for all demo users: BelongDemo2026!

create extension if not exists "pgcrypto";

-- ─── Auth + public users ───────────────────────────────────────────────────

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'sarah@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Chen","avatar_url":"https://i.pravatar.cc/256?img=5"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'marcus@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Rivera","avatar_url":"https://i.pravatar.cc/256?img=12"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'priya@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Patel","avatar_url":"https://i.pravatar.cc/256?img=9"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'james@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Okonkwo","avatar_url":"https://i.pravatar.cc/256?img=15"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'elena@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Vasquez","avatar_url":"https://i.pravatar.cc/256?img=20"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'david@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Kim","avatar_url":"https://i.pravatar.cc/256?img=33"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'amara@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amara Okafor","avatar_url":"https://i.pravatar.cc/256?img=44"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'tyler@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tyler Brooks","avatar_url":"https://i.pravatar.cc/256?img=52"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000009', 'authenticated', 'authenticated', 'nina@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nina Hoffmann","avatar_url":"https://i.pravatar.cc/256?img=47"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'jordan@demo.belong.app', crypt('BelongDemo2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Lee","avatar_url":"https://i.pravatar.cc/256?img=60"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  format('{"sub":"%s","email":"%s","email_verified":true}', u.id, u.email)::jsonb,
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email like '%@demo.belong.app'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

update public.users u set
  full_name = v.full_name,
  avatar_url = v.avatar_url,
  location = v.location,
  bio = v.bio,
  role = v.role,
  build_goal = v.build_goal::public.build_goal,
  build_vision = v.build_vision,
  onboarding_completed = true,
  founder_reputation = v.reputation,
  community_contribution_points = v.contribution
from (values
  ('d1000000-0000-4000-8000-000000000001'::uuid, 'Sarah Chen', 'https://i.pravatar.cc/256?img=5', 'San Francisco, CA', 'Building tools for mission-driven founders. Previously PM at a Series B startup.', 'Founder', 'startup', 'Help 10,000 builders find their people and ship meaningful work.', 420, 180),
  ('d1000000-0000-4000-8000-000000000002'::uuid, 'Marcus Rivera', 'https://i.pravatar.cc/256?img=12', 'Austin, TX', 'Climate tech founder and community organizer. Passionate about collective action.', 'Founder', 'community', 'Make climate action accessible to every neighborhood.', 380, 220),
  ('d1000000-0000-4000-8000-000000000003'::uuid, 'Priya Patel', 'https://i.pravatar.cc/256?img=9', 'Brooklyn, NY', 'Product designer helping teams ship faster with better systems.', 'Designer', 'creator', 'Democratize great design for early-stage teams.', 310, 150),
  ('d1000000-0000-4000-8000-000000000004'::uuid, 'James Okonkwo', 'https://i.pravatar.cc/256?img=15', 'London, UK', 'Civic technologist focused on local impact and open data.', 'Engineer', 'community', 'Empower citizens with transparent, usable public data.', 290, 190),
  ('d1000000-0000-4000-8000-000000000005'::uuid, 'Elena Vasquez', 'https://i.pravatar.cc/256?img=20', 'Mexico City, MX', 'Health tech builder and mentor for first-time founders.', 'Mentor', 'health', 'Improve preventive care through community-driven health tools.', 260, 140),
  ('d1000000-0000-4000-8000-000000000006'::uuid, 'David Kim', 'https://i.pravatar.cc/256?img=33', 'Seattle, WA', 'Ex-FAANG engineer going indie. Building in public.', 'Engineer', 'career', 'Leave big tech and build products I believe in.', 340, 95),
  ('d1000000-0000-4000-8000-000000000007'::uuid, 'Amara Okafor', 'https://i.pravatar.cc/256?img=44', 'Lagos, NG', 'Community builder connecting African founders with global mentors.', 'Community Lead', 'community', 'Bridge African builders to resources, capital, and peers.', 275, 210),
  ('d1000000-0000-4000-8000-000000000008'::uuid, 'Tyler Brooks', 'https://i.pravatar.cc/256?img=52', 'Denver, CO', 'Indie hacker and newsletter writer. Shipping small bets weekly.', 'Creator', 'creator', 'Earn a living writing and building niche tools.', 195, 85),
  ('d1000000-0000-4000-8000-000000000009'::uuid, 'Nina Hoffmann', 'https://i.pravatar.cc/256?img=47', 'Berlin, DE', 'Educator building open-source curricula for self-taught developers.', 'Educator', 'learn', 'Make high-quality tech education free and community-powered.', 220, 130),
  ('d1000000-0000-4000-8000-00000000000a'::uuid, 'Jordan Lee', 'https://i.pravatar.cc/256?img=60', 'Toronto, CA', 'Full-stack founder. Two exits. Now building the next generation of creator tools.', 'Founder', 'startup', 'Give creators ownership of their audience and revenue.', 450, 165)
) as v(id, full_name, avatar_url, location, bio, role, build_goal, build_vision, reputation, contribution)
where u.id = v.id;

insert into public.identity_profiles (user_id, strengths, interests, values)
values
  ('d1000000-0000-4000-8000-000000000001', array['Product strategy', 'Community building', 'Fundraising'], array['Startups', 'Mission-driven work', 'Writing'], array['Integrity', 'Impact', 'Curiosity']),
  ('d1000000-0000-4000-8000-000000000002', array['Organizing', 'Public speaking', 'Policy'], array['Climate', 'Local government', 'Events'], array['Justice', 'Persistence', 'Collaboration']),
  ('d1000000-0000-4000-8000-000000000003', array['UI design', 'Design systems', 'User research'], array['Figma', 'Typography', 'Indie SaaS'], array['Craft', 'Clarity', 'Empathy']),
  ('d1000000-0000-4000-8000-000000000004', array['Data engineering', 'Open source', 'GIS'], array['Civic tech', 'Maps', 'Policy'], array['Transparency', 'Service', 'Pragmatism']),
  ('d1000000-0000-4000-8000-000000000005', array['Coaching', 'Healthcare UX', 'Research'], array['Wellness', 'Mentorship', 'Biotech'], array['Care', 'Growth', 'Balance']),
  ('d1000000-0000-4000-8000-000000000006', array['Backend systems', 'DevOps', 'Performance'], array['Rust', 'Distributed systems', 'Indie hacking'], array['Excellence', 'Autonomy', 'Learning']),
  ('d1000000-0000-4000-8000-000000000007', array['Facilitation', 'Partnerships', 'Storytelling'], array['Africa tech', 'Diaspora', 'Angel investing'], array['Belonging', 'Generosity', 'Ambition']),
  ('d1000000-0000-4000-8000-000000000008', array['Writing', 'Marketing', 'Automation'], array['Newsletters', 'No-code', 'SEO'], array['Freedom', 'Consistency', 'Experimentation']),
  ('d1000000-0000-4000-8000-000000000009', array['Curriculum design', 'Teaching', 'Documentation'], array['Open source', 'EdTech', 'Languages'], array['Access', 'Patience', 'Rigor']),
  ('d1000000-0000-4000-8000-00000000000a', array['Full-stack', 'Growth', 'Leadership'], array['Creator economy', 'Payments', 'AI tools'], array['Ownership', 'Speed', 'Trust'])
on conflict (user_id) do update set
  strengths = excluded.strengths,
  interests = excluded.interests,
  values = excluded.values;

insert into public.user_skills (user_id, skill)
select u.id, s.skill
from public.users u
cross join lateral (values
  ('d1000000-0000-4000-8000-000000000001'::uuid, 'Product Management'), ('d1000000-0000-4000-8000-000000000001', 'Go-to-market'),
  ('d1000000-0000-4000-8000-000000000002', 'Community Organizing'), ('d1000000-0000-4000-8000-000000000002', 'Climate Policy'),
  ('d1000000-0000-4000-8000-000000000003', 'Figma'), ('d1000000-0000-4000-8000-000000000003', 'Design Systems'),
  ('d1000000-0000-4000-8000-000000000004', 'Python'), ('d1000000-0000-4000-8000-000000000004', 'Open Data'),
  ('d1000000-0000-4000-8000-000000000005', 'Health UX'), ('d1000000-0000-4000-8000-000000000005', 'Mentoring'),
  ('d1000000-0000-4000-8000-000000000006', 'TypeScript'), ('d1000000-0000-4000-8000-000000000006', 'PostgreSQL'),
  ('d1000000-0000-4000-8000-000000000007', 'Partnerships'), ('d1000000-0000-4000-8000-000000000007', 'Events'),
  ('d1000000-0000-4000-8000-000000000008', 'Copywriting'), ('d1000000-0000-4000-8000-000000000008', 'Newsletters'),
  ('d1000000-0000-4000-8000-000000000009', 'Teaching'), ('d1000000-0000-4000-8000-000000000009', 'Technical Writing'),
  ('d1000000-0000-4000-8000-00000000000a', 'React'), ('d1000000-0000-4000-8000-00000000000a', 'Stripe')
) as s(user_id, skill)
where u.id = s.user_id
on conflict (user_id, skill) do nothing;

insert into public.user_momentum (user_id, current_streak, longest_streak, last_active_date, weekly_completions, week_start)
select u.id, m.streak, m.longest, current_date, m.weekly, date_trunc('week', current_date)::date
from public.users u
join (values
  ('d1000000-0000-4000-8000-000000000001'::uuid, 12, 28, 4),
  ('d1000000-0000-4000-8000-000000000002', 8, 15, 3),
  ('d1000000-0000-4000-8000-000000000003', 5, 10, 2),
  ('d1000000-0000-4000-8000-000000000004', 3, 7, 1),
  ('d1000000-0000-4000-8000-000000000005', 6, 12, 2),
  ('d1000000-0000-4000-8000-000000000006', 4, 9, 2),
  ('d1000000-0000-4000-8000-000000000007', 7, 14, 3),
  ('d1000000-0000-4000-8000-000000000008', 2, 5, 1),
  ('d1000000-0000-4000-8000-000000000009', 9, 18, 3),
  ('d1000000-0000-4000-8000-00000000000a', 11, 22, 4)
) as m(id, streak, longest, weekly) on m.id = u.id
on conflict (user_id) do update set
  current_streak = excluded.current_streak,
  longest_streak = excluded.longest_streak,
  last_active_date = excluded.last_active_date,
  weekly_completions = excluded.weekly_completions,
  week_start = excluded.week_start;

-- ─── Organizations (required FK for communities, projects, missions) ───────

insert into public.organizations (id, name, slug, description, owner_id, impact_score, reputation_level)
values
  ('d2000000-0000-4000-8000-000000000001', 'Belong Labs', 'belong-labs', 'Mission-driven product studio building the future of community-led work.', 'd1000000-0000-4000-8000-000000000001', 840, 'Established'),
  ('d2000000-0000-4000-8000-000000000002', 'Civic Builders Co-op', 'civic-builders', 'A cooperative of technologists improving cities through open civic tools.', 'd1000000-0000-4000-8000-000000000004', 620, 'Growing'),
  ('d2000000-0000-4000-8000-000000000003', 'Open Makers Guild', 'open-makers', 'Creators, educators, and indie hackers sharing resources and revenue.', 'd1000000-0000-4000-8000-00000000000a', 710, 'Established')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  impact_score = excluded.impact_score;

insert into public.organization_members (organization_id, user_id, role)
values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'owner'),
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', 'admin'),
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'member'),
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'member'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000004', 'owner'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000003', 'admin'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005', 'member'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000007', 'member'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-00000000000a', 'owner'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009', 'admin'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000008', 'member'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'member')
on conflict (organization_id, user_id) do nothing;

-- Accepted connections for community People tab
insert into public.connections (requester_id, recipient_id, status)
values
  ('d1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', 'accepted'),
  ('d1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'accepted'),
  ('d1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000004', 'accepted'),
  ('d1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000007', 'accepted'),
  ('d1000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-00000000000a', 'accepted'),
  ('d1000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000005', 'accepted'),
  ('d1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005', 'pending')
on conflict (requester_id, recipient_id) do nothing;
