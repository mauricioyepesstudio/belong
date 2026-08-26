-- Proof Loop V1 validation (RLS, triggers, state transitions)
-- Authorization under test: belong_internal.proof_resolve_tokens only
-- (not GUCs, not pg_trigger_depth).
--
-- Run after migration is applied:
--   npx supabase db query --local --file scripts/validate-proof-loop-flow.sql
-- Does NOT push or modify remote DBs by itself.
--
-- Requires at least one row in public.users (linked to auth.users).

create or replace function pg_temp.proof_loop_set_auth(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
end;
$$;

do $$
declare
  v_author uuid;
  v_other uuid;
  v_org_id uuid;
  v_claim_id uuid;
  v_claim_bait_id uuid;
  v_claim_spoof_id uuid;
  v_normative_id uuid;
  v_challenge_id uuid;
  v_approach_id uuid;
  v_evidence_id uuid;
  v_participant_id uuid;
  v_outcome_id uuid;
  v_project_id uuid;
  v_foreign_project_id uuid;
  v_mission_id uuid;
  v_status public.proof_claim_status;
  v_has_exec boolean;
  v_suffix text := to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
begin
  select id into v_author from public.users order by created_at limit 1;
  if v_author is null then
    raise exception 'No users found — create an account before running validation';
  end if;

  select id into v_other
  from public.users
  where id is distinct from v_author
  order by created_at
  limit 1;

  reset role;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.user_id = v_author
  order by om.joined_at asc
  limit 1;

  if v_org_id is null then
    insert into public.organizations (name, slug, owner_id)
    values (
      'Proof Loop Validate Org',
      'proof-loop-org-' || v_suffix,
      v_author
    )
    returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, v_author, 'owner');
  end if;

  insert into public.proof_claims (author_id, title, body, claim_type, status)
  values (v_author, 'Proof loop validate claim ' || v_suffix, 'body', 'factual', 'draft')
  returning id into v_claim_id;

  update public.proof_claims set status = 'active' where id = v_claim_id;

  insert into public.proof_standards (claim_id, problem_statement, hypothesis)
  values (v_claim_id, 'problem', 'hypothesis');

  insert into public.proof_claims (author_id, title, body, claim_type, status)
  values (v_author, 'Proof loop normative claim ' || v_suffix, 'body', 'normative', 'active')
  returning id into v_normative_id;

  insert into public.proof_claims (author_id, title, body, claim_type, status)
  values (v_author, 'Proof loop GUC spoof claim ' || v_suffix, 'body', 'factual', 'active')
  returning id into v_claim_spoof_id;

  insert into public.proof_challenges (claim_id, author_id, challenge_type, body)
  values (v_claim_id, v_author, 'test', 'Challenge body')
  returning id into v_challenge_id;

  insert into public.proof_approaches (challenge_id, author_id, title, body, status)
  values (v_challenge_id, v_author, 'Approach A', 'body', 'proposed')
  returning id into v_approach_id;

  insert into public.projects (name, description, owner_id, organization_id, status, progress)
  values (
    'Proof loop validate project ' || v_suffix,
    'validation',
    v_author,
    v_org_id,
    'planning',
    0
  )
  returning id into v_project_id;

  insert into public.project_members (project_id, user_id, role)
  values (v_project_id, v_author, 'owner')
  on conflict do nothing;

  if v_other is not null then
    insert into public.projects (name, description, owner_id, organization_id, status, progress)
    values (
      'Proof loop foreign project ' || v_suffix,
      'validation',
      v_other,
      v_org_id,
      'planning',
      0
    )
    returning id into v_foreign_project_id;

    insert into public.project_members (project_id, user_id, role)
    values (v_foreign_project_id, v_other, 'owner')
    on conflict do nothing;
  end if;

  insert into public.missions (user_id, title, description, organization_id)
  values (v_author, 'Proof loop validate mission ' || v_suffix, 'validation', v_org_id)
  returning id into v_mission_id;

  ----------------------------------------------------------------------
  -- NEGATIVE: custom GUC / SET LOCAL must NOT authorize active->resolved
  ----------------------------------------------------------------------
  begin
    perform set_config('belong.proof_resolving_claim', v_claim_spoof_id::text, true);
    perform set_config('belong.proof_resolving', '1', true);
    update public.proof_claims
    set status = 'resolved'
    where id = v_claim_spoof_id;
    raise exception 'FAIL: GUC spoof via set_config authorized active->resolved';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    execute format('set local belong.proof_resolving_claim to %L', v_claim_spoof_id::text);
    update public.proof_claims
    set status = 'resolved'
    where id = v_claim_spoof_id;
    raise exception 'FAIL: GUC spoof via SET LOCAL authorized active->resolved';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  select status into v_status from public.proof_claims where id = v_claim_spoof_id;
  if v_status is distinct from 'active' then
    raise exception 'FAIL: spoof claim status drifted to % after GUC attempts', v_status;
  end if;

  -- Cross-claim: token for claim A must not authorize resolving claim B
  insert into belong_internal.proof_resolve_tokens (claim_id)
  values (v_claim_id);
  begin
    update public.proof_claims
    set status = 'resolved'
    where id = v_claim_spoof_id;
    raise exception 'FAIL: token for claim A authorized resolve of claim B';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  delete from belong_internal.proof_resolve_tokens where claim_id = v_claim_id;

  select status into v_status from public.proof_claims where id = v_claim_spoof_id;
  if v_status is distinct from 'active' then
    raise exception 'FAIL: cross-claim token spoof changed status to %', v_status;
  end if;

  ----------------------------------------------------------------------
  -- Trigger functions must not be directly callable by authenticated
  ----------------------------------------------------------------------
  select has_function_privilege('authenticated', 'public.proof_outcomes_after_insert_resolve_claim()', 'execute')
    into v_has_exec;
  if coalesce(v_has_exec, false) then
    raise exception 'FAIL: authenticated retains EXECUTE on SECURITY DEFINER resolve function';
  end if;

  select has_function_privilege('authenticated', 'public.proof_claims_enforce_status_transition()', 'execute')
    into v_has_exec;
  if coalesce(v_has_exec, false) then
    raise exception 'FAIL: authenticated retains EXECUTE on status transition trigger function';
  end if;

  begin
    perform pg_temp.proof_loop_set_auth(v_author);
    execute 'set local role authenticated';
    begin
      perform public.proof_outcomes_after_insert_resolve_claim();
      raise exception 'FAIL: direct call to DEFINER resolve function succeeded';
    exception
      when insufficient_privilege then null;
      when undefined_function then null;
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
        -- trigger functions returning trigger cannot be called as normal functions
        null;
    end;
    reset role;
  exception
    when invalid_parameter_value or insufficient_privilege or undefined_object then
      reset role;
      raise notice 'Direct-call EXECUTE probe under authenticated role skipped';
  end;

  ----------------------------------------------------------------------
  -- Trigger / state-transition tests (owner role; triggers still fire)
  ----------------------------------------------------------------------

  begin
    update public.proof_claims set status = 'resolved' where id = v_claim_id;
    raise exception 'FAIL: direct active->resolved should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  select status into v_status from public.proof_claims where id = v_claim_id;
  if v_status is distinct from 'active' then
    raise exception 'FAIL: claim status drifted to % after blocked resolve', v_status;
  end if;

  begin
    insert into public.proof_outcomes (claim_id, resolution, summary, resolved_by)
    values (v_normative_id, 'supported', 'should fail', v_author);
    raise exception 'FAIL: normative supported resolution should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    insert into public.proof_evidence (
      author_id, claim_id, body, provenance
    ) values (
      v_author, v_claim_id, 'bad provenance', 'organization_confirmed'
    );
    raise exception 'FAIL: privileged provenance insert should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  insert into public.proof_evidence (author_id, claim_id, body, provenance)
  values (v_author, v_claim_id, 'valid evidence ' || v_suffix, 'self_reported')
  returning id into v_evidence_id;

  begin
    update public.proof_evidence
    set approach_id = v_approach_id, claim_id = null
    where id = v_evidence_id;
    raise exception 'FAIL: evidence subject reassignment should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    update public.proof_challenges
    set claim_id = v_normative_id
    where id = v_challenge_id;
    raise exception 'FAIL: challenge claim_id change should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  if v_other is not null then
    begin
      update public.proof_approaches
      set author_id = v_other
      where id = v_approach_id;
      raise exception 'FAIL: approach author_id change should be blocked';
    exception
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
    end;
  end if;

  begin
    update public.proof_claims
    set claim_type = 'predictive'
    where id = v_claim_id;
    raise exception 'FAIL: claim_type change after draft should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  insert into public.proof_participants (user_id, claim_id, role, status)
  values (v_author, v_claim_id, 'contributor', 'active')
  returning id into v_participant_id;

  update public.proof_participants
  set status = 'withdrawn'
  where id = v_participant_id;

  begin
    update public.proof_participants
    set status = 'active'
    where id = v_participant_id;
    raise exception 'FAIL: withdrawn participant reactivation should be blocked';
  exception
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  begin
    insert into public.proof_participants (user_id, claim_id, role, status)
    values (v_author, v_claim_id, 'contributor', 'active');
    raise exception 'FAIL: duplicate participation insert should be blocked';
  exception
    when unique_violation then
      null;
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  insert into public.proof_execution_links (approach_id, project_id)
  values (v_approach_id, v_project_id);

  insert into public.proof_execution_links (approach_id, mission_id)
  values (v_approach_id, v_mission_id);

  if v_foreign_project_id is not null then
    begin
      perform pg_temp.proof_loop_set_auth(v_author);
      execute 'set local role authenticated';
      begin
        insert into public.proof_execution_links (approach_id, project_id)
        values (v_approach_id, v_foreign_project_id);
        raise exception 'FAIL: foreign project execution link should be denied';
      exception
        when others then
          if sqlerrm like 'FAIL:%' then raise; end if;
      end;
      reset role;
    exception
      when invalid_parameter_value or insufficient_privilege or undefined_object then
        reset role;
        raise notice 'Foreign-project RLS test skipped (authenticated role not usable)';
    end;
  end if;

  -- Permitted resolve: proves triggers still fire after EXECUTE revoke from authenticated
  insert into public.proof_outcomes (
    claim_id, resolution, summary, resolved_by, position_updated
  ) values (
    v_claim_id, 'supported', 'Validation outcome ' || v_suffix, v_author, false
  )
  returning id into v_outcome_id;

  select status into v_status from public.proof_claims where id = v_claim_id;
  if v_status is distinct from 'resolved' then
    raise exception 'FAIL: outcome insert did not resolve claim (status=%); trigger may be broken by EXECUTE revoke', v_status;
  end if;

  -- Token must not linger after successful resolve
  if exists (
    select 1 from belong_internal.proof_resolve_tokens where claim_id = v_claim_id
  ) then
    raise exception 'FAIL: resolve token leaked after successful resolution';
  end if;

  begin
    insert into public.proof_outcomes (claim_id, resolution, summary, resolved_by)
    values (v_claim_id, 'mixed', 'duplicate', v_author);
    raise exception 'FAIL: duplicate outcome should be blocked';
  exception
    when unique_violation then
      null;
    when others then
      if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  insert into public.proof_outcomes (claim_id, resolution, summary, resolved_by)
  values (
    v_normative_id,
    'inconclusive',
    'Normative tradeoffs ' || v_suffix,
    v_author
  );

  select status into v_status from public.proof_claims where id = v_normative_id;
  if v_status is distinct from 'resolved' then
    raise exception 'FAIL: normative inconclusive did not resolve claim';
  end if;

  ----------------------------------------------------------------------
  -- RLS tests as authenticated (best-effort)
  ----------------------------------------------------------------------
  begin
    perform pg_temp.proof_loop_set_auth(v_author);
    execute 'set local role authenticated';

    if not exists (
      select 1 from public.proof_claims where id = v_claim_id
    ) then
      raise exception 'FAIL: author cannot select visible claim under RLS';
    end if;

    -- Authenticated must not write resolve tokens
    begin
      insert into belong_internal.proof_resolve_tokens (claim_id)
      values (v_claim_spoof_id);
      raise exception 'FAIL: authenticated inserted belong_internal resolve token';
    exception
      when insufficient_privilege then null;
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
        -- schema privilege errors vary by message
        null;
    end;

    -- Spoof GUC under authenticated role, then attempt resolve
    begin
      perform set_config('belong.proof_resolving_claim', v_claim_spoof_id::text, true);
      update public.proof_claims
      set status = 'resolved'
      where id = v_claim_spoof_id;
      if found then
        raise exception 'FAIL: authenticated GUC spoof updated claim to resolved';
      end if;
    exception
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
    end;

    begin
      delete from public.proof_outcomes where id = v_outcome_id;
      if found then
        raise exception 'FAIL: outcome delete should be denied under RLS';
      end if;
    exception
      when insufficient_privilege then null;
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
    end;

    begin
      update public.proof_outcomes
      set summary = 'mutated'
      where id = v_outcome_id;
      if found then
        raise exception 'FAIL: outcome update should be denied under RLS';
      end if;
    exception
      when insufficient_privilege then null;
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
    end;

    begin
      insert into public.proof_evidence (author_id, claim_id, body, provenance)
      values (
        v_author,
        v_claim_id,
        'rls privileged',
        'independently_reviewed'
      );
      raise exception 'FAIL: RLS privileged provenance insert should fail';
    exception
      when others then
        if sqlerrm like 'FAIL:%' then raise; end if;
    end;

    reset role;
  exception
    when invalid_parameter_value or insufficient_privilege or undefined_object then
      reset role;
      raise notice 'RLS role-switch skipped (authenticated role not usable in this environment)';
  end;

  if v_other is not null then
    begin
      reset role;
      insert into public.proof_claims (author_id, title, body, claim_type, status)
      values (
        v_author,
        'Other-user resolve bait ' || v_suffix,
        'body',
        'factual',
        'active'
      )
      returning id into v_claim_bait_id;

      perform pg_temp.proof_loop_set_auth(v_other);
      execute 'set local role authenticated';

      begin
        insert into public.proof_outcomes (claim_id, resolution, summary, resolved_by)
        values (v_claim_bait_id, 'supported', 'hijack', v_other);
        raise exception 'FAIL: non-author outcome insert should be denied';
      exception
        when others then
          if sqlerrm like 'FAIL:%' then raise; end if;
      end;

      reset role;
    exception
      when invalid_parameter_value or insufficient_privilege or undefined_object then
        reset role;
        raise notice 'Non-author RLS tests skipped (authenticated role not usable)';
    end;
  else
    raise notice 'Non-author RLS tests skipped (only one user in public.users)';
  end if;

  select status into v_status from public.proof_claims where id = v_claim_spoof_id;
  if v_status is distinct from 'active' then
    raise exception 'FAIL: spoof claim ended as % (expected active)', v_status;
  end if;

  ----------------------------------------------------------------------
  -- Cleanup
  ----------------------------------------------------------------------
  reset role;

  delete from public.proof_execution_links where approach_id = v_approach_id;
  delete from public.proof_participants where id = v_participant_id;
  delete from public.proof_evidence where id = v_evidence_id;
  delete from public.proof_outcomes
  where claim_id in (v_claim_id, v_normative_id, v_claim_bait_id);
  delete from public.proof_approaches where id = v_approach_id;
  delete from public.proof_challenges where id = v_challenge_id;
  delete from public.proof_standards
  where claim_id in (v_claim_id, v_normative_id, v_claim_bait_id, v_claim_spoof_id);
  delete from public.proof_claims
  where id in (v_claim_id, v_normative_id, v_claim_bait_id, v_claim_spoof_id);
  delete from belong_internal.proof_resolve_tokens
  where claim_id in (v_claim_id, v_normative_id, v_claim_bait_id, v_claim_spoof_id);
  delete from public.missions where id = v_mission_id;
  delete from public.project_members
  where project_id in (v_project_id, coalesce(v_foreign_project_id, v_project_id));
  delete from public.projects
  where id in (v_project_id, coalesce(v_foreign_project_id, v_project_id));

  raise notice 'Proof Loop V1 validation passed (token auth only; GUC spoof resisted; triggers fire; DEFINER not client-callable)';
end;
$$;

drop function if exists pg_temp.proof_loop_set_auth(uuid);
