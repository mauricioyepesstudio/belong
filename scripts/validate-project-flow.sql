-- E2E validation for Sprint 2B project workspace (run via: npm run test:project-e2e)
-- Uses existing user + community; cleans up test data on completion.

DO $$
DECLARE
  v_user_id uuid;
  v_community_id uuid;
  v_project_id uuid;
  v_post_id uuid;
  v_member_count int;
  v_like_count int;
  v_comment_count int;
BEGIN
  SELECT id INTO v_user_id FROM public.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found — create an account before running validation';
  END IF;

  SELECT cm.community_id INTO v_community_id
  FROM public.community_members cm
  WHERE cm.user_id = v_user_id
  ORDER BY cm.joined_at ASC
  LIMIT 1;

  IF v_community_id IS NULL THEN
    INSERT INTO public.communities (name, slug, description, tag, owner_id)
    VALUES (
      'E2E Project Validate Community',
      'e2e-project-validate-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      'Automated project validation',
      'Testing',
      v_user_id
    )
    RETURNING id INTO v_community_id;

    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (v_community_id, v_user_id, 'owner');
  END IF;

  INSERT INTO public.projects (name, description, owner_id, community_id, status, progress)
  VALUES ('E2E Validate Project', 'Automated validation', v_user_id, v_community_id, 'planning', 0)
  RETURNING id INTO v_project_id;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'owner');

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = v_project_id) THEN
    RAISE EXCEPTION 'Project was not saved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = v_project_id AND user_id = v_user_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Owner membership was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = v_project_id AND p.community_id = v_community_id
  ) THEN
    RAISE EXCEPTION 'Project is not linked to community';
  END IF;

  INSERT INTO public.project_posts (project_id, author_id, content)
  VALUES (v_project_id, v_user_id, 'E2E validation post')
  RETURNING id INTO v_post_id;

  INSERT INTO public.project_post_likes (post_id, user_id)
  VALUES (v_post_id, v_user_id);

  INSERT INTO public.project_post_comments (post_id, author_id, content)
  VALUES (v_post_id, v_user_id, 'E2E validation comment');

  SELECT count(*) INTO v_member_count FROM public.project_members WHERE project_id = v_project_id;
  SELECT count(*) INTO v_like_count FROM public.project_post_likes WHERE post_id = v_post_id;
  SELECT count(*) INTO v_comment_count FROM public.project_post_comments WHERE post_id = v_post_id;

  IF v_member_count < 1 THEN RAISE EXCEPTION 'Members list empty'; END IF;
  IF v_like_count <> 1 THEN RAISE EXCEPTION 'Like count mismatch'; END IF;
  IF v_comment_count <> 1 THEN RAISE EXCEPTION 'Comment count mismatch'; END IF;

  DELETE FROM public.project_post_comments WHERE post_id = v_post_id;
  DELETE FROM public.project_post_likes WHERE post_id = v_post_id;
  DELETE FROM public.project_posts WHERE id = v_post_id;
  DELETE FROM public.project_members WHERE project_id = v_project_id;
  DELETE FROM public.projects WHERE id = v_project_id;

  RAISE NOTICE 'Sprint 2B project workspace validation passed for project %', v_project_id;
END $$;
