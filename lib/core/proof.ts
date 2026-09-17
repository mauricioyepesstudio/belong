import type {
  ProofApproach,
  ProofChallenge,
  ProofChallengeType,
  ProofClaim,
  ProofClaimType,
  ProofEvidence,
  ProofEvidenceProvenance,
  ProofExecutionLink,
  ProofOutcome,
  ProofResolution,
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

/**
 * Approaches follow challenge visibility per RLS, and grouping is by
 * challenge_id so a caller can render each challenge's approach list without
 * one query per challenge.
 */
export async function getProofApproachesForChallenges(
  supabase: SupabaseServerClient,
  challengeIds: string[]
): Promise<Map<string, ProofApproach[]>> {
  const grouped = new Map<string, ProofApproach[]>();
  if (challengeIds.length === 0) return grouped;

  const { data } = await supabase
    .from("proof_approaches")
    .select("*")
    .in("challenge_id", challengeIds)
    .order("created_at", { ascending: false });

  for (const approach of data ?? []) {
    const existing = grouped.get(approach.challenge_id) ?? [];
    existing.push(approach);
    grouped.set(approach.challenge_id, existing);
  }
  return grouped;
}

export type ProofExecutionLinkWithProjectName = ProofExecutionLink & { projectName: string | null };

/**
 * The SHOW UP step (BELONG_PROOF_LOOP.md V1 vertical slice, item 5): "route
 * relevant people ... toward concrete roles" by linking an Approach to an
 * existing Project. Links follow approach visibility per RLS, grouped by
 * approach_id; project names are a second query rather than an embedded
 * select since this hand-maintained schema (see TECHNICAL_DEBT.md TD-09)
 * has no Relationships metadata for typed joins.
 */
export async function getExecutionLinksForApproaches(
  supabase: SupabaseServerClient,
  approachIds: string[]
): Promise<Map<string, ProofExecutionLinkWithProjectName[]>> {
  const grouped = new Map<string, ProofExecutionLinkWithProjectName[]>();
  if (approachIds.length === 0) return grouped;

  const { data: links } = await supabase
    .from("proof_execution_links")
    .select("*")
    .in("approach_id", approachIds);

  if (!links || links.length === 0) return grouped;

  const projectIds = links
    .map((link) => link.project_id)
    .filter((id): id is string => Boolean(id));

  const projectNames = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
    for (const project of projects ?? []) projectNames.set(project.id, project.name);
  }

  for (const link of links) {
    const withName: ProofExecutionLinkWithProjectName = {
      ...link,
      projectName: link.project_id ? projectNames.get(link.project_id) ?? null : null,
    };
    const existing = grouped.get(link.approach_id) ?? [];
    existing.push(withName);
    grouped.set(link.approach_id, existing);
  }
  return grouped;
}

/**
 * The EVIDENCE step (BELONG_PROOF_LOOP.md V1 vertical slice, item 6:
 * "evidence timeline"), scoped to evidence attached directly to a Claim
 * (approach- and outcome-scoped evidence are separate surfaces for a later
 * slice). Follows claim visibility per RLS.
 */
export async function getEvidenceForClaim(
  supabase: SupabaseServerClient,
  claimId: string
): Promise<ProofEvidence[]> {
  const { data } = await supabase
    .from("proof_evidence")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Excludes the three provenance states the DB trigger reserves for a
 * privileged, non-client path (organization/multi-party/independent
 * review — see is_privileged_provenance in the migration): offering them
 * here would just let a submission fail with a raw Postgres exception.
 */
export const CLIENT_PROOF_EVIDENCE_PROVENANCE: ProofEvidenceProvenance[] = [
  "self_reported",
  "participant_recorded",
  "owner_confirmed",
  "external_source_linked",
];

/**
 * The OUTCOME step (BELONG_PROOF_LOOP.md V1 vertical slice, item 7).
 * Labels per BELONG_PROOF_PROTOCOL.md's result-states list — "not
 * supported" is explicitly framed there as not a moral judgment, so the
 * label stays neutral rather than reading as a verdict.
 */
export const PROOF_RESOLUTION_LABELS: Record<ProofResolution, string> = {
  supported: "Supported",
  partially_supported: "Partially supported",
  mixed: "Mixed",
  not_supported: "Not supported",
  inconclusive: "Inconclusive",
  failed_to_complete: "Failed to complete",
  withdrawn: "Withdrawn",
};

export const PROOF_EVIDENCE_PROVENANCE_LABELS: Record<ProofEvidenceProvenance, string> = {
  self_reported: "Self-reported",
  participant_recorded: "Recorded by a participant",
  owner_confirmed: "Confirmed by the claim owner",
  organization_confirmed: "Confirmed by an organization",
  multi_party_confirmed: "Confirmed by multiple parties",
  external_source_linked: "Linked to an external source",
  independently_reviewed: "Independently reviewed",
};

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
 * The SHARE step's social-preview copy (BELONG_PROOF_LOOP.md V1 item 10):
 * what a /proof/[id] link should say once it unfurls outside the app,
 * where there's no surrounding UI to give the claim context.
 */
export function proofShareDescription(
  claim: Pick<ProofClaimWithMeta, "body" | "claim_type" | "status">
): string {
  const body = claim.body?.trim();
  if (body) return body.length > 200 ? `${body.slice(0, 197)}...` : body;

  const typeLabel = PROOF_CLAIM_TYPE_LABELS[claim.claim_type].toLowerCase();
  const stageLabel = PROOF_CLAIM_STAGE_LABELS[deriveProofClaimStage(claim)].toLowerCase();
  return `A ${typeLabel} on BELONG, ${stageLabel}. See the evidence and show up.`;
}

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
