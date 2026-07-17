-- E2E validation for Sprint 4A organization engine (run via: npm run test:organization-e2e)

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_community_id uuid;
  v_project_id uuid;
  v_mission_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found — create an account before running validation';
  END IF;

  INSERT INTO public.organizations (name, slug, description, owner_id)
  VALUES (
    'E2E Validate Org',
    'e2e-org-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
    'Automated organization validation',
    v_user_id
  )
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  INSERT INTO public.communities (name, slug, description, owner_id, organization_id)
  VALUES (
    'E2E Org Community',
    'e2e-org-community-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
    'Org-linked community',
    v_user_id,
    v_org_id
  )
  RETURNING id INTO v_community_id;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'owner');

  INSERT INTO public.projects (name, description, owner_id, community_id, organization_id, status, progress)
  VALUES ('E2E Org Project', 'Validation', v_user_id, v_community_id, v_org_id, 'planning', 0)
  RETURNING id INTO v_project_id;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'owner');

  INSERT INTO public.missions (user_id, title, organization_id, is_primary, state)
  VALUES (v_user_id, 'E2E Org Mission', v_org_id, false, 'active')
  RETURNING id INTO v_mission_id;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_org_id) THEN
    RAISE EXCEPTION 'Organization was not saved';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.communities WHERE id = v_community_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Community is not linked to organization';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE id = v_project_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Project is not linked to organization';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.missions WHERE id = v_mission_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Mission is not linked to organization';
  END IF;

  DELETE FROM public.missions WHERE id = v_mission_id;
  DELETE FROM public.project_members WHERE project_id = v_project_id;
  DELETE FROM public.projects WHERE id = v_project_id;
  DELETE FROM public.community_members WHERE community_id = v_community_id;
  DELETE FROM public.communities WHERE id = v_community_id;
  DELETE FROM public.organization_members WHERE organization_id = v_org_id;
  DELETE FROM public.organizations WHERE id = v_org_id;

  RAISE NOTICE 'Sprint 4A organization validation passed for org %', v_org_id;
END $$;
