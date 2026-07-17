-- E2E validation for Sprint 2A community flow (run via: npx supabase db query --linked -f scripts/validate-community-flow.sql)
-- Uses existing user as owner; cleans up test data on completion.

DO $$
DECLARE
  v_user_id uuid;
  v_community_id uuid;
  v_slug text;
  v_post_id uuid;
  v_member_count int;
  v_like_count int;
  v_comment_count int;
BEGIN
  SELECT id INTO v_user_id FROM public.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found — create an account before running validation';
  END IF;

  v_slug := 'e2e-validate-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS');

  INSERT INTO public.communities (name, slug, description, tag, owner_id)
  VALUES ('E2E Validate Community', v_slug, 'Automated validation', 'Testing', v_user_id)
  RETURNING id INTO v_community_id;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  IF NOT EXISTS (SELECT 1 FROM public.communities WHERE id = v_community_id) THEN
    RAISE EXCEPTION 'Community was not saved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = v_community_id AND user_id = v_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Owner membership was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = v_community_id
    ORDER BY c.created_at DESC
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Community does not appear in discover query';
  END IF;

  INSERT INTO public.community_posts (community_id, author_id, content)
  VALUES (v_community_id, v_user_id, 'E2E validation post')
  RETURNING id INTO v_post_id;

  INSERT INTO public.community_post_likes (post_id, user_id)
  VALUES (v_post_id, v_user_id);

  INSERT INTO public.community_post_comments (post_id, author_id, content)
  VALUES (v_post_id, v_user_id, 'E2E validation comment');

  SELECT count(*) INTO v_member_count FROM public.community_members WHERE community_id = v_community_id;
  SELECT count(*) INTO v_like_count FROM public.community_post_likes WHERE post_id = v_post_id;
  SELECT count(*) INTO v_comment_count FROM public.community_post_comments WHERE post_id = v_post_id;

  IF v_member_count < 1 THEN RAISE EXCEPTION 'Members list empty'; END IF;
  IF v_like_count <> 1 THEN RAISE EXCEPTION 'Like count mismatch'; END IF;
  IF v_comment_count <> 1 THEN RAISE EXCEPTION 'Comment count mismatch'; END IF;

  DELETE FROM public.community_post_comments WHERE post_id = v_post_id;
  DELETE FROM public.community_post_likes WHERE post_id = v_post_id;
  DELETE FROM public.community_posts WHERE id = v_post_id;
  DELETE FROM public.community_members WHERE community_id = v_community_id;
  DELETE FROM public.communities WHERE id = v_community_id;

  RAISE NOTICE 'Sprint 2A community flow validation passed for slug %', v_slug;
END $$;
