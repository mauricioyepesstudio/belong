import { createClient } from "@/lib/supabase/server";
import { getActiveProofClaims } from "@/lib/core/proof";

export type { ProofClaimDraftInput, ProofClaimStage } from "@/lib/core/proof";
export {
  deriveProofClaimStage,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
} from "@/lib/core/proof";

export async function getActiveProofs(limit = 20) {
  const supabase = await createClient();
  return getActiveProofClaims(supabase, { limit });
}
