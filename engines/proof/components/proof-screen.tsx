import { CreateProofModal } from "@/engines/belong/components/dashboard/create-proof-modal";
import type { UserCommunity } from "@/lib/core";
import {
  deriveProofClaimStage,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
} from "@/lib/core/proof";
import type { ProofClaim } from "@/types/database.types";
import { Badge, EmptyState, EntityCard, EntityGrid, FeatureScreen } from "@/systems/design-system";
import { Target } from "lucide-react";

type ProofScreenProps = {
  claims: ProofClaim[];
  communities: UserCommunity[];
};

const STAGE_BADGE_VARIANT: Record<
  ReturnType<typeof deriveProofClaimStage>,
  "success" | "warning" | "default" | "outline"
> = {
  seeking_evidence: "success",
  resolved: "default",
  not_yet_open: "warning",
  closed: "outline",
};

export function ProofScreen({ claims, communities }: ProofScreenProps) {
  return (
    <FeatureScreen
      label="Proof"
      title="Prove it"
      description="Claims, goals, and commitments the community is holding to declared success criteria — not just applause."
      action={<CreateProofModal communities={communities} />}
    >
      {claims.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No active Proofs yet"
          description="Be the first to turn a claim, goal, or commitment into something evidence can resolve."
        />
      ) : (
        <EntityGrid>
          {claims.map((claim) => {
            const stage = deriveProofClaimStage(claim);
            return (
              <EntityCard
                key={claim.id}
                href={`/proof/${claim.id}`}
                title={claim.title}
                description={claim.body || null}
                icon={Target}
                badges={
                  <Badge variant={STAGE_BADGE_VARIANT[stage]}>{PROOF_CLAIM_STAGE_LABELS[stage]}</Badge>
                }
                meta={<Badge variant="outline">{PROOF_CLAIM_TYPE_LABELS[claim.claim_type]}</Badge>}
              />
            );
          })}
        </EntityGrid>
      )}
    </FeatureScreen>
  );
}
