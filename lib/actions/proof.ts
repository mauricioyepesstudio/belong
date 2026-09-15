"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import { validateProofClaimInput, type ProofClaimDraftInput } from "@/lib/core/proof";
import { requireCommunityMembership } from "@/lib/actions/_shared";
import type { ProofChallengeType, ProofEvidenceProvenance } from "@/types/database.types";

export type { ProofClaimDraftInput };

/**
 * Proof creation entry point (BELONG_PROOF_LOOP.md V1 vertical slice, item 1).
 * Creates the Claim and its Proof Standard together and publishes the claim
 * as "active" — a Claim only becomes a Proof once success criteria exist, so
 * there is no useful intermediate draft state for this entry point to leave
 * behind.
 */
export async function createProofClaim(data: ProofClaimDraftInput): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const validationError = validateProofClaimInput(data);
  if (validationError) return validationError;

  if (data.communityId) {
    const membershipError = await requireCommunityMembership(
      supabase,
      data.communityId,
      profile.id
    );
    if (membershipError) return membershipError;
  }

  const { data: claim, error } = await supabase
    .from("proof_claims")
    .insert({
      author_id: profile.id,
      title: data.title.trim(),
      body: data.body?.trim() || "",
      claim_type: data.claimType,
      community_id: data.communityId || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const criteria = data.standard.successCriteria.map((c) => c.trim()).filter(Boolean);

  const { error: standardError } = await supabase.from("proof_standards").insert({
    claim_id: claim.id,
    problem_statement: data.standard.problemStatement?.trim() || null,
    hypothesis: data.standard.hypothesis?.trim() || null,
    success_criteria: criteria,
    baseline: data.standard.baseline?.trim() || null,
    deadline: data.standard.deadline || null,
    evidence_requirements: data.standard.evidenceRequirements?.trim() || null,
    refutation_criteria: data.standard.refutationCriteria?.trim() || null,
  });

  if (standardError) {
    await supabase.from("proof_claims").delete().eq("id", claim.id);
    return { error: standardError.message };
  }

  const { error: activateError } = await supabase
    .from("proof_claims")
    .update({ status: "active" })
    .eq("id", claim.id);

  if (activateError) {
    await supabase.from("proof_claims").delete().eq("id", claim.id);
    return { error: activateError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");

  return { id: claim.id };
}

/**
 * The CHALLENGE step (BELONG_PROOF_LOOP.md V1 vertical slice, item 3-4):
 * "invite other people or organizations to support, counter, improve, test,
 * or execute" a claim. RLS (proof_challenges insert policy) already rejects
 * this against a non-active claim or one the caller can't view, so this
 * only validates what the database can't express as a constraint (a
 * non-empty body).
 */
export async function createProofChallenge(data: {
  claimId: string;
  challengeType: ProofChallengeType;
  body: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const body = data.body.trim();
  if (!body) return { error: "Say what you're challenging and why" };

  const { data: challenge, error } = await supabase
    .from("proof_challenges")
    .insert({
      claim_id: data.claimId,
      author_id: profile.id,
      challenge_type: data.challengeType,
      body,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "This Proof isn't open to challenges right now"
          : error.message,
    };
  }

  revalidatePath(`/proof/${data.claimId}`);

  return { id: challenge.id };
}

/**
 * The APPROACH step (BELONG_PROOF_LOOP.md V1 vertical slice, item 4):
 * "a concrete method proposed to address a Challenge. Multiple approaches
 * may coexist" — BELONG surfaces tradeoffs rather than forcing a single
 * winner, so this never rejects a second approach to the same challenge.
 */
export async function createProofApproach(data: {
  challengeId: string;
  title: string;
  body?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const title = data.title.trim();
  if (!title) return { error: "Give your approach a name" };

  const { data: approach, error } = await supabase
    .from("proof_approaches")
    .insert({
      challenge_id: data.challengeId,
      author_id: profile.id,
      title,
      body: data.body?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "This challenge isn't open to new approaches right now"
          : error.message,
    };
  }

  const { data: challenge } = await supabase
    .from("proof_challenges")
    .select("claim_id")
    .eq("id", data.challengeId)
    .maybeSingle();

  if (challenge?.claim_id) revalidatePath(`/proof/${challenge.claim_id}`);

  return { id: approach.id };
}

/**
 * The SHOW UP step (BELONG_PROOF_LOOP.md V1 vertical slice, item 5): routes
 * an Approach into an existing Project the caller owns or belongs to. RLS
 * (proof_execution_links insert policy, can_access_proof_project) already
 * rejects a project the caller can't access or an approach/challenge/claim
 * that isn't active, so this only translates those failures into plain
 * language and a unique-constraint hit into "already linked".
 */
export async function linkApproachToProject(data: {
  approachId: string;
  projectId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  await requireProfile();

  const { data: link, error } = await supabase
    .from("proof_execution_links")
    .insert({ approach_id: data.approachId, project_id: data.projectId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "This approach is already linked to that project" };
    return {
      error:
        error.code === "42501"
          ? "You can only show up with a project you own or belong to, on an active approach"
          : error.message,
    };
  }

  const { data: approach } = await supabase
    .from("proof_approaches")
    .select("challenge_id")
    .eq("id", data.approachId)
    .maybeSingle();

  if (approach?.challenge_id) {
    const { data: challenge } = await supabase
      .from("proof_challenges")
      .select("claim_id")
      .eq("id", approach.challenge_id)
      .maybeSingle();
    if (challenge?.claim_id) revalidatePath(`/proof/${challenge.claim_id}`);
  }

  return { id: link.id };
}

/**
 * The EVIDENCE step (BELONG_PROOF_LOOP.md V1 vertical slice, item 6),
 * scoped to a Claim. RLS (proof_evidence insert policy) already rejects
 * evidence on a non-active or invisible claim and any of the three
 * privileged provenance states; this validates the "body or a source"
 * check constraint client-side (proof_evidence_body_or_media) so the
 * error reads as guidance rather than a raw constraint-violation message.
 */
export async function submitProofEvidence(data: {
  claimId: string;
  body?: string;
  sourceUrl?: string;
  provenance: ProofEvidenceProvenance;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const body = data.body?.trim() || null;
  const sourceUrl = data.sourceUrl?.trim() || null;
  if (!body && !sourceUrl) {
    return { error: "Add a description or a source link" };
  }

  const { data: evidence, error } = await supabase
    .from("proof_evidence")
    .insert({
      claim_id: data.claimId,
      author_id: profile.id,
      body,
      source_url: sourceUrl,
      provenance: data.provenance,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "This Proof isn't open to new evidence right now"
          : error.message,
    };
  }

  revalidatePath(`/proof/${data.claimId}`);

  return { id: evidence.id };
}
