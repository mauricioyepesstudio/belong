import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveProofClaims,
  getExecutionLinksForApproaches,
  getProofApproachesForChallenges,
  getProofChallenges,
  getProofClaimWithMeta,
} from "@/lib/core/proof";

export type {
  ProofClaimDraftInput,
  ProofClaimStage,
  ProofClaimWithMeta,
  ProofExecutionLinkWithProjectName,
} from "@/lib/core/proof";
export {
  deriveProofClaimStage,
  PROOF_CHALLENGE_TYPE_LABELS,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
} from "@/lib/core/proof";

export async function getActiveProofs(limit = 20) {
  const supabase = await createClient();
  return getActiveProofClaims(supabase, { limit });
}

export const getProofClaim = cache(async (claimId: string) => {
  const supabase = await createClient();
  return getProofClaimWithMeta(supabase, claimId);
});

export async function getChallengesForClaim(claimId: string) {
  const supabase = await createClient();
  return getProofChallenges(supabase, claimId);
}

export async function getApproachesForChallenges(challengeIds: string[]) {
  const supabase = await createClient();
  return getProofApproachesForChallenges(supabase, challengeIds);
}

export async function getExecutionLinksForApproachIds(approachIds: string[]) {
  const supabase = await createClient();
  return getExecutionLinksForApproaches(supabase, approachIds);
}
