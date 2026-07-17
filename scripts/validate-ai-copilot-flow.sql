-- E2E validation for Sprint 5A AI Copilot (run via: npm run test:ai-copilot-e2e)
-- Verifies audit ledger and context-scoped AI action logging.

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_action_id uuid;
  v_count int;
BEGIN
  SELECT id INTO v_user_id FROM public.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found — create an account before running validation';
  END IF;

  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id
  ORDER BY om.joined_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (
      'E2E AI Copilot Org',
      'e2e-ai-copilot-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
      v_user_id
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');
  END IF;

  INSERT INTO public.ai_copilot_actions (
    user_id,
    context_type,
    context_id,
    action_type,
    status,
    input_summary,
    output_payload,
    model
  )
  VALUES (
    v_user_id,
    'organization',
    v_org_id,
    'weekly_summary',
    'completed',
    '{"discussionCount":0}'::jsonb,
    '{"kind":"weekly_summary","data":{"title":"Test","summary":"OK","highlights":["a"]}}'::jsonb,
    'belong-deterministic'
  )
  RETURNING id INTO v_action_id;

  IF v_action_id IS NULL THEN
    RAISE EXCEPTION 'AI copilot action was not saved';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.ai_copilot_actions
  WHERE id = v_action_id AND user_id = v_user_id;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'AI copilot action not readable';
  END IF;

  DELETE FROM public.ai_copilot_actions WHERE id = v_action_id;

  RAISE NOTICE 'Sprint 5A AI Copilot validation passed for org %', v_org_id;
END $$;
