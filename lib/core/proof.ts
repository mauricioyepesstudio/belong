import type {
  ProofChallenge,
  ProofChallengeType,
  ProofClaim,
  ProofClaimType,
  ProofOutcome,
  ProofStandard,
} from "@/types/database.types";
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

/**
 * Challenges follow claim visibility per RLS (can_view_proof_context), so
 * this returns [] rather than erroring when the caller can't see the claim.
 */
export async function getProofChallenges(
  supabase: SupabaseServerClient,
  claimId: string
): Promise<ProofChallenge[]> {
  const { data } = await supabase
    .from("proof_challenges")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type ProofClaimDraftInput = {
  title: string;
  claimType: ProofClaimType;
  body?: string;
  communityId?: string;
  standard: {
    problemStatement?: string;
    hypothesis?: string;
    successCriteria: string[];
    baseline?: string;
    deadline?: string;
    evidenceRequirements?: string;
    refutationCriteria?: string;
  };
};

/**
 * Validates the Proof creation entry point (BELONG_PROOF_LOOP.md V1 vertical
 * slice, steps 1-2: "structured claim/goal and success criteria"). A claim
 * without at least one declared success criterion is not yet a Proof per the
 * protocol ("success criteria should be declared before results whenever
 * practical"), so creation is rejected rather than allowed as an empty draft.
 */
export function validateProofClaimInput(
  data: ProofClaimDraftInput
): { error: string } | null {
  if (!data.title.trim()) return { error: "Title is required" };

  const criteria = data.standard.successCriteria.map((c) => c.trim()).filter(Boolean);
  if (criteria.length === 0) {
    return { error: "At least one success criterion is required" };
  }

  if (data.standard.deadline) {
    const parsed = new Date(data.standard.deadline);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid deadline" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) return { error: "Deadline cannot be in the past" };
  }

  return null;
}

export const PROOF_CLAIM_TYPE_LABELS: Record<ProofClaimType, string> = {
  goal: "Goal",
  commitment: "Commitment",
  capability: "Capability",
  solution: "Proposed solution",
  predictive: "Prediction",
  causal: "Causal claim",
  factual: "Factual claim",
  normative: "Normative / values claim",
};

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

export const PROOF_CLAIM_STAGE_LABELS: Record<ProofClaimStage, string> = {
  not_yet_open: "Not yet open",
  seeking_evidence: "Seeking evidence",
  resolved: "Resolved",
  closed: "Closed",
};

/**
 * Labels match the product verbs in BELONG_PROOF_LOOP.md ("CHALLENGE —
 * propose a competing or stronger test/approach") rather than raw enum
 * names, since these render directly in the Challenge form.
 */
export const PROOF_CHALLENGE_TYPE_LABELS: Record<ProofChallengeType, string> = {
  test: "Test it",
  support: "Support with evidence",
  counter: "Counter it",
  improve: "Propose an improvement",
  execute: "Execute it",
};
