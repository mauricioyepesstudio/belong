-- E2E: Identity & Reputation Engine — impact_events ledger

do $$
declare
  v_user_id uuid;
  v_event_count integer;
begin
  select id into v_user_id from public.users where onboarding_completed = true limit 1;
  if v_user_id is null then
    raise exception 'No onboarded user found for reputation E2E';
  end if;

  insert into public.impact_events (user_id, module, event_type, points, source_id, metadata)
  values (
    v_user_id,
    'mission',
    'mission_completed',
    10,
    gen_random_uuid()::text,
    '{"e2e": true}'::jsonb
  );

  select count(*) into v_event_count
  from public.impact_events
  where user_id = v_user_id;

  if v_event_count < 1 then
    raise exception 'impact_events insert failed';
  end if;

  raise notice 'Reputation E2E passed — % events for user %', v_event_count, v_user_id;
end $$;
