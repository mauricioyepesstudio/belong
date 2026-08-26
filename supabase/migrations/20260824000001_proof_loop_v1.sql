-- BELONG: Proof Loop V1
-- Migration: 20260824000001_proof_loop_v1
--
-- Claim/outcome consistency: inserting a valid outcome must set proof_claims.status
-- to resolved. Clients cannot set resolved directly.
--
-- Authorization for active->resolved does NOT use custom GUCs (set_config / SET LOCAL
-- are client-spoofable). Instead, proof_outcomes_after_insert_resolve_claim
-- (SECURITY DEFINER) inserts a one-row token into belong_internal.proof_resolve_tokens
-- (no grants to authenticated/anon/public), updates the claim, then deletes the token.
-- proof_claims_enforce_status_transition allows active->resolved only when that token
-- exists for the claim id.

-- Enums
create type public.proof_claim_type as enum (
  'factual',
  'causal',
  'predictive',
  'normative',
  'commitment',
  'capability',
  'solution',
  'goal'
);

create type public.proof_claim_status as enum (
  'draft',
  'active',
  'resolved',
  'archived'
);

create type public.proof_challenge_type as enum (
  'test',
  'support',
  'counter',
  'improve',
  'execute'
);

create type public.proof_approach_status as enum (
  'proposed',
  'active',
  'completed',
  'withdrawn'
);

create type public.proof_evidence_provenance as enum (
  'self_reported',
  'participant_recorded',
  'owner_confirmed',
  'organization_confirmed',
  'multi_party_confirmed',
  'external_source_linked',
  'independently_reviewed'
);

create type public.proof_evidence_status as enum (
  'active',
  'disputed',
  'incomplete',
  'retracted'
);

create type public.proof_resolution as enum (
  'supported',
  'partially_supported',
  'mixed',
  'not_supported',
  'inconclusive',
  'failed_to_complete',
  'withdrawn'
);

-- Internal resolve-token schema (not client-writable; not a GUC)
create schema belong_internal;
revoke all on schema belong_internal from public;
revoke all on schema belong_internal from anon;
revoke all on schema belong_internal from authenticated;

create table belong_internal.proof_resolve_tokens (
  claim_id uuid primary key,
  created_at timestamptz not null default now()
);

revoke all on table belong_internal.proof_resolve_tokens from public;
revoke all on table belong_internal.proof_resolve_tokens from anon;
revoke all on table belong_internal.proof_resolve_tokens from authenticated;

-- Tables

-- 1. Proof Claims
create table public.proof_claims (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  body text not null default '',
  claim_type public.proof_claim_type not null,
  status public.proof_claim_status not null default 'draft',
  community_id uuid references public.communities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Proof Standards (1:1 with Claim)
create table public.proof_standards (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.proof_claims(id) on delete cascade,
  problem_statement text,
  hypothesis text,
  success_criteria jsonb not null default '[]',
  baseline text,
  deadline timestamptz,
  evidence_requirements text,
  refutation_criteria text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Proof Challenges
create table public.proof_challenges (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.proof_claims(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  challenge_type public.proof_challenge_type not null,
  body text not null check (length(btrim(body)) > 0),
  status text not null default 'active'
    check (status in ('active', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Proof Approaches
create table public.proof_approaches (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.proof_challenges(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  body text,
  status public.proof_approach_status not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Proof Execution Links (Link Approach to Project or Mission)
create table public.proof_execution_links (
  id uuid primary key default gen_random_uuid(),
  approach_id uuid not null references public.proof_approaches(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint proof_execution_links_one_target check (
    (project_id is not null and mission_id is null) or
    (project_id is null and mission_id is not null)
  ),
  unique (approach_id, project_id),
  unique (approach_id, mission_id)
);

-- 6. Proof Evidence
-- Outcomes exist independently; evidence may reference an outcome.
create table public.proof_evidence (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  claim_id uuid references public.proof_claims(id) on delete cascade,
  approach_id uuid references public.proof_approaches(id) on delete cascade,
  outcome_id uuid,
  body text,
  source_url text,
  media_url text,
  media_path text,
  provenance public.proof_evidence_provenance not null default 'self_reported',
  status public.proof_evidence_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proof_evidence_one_subject check (
    (claim_id is not null)::int + (approach_id is not null)::int + (outcome_id is not null)::int = 1
  ),
  constraint proof_evidence_body_or_media check (
    length(btrim(coalesce(body, ''))) > 0 or source_url is not null or media_path is not null
  )
);

-- 7. Proof Outcomes (1:1 with Claim)
create table public.proof_outcomes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.proof_claims(id) on delete cascade,
  resolution public.proof_resolution not null,
  summary text not null check (length(btrim(summary)) > 0),
  resolved_by uuid not null references public.users(id),
  resolved_at timestamptz not null default now(),
  criteria_snapshot jsonb,
  uncertainty_notes text,
  position_updated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proof_evidence
  add constraint proof_evidence_outcome_id_fkey
  foreign key (outcome_id) references public.proof_outcomes(id) on delete cascade;

-- 8. Proof Participants (Proof-specific participation only)
create table public.proof_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  claim_id uuid references public.proof_claims(id) on delete cascade,
  challenge_id uuid references public.proof_challenges(id) on delete cascade,
  approach_id uuid references public.proof_approaches(id) on delete cascade,
  role text not null default 'contributor'
    check (role in ('contributor', 'supporter', 'observer')),
  intent text,
  status text not null default 'active'
    check (status in ('active', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proof_participants_one_context check (
    (claim_id is not null)::int + (challenge_id is not null)::int + (approach_id is not null)::int = 1
  ),
  unique (user_id, claim_id),
  unique (user_id, challenge_id),
  unique (user_id, approach_id)
);

-- Indexes
create index proof_claims_author_status_idx on public.proof_claims(author_id, status);
create index proof_claims_community_status_idx on public.proof_claims(community_id, status);
create index proof_challenges_claim_idx on public.proof_challenges(claim_id);
create index proof_approaches_challenge_idx on public.proof_approaches(challenge_id);
create index proof_evidence_claim_idx on public.proof_evidence(claim_id);
create index proof_evidence_approach_idx on public.proof_evidence(approach_id);
create index proof_evidence_outcome_idx on public.proof_evidence(outcome_id);
create index proof_evidence_provenance_status_idx on public.proof_evidence(provenance, status);
create index proof_participants_user_idx on public.proof_participants(user_id);

-- updated_at: reuse canonical public.handle_updated_at()
create trigger proof_claims_updated_at before update on public.proof_claims for each row execute function public.handle_updated_at();
create trigger proof_standards_updated_at before update on public.proof_standards for each row execute function public.handle_updated_at();
create trigger proof_challenges_updated_at before update on public.proof_challenges for each row execute function public.handle_updated_at();
create trigger proof_approaches_updated_at before update on public.proof_approaches for each row execute function public.handle_updated_at();
create trigger proof_evidence_updated_at before update on public.proof_evidence for each row execute function public.handle_updated_at();
create trigger proof_outcomes_updated_at before update on public.proof_outcomes for each row execute function public.handle_updated_at();
create trigger proof_participants_updated_at before update on public.proof_participants for each row execute function public.handle_updated_at();

-- RLS Helpers
create or replace function public.can_view_proof_context(
  p_community_id uuid,
  p_claim_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    p_community_id is null
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = p_community_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.proof_claims pc
      where pc.id = p_claim_id
        and pc.author_id = auth.uid()
    );
$$;

create or replace function public.is_privileged_provenance(
  p_provenance public.proof_evidence_provenance
)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select p_provenance in (
    'organization_confirmed'::public.proof_evidence_provenance,
    'multi_party_confirmed'::public.proof_evidence_provenance,
    'independently_reviewed'::public.proof_evidence_provenance
  );
$$;

create or replace function public.can_access_proof_project(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.can_access_proof_mission(p_mission_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.missions m
    where m.id = p_mission_id
      and m.user_id = auth.uid()
  );
$$;

-- Integrity triggers

-- SECURITY DEFINER: must read belong_internal.proof_resolve_tokens (no client grants).
-- Fixed search_path; function only validates NEW/OLD and never writes claim rows itself.
create or replace function public.proof_claims_enforce_status_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, belong_internal
as $$
begin
  if new.author_id is distinct from old.author_id then
    raise exception 'proof_claims.author_id cannot be changed';
  end if;

  if old.status is distinct from 'draft'
     and new.claim_type is distinct from old.claim_type then
    raise exception 'proof_claims.claim_type cannot be changed after draft';
  end if;

  if old.status is distinct from new.status then
    -- Non-spoofable gate: token written only by proof_outcomes_after_insert_resolve_claim.
    -- Custom GUCs are intentionally ignored even if a client sets them.
    if old.status = 'active'
       and new.status = 'resolved'
       and exists (
         select 1
         from belong_internal.proof_resolve_tokens t
         where t.claim_id = new.id
       ) then
      return new;
    end if;

    if old.status = 'draft' and new.status in ('active', 'archived') then
      null;
    elsif old.status = 'active' and new.status = 'archived' then
      null;
    elsif old.status = 'resolved' and new.status = 'archived' then
      null;
    else
      raise exception 'Invalid proof_claims status transition: % -> %', old.status, new.status;
    end if;
  end if;

  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    raise exception 'proof_claims.status = resolved is set only by outcome resolution';
  end if;

  return new;
end;
$$;

create trigger proof_claims_status_transition
  before update on public.proof_claims
  for each row
  execute function public.proof_claims_enforce_status_transition();

create or replace function public.proof_outcomes_before_insert_validate()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_claim public.proof_claims%rowtype;
begin
  select * into v_claim
  from public.proof_claims
  where id = new.claim_id
  for update;

  if not found then
    raise exception 'Outcome requires an existing proof claim';
  end if;

  if v_claim.status is distinct from 'active' then
    raise exception 'Only active proof claims can be resolved';
  end if;

  if new.resolved_by is distinct from v_claim.author_id then
    raise exception 'Only the claim author may resolve this proof in V1';
  end if;

  if v_claim.claim_type = 'normative'
     and new.resolution not in (
       'mixed'::public.proof_resolution,
       'inconclusive'::public.proof_resolution,
       'failed_to_complete'::public.proof_resolution,
       'withdrawn'::public.proof_resolution
     ) then
    raise exception
      'Normative claims may only resolve to mixed, inconclusive, failed_to_complete, or withdrawn';
  end if;

  return new;
end;
$$;

create trigger proof_outcomes_before_insert_validate
  before insert on public.proof_outcomes
  for each row
  execute function public.proof_outcomes_before_insert_validate();

-- SECURITY DEFINER: writes private resolve token + updates claim (RLS bypass as owner).
-- Fixed search_path. Execute revoked from clients; trigger fire does not need client EXECUTE.
-- Token lifetime is the surrounding transaction: success deletes it; any exception deletes it
-- before re-raise, and a failed statement still rolls back the token INSERT.
create or replace function public.proof_outcomes_after_insert_resolve_claim()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, belong_internal
as $$
begin
  insert into belong_internal.proof_resolve_tokens (claim_id)
  values (new.claim_id);

  begin
    update public.proof_claims
    set status = 'resolved'
    where id = new.claim_id
      and status = 'active';

    if not found then
      raise exception 'Failed to mark proof claim as resolved after outcome insert';
    end if;
  exception
    when others then
      delete from belong_internal.proof_resolve_tokens
      where claim_id = new.claim_id;
      raise;
  end;

  delete from belong_internal.proof_resolve_tokens where claim_id = new.claim_id;
  return new;
end;
$$;

create trigger proof_outcomes_after_insert_resolve_claim
  after insert on public.proof_outcomes
  for each row
  execute function public.proof_outcomes_after_insert_resolve_claim();

create or replace function public.proof_evidence_block_privileged_provenance()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.author_id is distinct from old.author_id
       or new.claim_id is distinct from old.claim_id
       or new.approach_id is distinct from old.approach_id
       or new.outcome_id is distinct from old.outcome_id then
      raise exception 'Proof evidence author and subject cannot be changed';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if public.is_privileged_provenance(new.provenance) then
      raise exception 'Privileged evidence provenance cannot be set by clients';
    end if;
  elsif tg_op = 'UPDATE' then
    if public.is_privileged_provenance(new.provenance)
       and new.provenance is distinct from old.provenance then
      raise exception 'Privileged evidence provenance cannot be set by clients';
    end if;
    if public.is_privileged_provenance(old.provenance)
       and new.provenance is distinct from old.provenance then
      raise exception 'Privileged evidence provenance cannot be altered by clients';
    end if;
  end if;
  return new;
end;
$$;

create trigger proof_evidence_block_privileged_provenance
  before insert or update on public.proof_evidence
  for each row
  execute function public.proof_evidence_block_privileged_provenance();

create or replace function public.proof_challenges_protect_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.author_id is distinct from old.author_id
     or new.claim_id is distinct from old.claim_id then
    raise exception 'Proof challenge author and claim_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger proof_challenges_protect_identity
  before update on public.proof_challenges
  for each row
  execute function public.proof_challenges_protect_identity();

create or replace function public.proof_approaches_protect_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.author_id is distinct from old.author_id
     or new.challenge_id is distinct from old.challenge_id then
    raise exception 'Proof approach author and challenge_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger proof_approaches_protect_identity
  before update on public.proof_approaches
  for each row
  execute function public.proof_approaches_protect_identity();

create or replace function public.proof_participants_protect_authority()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.claim_id is distinct from old.claim_id
       or new.challenge_id is distinct from old.challenge_id
       or new.approach_id is distinct from old.approach_id
       or new.role is distinct from old.role then
      raise exception 'Proof participant identity, context, and role cannot be changed by clients';
    end if;
    if old.status = 'withdrawn' and new.status is distinct from 'withdrawn' then
      raise exception 'Withdrawn proof participation cannot be reactivated';
    end if;
    if new.status is distinct from old.status
       and new.status is distinct from 'withdrawn' then
      raise exception 'Proof participants may only withdraw their own participation status';
    end if;
  end if;
  return new;
end;
$$;

create trigger proof_participants_protect_authority
  before update on public.proof_participants
  for each row
  execute function public.proof_participants_protect_authority();

-- RLS Enablement
-- Authenticated DELETE is denied by default when no DELETE policy exists.
-- V1 does not soft-delete rows; archive is proof_claims.status = 'archived'.
alter table public.proof_claims enable row level security;
alter table public.proof_standards enable row level security;
alter table public.proof_challenges enable row level security;
alter table public.proof_approaches enable row level security;
alter table public.proof_execution_links enable row level security;
alter table public.proof_evidence enable row level security;
alter table public.proof_outcomes enable row level security;
alter table public.proof_participants enable row level security;

-- RLS Policies

-- Claims
create policy "Visible claims can be viewed"
  on public.proof_claims for select
  to authenticated
  using (public.can_view_proof_context(community_id, id));

create policy "Users create own claims"
  on public.proof_claims for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (
      community_id is null
      or exists (
        select 1 from public.community_members cm
        where cm.community_id = proof_claims.community_id
          and cm.user_id = auth.uid()
      )
    )
  );

create policy "Authors update own eligible claims"
  on public.proof_claims for update
  to authenticated
  using (
    auth.uid() = author_id
    and status in ('draft', 'active', 'resolved')
  )
  with check (
    auth.uid() = author_id
    and (
      community_id is null
      or exists (
        select 1 from public.community_members cm
        where cm.community_id = proof_claims.community_id
          and cm.user_id = auth.uid()
      )
    )
    and (
      status in ('draft', 'active', 'archived')
      or (
        status = 'resolved'
        and exists (
          select 1 from public.proof_outcomes po
          where po.claim_id = proof_claims.id
        )
      )
    )
  );

-- Standards
create policy "Standards follow claim visibility"
  on public.proof_standards for select
  to authenticated
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Authors manage standards for own claims"
  on public.proof_standards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and pc.author_id = auth.uid()
        and pc.status in ('draft', 'active')
    )
  );

create policy "Authors update standards for own claims"
  on public.proof_standards for update
  to authenticated
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and pc.author_id = auth.uid()
        and pc.status in ('draft', 'active')
    )
  )
  with check (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and pc.author_id = auth.uid()
        and pc.status in ('draft', 'active')
    )
  );

-- Challenges
create policy "Challenges follow claim visibility"
  on public.proof_challenges for select
  to authenticated
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Users challenge visible claims"
  on public.proof_challenges for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and pc.status = 'active'
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Authors update own challenges"
  on public.proof_challenges for update
  to authenticated
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and status in ('active', 'withdrawn')
  );

-- Approaches
create policy "Approaches follow claim visibility"
  on public.proof_approaches for select
  to authenticated
  using (
    exists (
      select 1 from public.proof_challenges pch
      join public.proof_claims pc on pc.id = pch.claim_id
      where pch.id = challenge_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Users propose approaches to visible challenges"
  on public.proof_approaches for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.proof_challenges pch
      join public.proof_claims pc on pc.id = pch.claim_id
      where pch.id = challenge_id
        and pch.status = 'active'
        and pc.status = 'active'
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Authors update own approaches"
  on public.proof_approaches for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Execution Links
create policy "Execution links follow claim visibility"
  on public.proof_execution_links for select
  to authenticated
  using (
    exists (
      select 1 from public.proof_approaches pa
      join public.proof_challenges pch on pch.id = pa.challenge_id
      join public.proof_claims pc on pc.id = pch.claim_id
      where pa.id = approach_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Approach authors link accessible projects or missions"
  on public.proof_execution_links for insert
  to authenticated
  with check (
    exists (
      select 1 from public.proof_approaches pa
      join public.proof_challenges pch on pch.id = pa.challenge_id
      join public.proof_claims pc on pc.id = pch.claim_id
      where pa.id = approach_id
        and pa.author_id = auth.uid()
        and pa.status is distinct from 'withdrawn'
        and pch.status = 'active'
        and pc.status = 'active'
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
    and (
      (project_id is not null and mission_id is null and public.can_access_proof_project(project_id))
      or
      (mission_id is not null and project_id is null and public.can_access_proof_mission(mission_id))
    )
  );

-- Evidence
create policy "Evidence follow claim visibility"
  on public.proof_evidence for select
  to authenticated
  using (
    (claim_id is not null and exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
    or
    (approach_id is not null and exists (
      select 1 from public.proof_approaches pa
      join public.proof_challenges pch on pch.id = pa.challenge_id
      join public.proof_claims pc on pc.id = pch.claim_id
      where pa.id = approach_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
    or
    (outcome_id is not null and exists (
      select 1 from public.proof_outcomes po
      join public.proof_claims pc on pc.id = po.claim_id
      where po.id = outcome_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
  );

create policy "Users submit evidence to visible root claims"
  on public.proof_evidence for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and not public.is_privileged_provenance(provenance)
    and (
      (claim_id is not null and exists (
        select 1 from public.proof_claims pc
        where pc.id = claim_id
          and pc.status = 'active'
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (approach_id is not null and exists (
        select 1 from public.proof_approaches pa
        join public.proof_challenges pch on pch.id = pa.challenge_id
        join public.proof_claims pc on pc.id = pch.claim_id
        where pa.id = approach_id
          and pa.status is distinct from 'withdrawn'
          and pc.status = 'active'
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (outcome_id is not null and exists (
        select 1 from public.proof_outcomes po
        join public.proof_claims pc on pc.id = po.claim_id
        where po.id = outcome_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
    )
  );

create policy "Authors update own non-privileged evidence"
  on public.proof_evidence for update
  to authenticated
  using (
    auth.uid() = author_id
    and not public.is_privileged_provenance(provenance)
  )
  with check (
    auth.uid() = author_id
    and not public.is_privileged_provenance(provenance)
    and (
      (claim_id is not null and exists (
        select 1 from public.proof_claims pc
        where pc.id = claim_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (approach_id is not null and exists (
        select 1 from public.proof_approaches pa
        join public.proof_challenges pch on pch.id = pa.challenge_id
        join public.proof_claims pc on pc.id = pch.claim_id
        where pa.id = approach_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (outcome_id is not null and exists (
        select 1 from public.proof_outcomes po
        join public.proof_claims pc on pc.id = po.claim_id
        where po.id = outcome_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
    )
  );

-- Outcomes
create policy "Outcomes follow claim visibility"
  on public.proof_outcomes for select
  to authenticated
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Authors resolve own active claims"
  on public.proof_outcomes for insert
  to authenticated
  with check (
    auth.uid() = resolved_by
    and exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and pc.author_id = auth.uid()
        and pc.status = 'active'
    )
  );

-- No UPDATE or DELETE policies on proof_outcomes for authenticated clients.

-- Participants
create policy "Participants follow claim visibility"
  on public.proof_participants for select
  to authenticated
  using (
    (claim_id is not null and exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
    or
    (challenge_id is not null and exists (
      select 1 from public.proof_challenges pch
      join public.proof_claims pc on pc.id = pch.claim_id
      where pch.id = challenge_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
    or
    (approach_id is not null and exists (
      select 1 from public.proof_approaches pa
      join public.proof_challenges pch on pch.id = pa.challenge_id
      join public.proof_claims pc on pc.id = pch.claim_id
      where pa.id = approach_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    ))
  );

create policy "Users join visible proof contexts as themselves"
  on public.proof_participants for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and role in ('contributor', 'supporter', 'observer')
    and status = 'active'
    and (
      (claim_id is not null and exists (
        select 1 from public.proof_claims pc
        where pc.id = claim_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (challenge_id is not null and exists (
        select 1 from public.proof_challenges pch
        join public.proof_claims pc on pc.id = pch.claim_id
        where pch.id = challenge_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
      or
      (approach_id is not null and exists (
        select 1 from public.proof_approaches pa
        join public.proof_challenges pch on pch.id = pa.challenge_id
        join public.proof_claims pc on pc.id = pch.claim_id
        where pa.id = approach_id
          and public.can_view_proof_context(pc.community_id, pc.id)
      ))
    )
  );

create policy "Users withdraw own participation"
  on public.proof_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and role in ('contributor', 'supporter', 'observer')
    and status in ('active', 'withdrawn')
  );

-- Grants / revokes for helpers
revoke all on function public.can_view_proof_context(uuid, uuid) from public;
revoke all on function public.can_view_proof_context(uuid, uuid) from anon;
grant execute on function public.can_view_proof_context(uuid, uuid) to authenticated;

revoke all on function public.is_privileged_provenance(public.proof_evidence_provenance) from public;
revoke all on function public.is_privileged_provenance(public.proof_evidence_provenance) from anon;
grant execute on function public.is_privileged_provenance(public.proof_evidence_provenance) to authenticated;

revoke all on function public.can_access_proof_project(uuid) from public;
revoke all on function public.can_access_proof_project(uuid) from anon;
grant execute on function public.can_access_proof_project(uuid) to authenticated;

revoke all on function public.can_access_proof_mission(uuid) from public;
revoke all on function public.can_access_proof_mission(uuid) from anon;
grant execute on function public.can_access_proof_mission(uuid) to authenticated;

-- Trigger / DEFINER functions: not directly callable by clients.
-- PostgreSQL checks EXECUTE on trigger functions at CREATE TRIGGER time, not at fire time,
-- so revoking EXECUTE from authenticated does not break legitimate trigger execution.
revoke all on function public.proof_claims_enforce_status_transition() from public;
revoke all on function public.proof_claims_enforce_status_transition() from anon;
revoke all on function public.proof_claims_enforce_status_transition() from authenticated;

revoke all on function public.proof_outcomes_before_insert_validate() from public;
revoke all on function public.proof_outcomes_before_insert_validate() from anon;
revoke all on function public.proof_outcomes_before_insert_validate() from authenticated;

revoke all on function public.proof_outcomes_after_insert_resolve_claim() from public;
revoke all on function public.proof_outcomes_after_insert_resolve_claim() from anon;
revoke all on function public.proof_outcomes_after_insert_resolve_claim() from authenticated;

revoke all on function public.proof_evidence_block_privileged_provenance() from public;
revoke all on function public.proof_evidence_block_privileged_provenance() from anon;
revoke all on function public.proof_evidence_block_privileged_provenance() from authenticated;

revoke all on function public.proof_challenges_protect_identity() from public;
revoke all on function public.proof_challenges_protect_identity() from anon;
revoke all on function public.proof_challenges_protect_identity() from authenticated;

revoke all on function public.proof_approaches_protect_identity() from public;
revoke all on function public.proof_approaches_protect_identity() from anon;
revoke all on function public.proof_approaches_protect_identity() from authenticated;

revoke all on function public.proof_participants_protect_authority() from public;
revoke all on function public.proof_participants_protect_authority() from anon;
revoke all on function public.proof_participants_protect_authority() from authenticated;
