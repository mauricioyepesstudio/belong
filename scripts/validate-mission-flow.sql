-- E2E validation for Sprint 2C Mission Engine (run via: npm run test:mission-e2e)

DO $$
DECLARE
  v_user_id uuid;
  v_mission_id uuid;
  v_quarterly_id uuid;
  v_weekly_id uuid;
  v_daily_id uuid;
  v_streak int;
  v_quarterly_progress int;
BEGIN
  SELECT id INTO v_user_id FROM public.users ORDER BY created_at LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found — create an account before running validation';
  END IF;

  SELECT id INTO v_mission_id
  FROM public.missions
  WHERE user_id = v_user_id AND is_primary = true AND state <> 'archived'
  LIMIT 1;

  IF v_mission_id IS NULL THEN
    INSERT INTO public.missions (user_id, title, description, vision, is_primary, state)
    VALUES (
      v_user_id,
      'E2E Life Mission',
      'Automated mission validation',
      'Build something meaningful',
      true,
      'active'
    )
    RETURNING id INTO v_mission_id;
  END IF;

  INSERT INTO public.quarterly_goals (user_id, mission_id, title, description, due_date, progress_percent)
  VALUES (
    v_user_id,
    v_mission_id,
    'E2E Quarterly Goal ' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
    'Validation quarter',
    (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date,
    0
  )
  RETURNING id INTO v_quarterly_id;

  INSERT INTO public.weekly_goals (
    user_id, mission_id, quarterly_goal_id, title, target_count, week_start, week_end
  )
  VALUES (
    v_user_id,
    v_mission_id,
    v_quarterly_id,
    'E2E Weekly Goal ' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
    3,
    date_trunc('week', current_date)::date,
    (date_trunc('week', current_date) + interval '6 days')::date
  )
  RETURNING id INTO v_weekly_id;

  INSERT INTO public.daily_missions (
    user_id, mission_id, weekly_goal_id, title, mission_date, status, impact_points
  )
  VALUES (
    v_user_id,
    v_mission_id,
    v_weekly_id,
    'E2E Daily Mission ' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS'),
    current_date,
    'pending',
    15
  )
  RETURNING id INTO v_daily_id;

  UPDATE public.daily_missions
  SET status = 'completed', completed_at = now()
  WHERE id = v_daily_id;

  PERFORM public.record_user_activity(v_user_id);

  UPDATE public.quarterly_goals
  SET progress_percent = 25
  WHERE id = v_quarterly_id
  RETURNING progress_percent INTO v_quarterly_progress;

  SELECT current_streak INTO v_streak FROM public.user_momentum WHERE user_id = v_user_id;

  IF v_quarterly_progress <> 25 THEN RAISE EXCEPTION 'Quarterly progress not updated'; END IF;
  IF v_streak IS NULL OR v_streak < 1 THEN RAISE EXCEPTION 'Streak not recorded'; END IF;

  DELETE FROM public.daily_missions WHERE id = v_daily_id;
  DELETE FROM public.weekly_goals WHERE id = v_weekly_id;
  DELETE FROM public.quarterly_goals WHERE id = v_quarterly_id;

  RAISE NOTICE 'Sprint 2C Mission Engine validation passed';
END $$;
