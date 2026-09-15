"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import { validateProofClaimInput, type ProofClaimDraftInput } from "@/lib/core/proof";
import { requireCommunityMembership } from "@/lib/actions/_shared";

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
