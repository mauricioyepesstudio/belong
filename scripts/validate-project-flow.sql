-- E2E validation for project workspace (run via: npm run test:project-e2e)
-- Uses existing user + community; cleans up test data on completion.

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_community_id uuid;
  v_project_id uuid;
  v_post_id uuid;
  v_task_id uuid;
  v_goal_id uuid;
  v_activity_count int;
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
    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    WHERE om.user_id = v_user_id
    ORDER BY om.joined_at ASC
    LIMIT 1;

    IF v_org_id IS NULL THEN
      INSERT INTO public.organizations (name, slug, owner_id)
      VALUES (
        'E2E Project Validate Org',
        'e2e-project-org-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
        v_user_id
      )
      RETURNING id INTO v_org_id;

      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (v_org_id, v_user_id, 'owner');
    END IF;

    INSERT INTO public.communities (name, slug, description, tag, owner_id, organization_id)
    VALUES (
      'E2E Project Validate Community',
      'e2e-project-validate-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      'Automated project validation',
      'Testing',
      v_user_id,
      v_org_id
    )
    RETURNING id INTO v_community_id;

    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (v_community_id, v_user_id, 'owner');
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.communities
  WHERE id = v_community_id;

  INSERT INTO public.projects (name, description, owner_id, community_id, organization_id, status, progress)
  VALUES ('E2E Validate Project', 'Automated validation', v_user_id, v_community_id, v_org_id, 'planning', 0)
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

  INSERT INTO public.project_tasks (project_id, creator_id, title, status, priority)
  VALUES (v_project_id, v_user_id, 'E2E validation task', 'todo', 'medium')
  RETURNING id INTO v_task_id;

  UPDATE public.project_tasks
  SET status = 'done', completed_at = now()
  WHERE id = v_task_id;

  INSERT INTO public.project_goals (project_id, creator_id, title, goal_type, progress_percent)
  VALUES (v_project_id, v_user_id, 'E2E weekly goal', 'weekly', 50)
  RETURNING id INTO v_goal_id;

  INSERT INTO public.project_activity (project_id, actor_id, activity_type, title)
  VALUES (v_project_id, v_user_id, 'task_created', 'E2E task created');

  SELECT count(*) INTO v_member_count FROM public.project_members WHERE project_id = v_project_id;
  SELECT count(*) INTO v_like_count FROM public.project_post_likes WHERE post_id = v_post_id;
  SELECT count(*) INTO v_comment_count FROM public.project_post_comments WHERE post_id = v_post_id;
  SELECT count(*) INTO v_activity_count FROM public.project_activity WHERE project_id = v_project_id;

  IF v_member_count < 1 THEN RAISE EXCEPTION 'Members list empty'; END IF;
  IF v_like_count <> 1 THEN RAISE EXCEPTION 'Like count mismatch'; END IF;
  IF v_comment_count <> 1 THEN RAISE EXCEPTION 'Comment count mismatch'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_tasks WHERE id = v_task_id AND status = 'done') THEN
    RAISE EXCEPTION 'Task was not completed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.project_goals WHERE id = v_goal_id) THEN
    RAISE EXCEPTION 'Goal was not saved';
  END IF;
  IF v_activity_count < 1 THEN RAISE EXCEPTION 'Activity feed empty'; END IF;

  DELETE FROM public.project_activity WHERE project_id = v_project_id;
  DELETE FROM public.project_goals WHERE project_id = v_project_id;
  DELETE FROM public.project_tasks WHERE project_id = v_project_id;
  DELETE FROM public.project_post_comments WHERE post_id = v_post_id;
  DELETE FROM public.project_post_likes WHERE post_id = v_post_id;
  DELETE FROM public.project_posts WHERE id = v_post_id;
  DELETE FROM public.project_members WHERE project_id = v_project_id;
  DELETE FROM public.projects WHERE id = v_project_id;

  RAISE NOTICE 'Project workspace validation passed for project %', v_project_id;
END $$;
