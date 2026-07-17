-- Sprint 3C: Real-Time Collaboration Engine — enable postgres_changes for collaboration tables

alter publication supabase_realtime add table public.community_posts;
alter publication supabase_realtime add table public.community_post_comments;
alter publication supabase_realtime add table public.community_post_likes;
alter publication supabase_realtime add table public.community_members;
alter publication supabase_realtime add table public.project_posts;
alter publication supabase_realtime add table public.project_post_comments;
alter publication supabase_realtime add table public.project_post_likes;
alter publication supabase_realtime add table public.project_members;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.project_tasks;
alter publication supabase_realtime add table public.project_activity;
alter publication supabase_realtime add table public.project_discussions;
alter publication supabase_realtime add table public.project_discussion_replies;
alter publication supabase_realtime add table public.project_goals;
alter publication supabase_realtime add table public.missions;
alter publication supabase_realtime add table public.impact_events;
