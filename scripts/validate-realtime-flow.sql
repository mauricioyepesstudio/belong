-- Realtime validation for Sprint 3C (run via: npm run test:realtime-e2e)
-- Verifies collaboration tables are published to supabase_realtime.

DO $$
DECLARE
  v_table text;
  v_expected text[] := ARRAY[
    'community_posts',
    'community_post_comments',
    'community_post_likes',
    'community_members',
    'project_posts',
    'project_post_comments',
    'project_post_likes',
    'project_members',
    'projects',
    'project_tasks',
    'project_activity',
    'project_discussions',
    'project_discussion_replies',
    'project_goals',
    'missions',
    'impact_events',
    'messages',
    'notifications'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_expected
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      RAISE EXCEPTION 'Table % is not in supabase_realtime publication', v_table;
    END IF;
  END LOOP;

  RAISE NOTICE 'Realtime publication validation passed for % tables', array_length(v_expected, 1);
END $$;
