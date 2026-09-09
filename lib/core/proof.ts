import type { ProofClaim, ProofOutcome, ProofStandard } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type ProofClaimWithMeta = ProofClaim & {
  standard: ProofStandard | null;
  outcome: ProofOutcome | null;
  challengeCount: number;
  participantCount: number;
};

/**
 * Active claims are the only claims visible outside their author/community per RLS
 * (see can_view_proof_context in 20260824000001_proof_loop_v1.sql), so this intentionally
 * does not expose draft/archived claims.
 */
export async function getActiveProofClaims(
  supabase: SupabaseServerClient,
  options?: { communityId?: string; limit?: number }
): Promise<ProofClaim[]> {
  let query = supabase
    .from("proof_claims")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (options?.communityId) {
    query = query.eq("community_id", options.communityId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getProofClaimWithMeta(
  supabase: SupabaseServerClient,
  claimId: string
): Promise<ProofClaimWithMeta | null> {
  const { data: claim } = await supabase.from("proof_claims").select("*").eq("id", claimId).single();
  if (!claim) return null;

  const [{ data: standard }, { data: outcome }, { count: challengeCount }, { count: participantCount }] =
    await Promise.all([
      supabase.from("proof_standards").select("*").eq("claim_id", claimId).maybeSingle(),
      supabase.from("proof_outcomes").select("*").eq("claim_id", claimId).maybeSingle(),
      supabase
        .from("proof_challenges")
        .select("*", { count: "exact", head: true })
        .eq("claim_id", claimId),
      supabase
        .from("proof_participants")
        .select("*", { count: "exact", head: true })
        .eq("claim_id", claimId),
    ]);

  return {
    ...claim,
    standard: standard ?? null,
    outcome: outcome ?? null,
    challengeCount: challengeCount ?? 0,
    participantCount: participantCount ?? 0,
  };
}

export type ProofClaimStage = "seeking_evidence" | "resolved" | "not_yet_open" | "closed";

/**
 * Maps DB status onto the loop stage the Proof Loop product doc (BELONG_PROOF_LOOP.md)
 * describes so UI can render "PROVE IT -> SHOW UP -> BUILD -> IMPACT" without re-deriving
 * this from raw enum values in every screen.
 */
export function deriveProofClaimStage(claim: Pick<ProofClaim, "status">): ProofClaimStage {
  switch (claim.status) {
    case "draft":
      return "not_yet_open";
    case "active":
      return "seeking_evidence";
    case "resolved":
      return "resolved";
    case "archived":
      return "closed";
  }
}
