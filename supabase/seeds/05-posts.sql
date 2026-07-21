-- BELONG demo seed: community posts, project posts, marketplace listings
-- Requires: supabase/seeds/03-projects.sql

-- Community posts (feed content)
insert into public.community_posts (id, community_id, author_id, content, created_at)
values
  ('d6000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'Just shipped our onboarding redesign — would love feedback from other founders before we roll it out to beta users.', now() - interval '2 hours'),
  ('d6000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'Anyone using push notifications for community apps? Comparing OneSignal vs native — curious what worked for you.', now() - interval '5 hours'),
  ('d6000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000008', 'Weekly wins thread 🎉 I hit 500 newsletter subscribers and shipped a landing page rewrite. What did you ship this week?', now() - interval '1 day'),
  ('d6000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'Our carbon tracker pilot is live in three Austin neighborhoods. Looking for volunteers to help with user interviews next week.', now() - interval '3 hours'),
  ('d6000000-0000-4000-8000-000000000005', 'd3000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000005', 'Shared a framework for measuring community climate impact — link in comments. Happy to adapt it for your city.', now() - interval '8 hours'),
  ('d6000000-0000-4000-8000-000000000006', 'd3000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'Published v0.9 of our design token library. Typography and spacing scales are now stable — breaking changes only in color semantics.', now() - interval '6 hours'),
  ('d6000000-0000-4000-8000-000000000007', 'd3000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009', 'Hosting a office hours session on component API design tomorrow — drop questions below.', now() - interval '12 hours'),
  ('d6000000-0000-4000-8000-000000000008', 'd3000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', 'City of London open data portal just released Q2 budget files. Who wants to join a parsing sprint this weekend?', now() - interval '4 hours'),
  ('d6000000-0000-4000-8000-000000000009', 'd3000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000007', 'Excited to connect African civic tech builders with this group — cross-pollination is everything.', now() - interval '1 day'),
  ('d6000000-0000-4000-8000-000000000010', 'd3000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-00000000000a', 'We fine-tuned a 7B model on 2k support tickets — 40% faster resolution in staging. Write-up coming soon.', now() - interval '7 hours'),
  ('d6000000-0000-4000-8000-000000000011', 'd3000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000006', 'Best embedding model for code search in 2026? We are re-indexing a 50k-file monorepo.', now() - interval '2 days'),
  ('d6000000-0000-4000-8000-000000000012', 'd3000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000008', 'Creator tip: bundle a small digital product with your newsletter signup — conversion doubled for me.', now() - interval '9 hours'),
  ('d6000000-0000-4000-8000-000000000013', 'd3000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000003', 'Shared Figma templates for creator landing pages in the marketplace — link in bio.', now() - interval '1 day')
on conflict (id) do update set content = excluded.content;

insert into public.community_post_likes (post_id, user_id)
values
  ('d6000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002'),
  ('d6000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006'),
  ('d6000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000001'),
  ('d6000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000007'),
  ('d6000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000004'),
  ('d6000000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000009')
on conflict (post_id, user_id) do nothing;

insert into public.community_post_comments (post_id, author_id, content)
select v.post_id, v.author_id, v.content
from (values
  ('d6000000-0000-4000-8000-000000000001'::uuid, 'd1000000-0000-4000-8000-000000000002'::uuid, 'Love the progressive disclosure on step 2 — feels much calmer than the old flow.'),
  ('d6000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000008', 'We went native on iOS and OneSignal on Android. Happy to share our setup.'),
  ('d6000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000001', 'Count me in for interviews — also interested in the pilot data model.'),
  ('d6000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000003', 'I can help with the CSV schema mapping — we did something similar for NYC.')
) as v(post_id, author_id, content)
where not exists (
  select 1 from public.community_post_comments c
  where c.post_id = v.post_id and c.author_id = v.author_id and c.content = v.content
);

-- Project posts (belong to projects)
insert into public.project_posts (id, project_id, author_id, content, created_at)
values
  ('d6100000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'Mobile beta checklist is up — targeting TestFlight build by Friday.', now() - interval '4 hours'),
  ('d6100000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006', 'Push notification service integrated. Need QA on Android delivery rates.', now() - interval '1 day'),
  ('d6100000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'Pilot neighborhoods confirmed: East Austin, Mueller, and Crestview.', now() - interval '6 hours'),
  ('d6100000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 'Token package v1 ready for review — please check contrast ratios on dark mode.', now() - interval '3 hours'),
  ('d6100000-0000-4000-8000-000000000005', 'd4000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004', 'Imported London budget CSV — charts rendering correctly. Next: comparison view.', now() - interval '8 hours'),
  ('d6100000-0000-4000-8000-000000000006', 'd4000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000007', 'Added neighborhood boundary layer from open GIS data.', now() - interval '2 days'),
  ('d6100000-0000-4000-8000-000000000007', 'd4000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-00000000000a', 'Fine-tuning notebook published — supports LoRA and QLoRA out of the box.', now() - interval '5 hours'),
  ('d6100000-0000-4000-8000-000000000008', 'd4000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-00000000000a', 'Stripe Connect onboarding flow tested end-to-end. Ready for creator beta.', now() - interval '1 day'),
  ('d6100000-0000-4000-8000-000000000009', 'd4000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000008', 'SDK docs draft complete — looking for feedback on webhook examples.', now() - interval '12 hours'),
  ('d6100000-0000-4000-8000-000000000010', 'd4000000-0000-4000-8000-000000000009', 'd1000000-0000-4000-8000-000000000001', 'Analytics hub v1 shipped 🚀 Thanks everyone for the sprint.', now() - interval '14 days')
on conflict (id) do update set content = excluded.content;

insert into public.project_post_likes (post_id, user_id)
values
  ('d6100000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000006'),
  ('d6100000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000009'),
  ('d6100000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000006'),
  ('d6100000-0000-4000-8000-000000000010', 'd1000000-0000-4000-8000-000000000002')
on conflict (post_id, user_id) do nothing;

insert into public.project_post_comments (post_id, author_id, content)
select v.post_id, v.author_id, v.content
from (values
  ('d6100000-0000-4000-8000-000000000001'::uuid, 'd1000000-0000-4000-8000-000000000008'::uuid, 'Can we add a dark mode screenshot to the TestFlight notes?'),
  ('d6100000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000004', 'Contrast looks good — approved from accessibility pass.'),
  ('d6100000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000003', 'Tested tips flow — works great. Minor copy tweak suggested in Figma.')
) as v(post_id, author_id, content)
where not exists (
  select 1 from public.project_post_comments c
  where c.post_id = v.post_id and c.author_id = v.author_id and c.content = v.content
);

-- Marketplace listings
insert into public.marketplace_listings (id, seller_id, title, description, price_cents, status, image_url)
values
  ('d8000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', 'Design Token Starter Kit', 'Figma + JSON tokens, dark mode included. Ship consistent UI in hours.', 4900, 'active', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'),
  ('d8000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000008', 'Indie Founder Newsletter Playbook', '30-day template for launching and growing a niche newsletter.', 2900, 'active', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'),
  ('d8000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000009', 'Open Source Curriculum Bundle', '12-week self-taught developer syllabus with exercises and rubrics.', 7900, 'active', 'https://images.unsplash.com/photo-1516321318423-f06f85b5043f?w=400'),
  ('d8000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-00000000000a', 'Creator Payouts Integration Guide', 'Step-by-step Stripe Connect setup for tips and subscriptions.', 9900, 'active', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400'),
  ('d8000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000001', 'Community Launch Checklist', 'Notion template used to launch 3 communities to 500+ members.', 1900, 'active', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400'),
  ('d8000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000006', 'PostgreSQL Performance Audit', '1-hour review of queries, indexes, and RLS policies for your app.', 14900, 'active', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400'),
  ('d8000000-0000-4000-8000-000000000007', 'd1000000-0000-4000-8000-000000000002', 'Climate Pitch Deck Template', 'Investor-ready deck structure for early-stage climate startups.', 3900, 'active', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400'),
  ('d8000000-0000-4000-8000-000000000008', 'd1000000-0000-4000-8000-000000000005', 'Health Founder Mentorship Hour', '60-minute session on UX, regulatory basics, and go-to-market.', 19900, 'active', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price_cents = excluded.price_cents,
  status = excluded.status;
