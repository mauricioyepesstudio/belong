-- BELONG: public read access for non-community Proofs (anon role)
-- Migration: 20260917000001_proof_public_anon_read
--
-- DRAFT -- NOT YET APPLIED to any database. This needs an explicit product
-- sign-off (is BELONG comfortable with a Proof's content being readable by
-- anyone with the link, including search engines and link-preview
-- crawlers, whenever it isn't posted inside a community?) before someone
-- runs `supabase db push` against the real project. See the commit this
-- migration ships with for the accompanying app-layer half of the fix.
--
-- Why: BELONG_PROOF_LOOP.md's SHARE step (V1 vertical slice items 10-11)
-- promises a "shareable deep link" that can "export the result to the
-- wider internet as a distribution loop back into BELONG." Today that
-- link cannot do that for anyone who isn't already signed in, on two
-- independent layers:
--   1. Next.js middleware treats /proof/[id] as a protected platform route
--      and redirects a logged-out visitor straight to /login before the
--      page ever renders (fixed in the same commit, in
--      lib/supabase/middleware.ts -- see PROOF_LOOP_SHARE_GAP.md).
--   2. Even past that redirect, every proof_* SELECT policy in
--      20260824000001_proof_loop_v1.sql grants `to authenticated` only.
--      An anon request -- and, crucially, the unauthenticated bot every
--      chat app and social network uses to unfurl a shared link into a
--      preview card -- gets an empty result, so the "distribution loop"
--      has no working link-preview and no working page for a non-member
--      to land on.
--
-- This migration is that second layer's fix, and only that layer: it adds
-- no new visibility rule. Each policy below is the existing "follows claim
-- visibility" SELECT policy for that table, granted `to anon` instead of
-- `to authenticated`, reusing public.can_view_proof_context(community_id,
-- id) unchanged. For an anonymous request auth.uid() is null, so that
-- function's community-membership and claim-authorship branches are
-- always false -- leaving only its `p_community_id is null` branch true.
-- That is exactly the same "a claim posted outside any community is
-- visible platform-wide" rule that already applies to every authenticated
-- user today; a claim posted inside a community stays exactly as private
-- to anon as it already is to a logged-in non-member of that community.
--
-- Scope is strictly read: no insert/update/delete policy is added for
-- anon on any of these tables, and every mutating server action in
-- lib/actions/proof.ts already calls requireProfile() on its own,
-- independent of page-level or RLS gating -- so this cannot be used to
-- write as an anonymous visitor.

grant select on public.proof_claims to anon;
grant select on public.proof_standards to anon;
grant select on public.proof_challenges to anon;
grant select on public.proof_approaches to anon;
grant select on public.proof_execution_links to anon;
grant select on public.proof_evidence to anon;
grant select on public.proof_outcomes to anon;
grant select on public.proof_participants to anon;

create policy "Anon can view non-community claims"
  on public.proof_claims for select
  to anon
  using (public.can_view_proof_context(community_id, id));

create policy "Anon can view standards for visible claims"
  on public.proof_standards for select
  to anon
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Anon can view challenges for visible claims"
  on public.proof_challenges for select
  to anon
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Anon can view approaches for visible challenges"
  on public.proof_approaches for select
  to anon
  using (
    exists (
      select 1 from public.proof_challenges pch
      join public.proof_claims pc on pc.id = pch.claim_id
      where pch.id = challenge_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Anon can view execution links for visible approaches"
  on public.proof_execution_links for select
  to anon
  using (
    exists (
      select 1 from public.proof_approaches pa
      join public.proof_challenges pch on pch.id = pa.challenge_id
      join public.proof_claims pc on pc.id = pch.claim_id
      where pa.id = approach_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Anon can view evidence for visible claims"
  on public.proof_evidence for select
  to anon
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

create policy "Anon can view outcomes for visible claims"
  on public.proof_outcomes for select
  to anon
  using (
    exists (
      select 1 from public.proof_claims pc
      where pc.id = claim_id
        and public.can_view_proof_context(pc.community_id, pc.id)
    )
  );

create policy "Anon can view participants for visible claims"
  on public.proof_participants for select
  to anon
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
