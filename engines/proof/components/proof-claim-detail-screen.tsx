import { CreateChallengeModal } from "./create-challenge-modal";
import type { ProofClaimWithMeta } from "@/lib/core/proof";
import {
  deriveProofClaimStage,
  PROOF_CHALLENGE_TYPE_LABELS,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
} from "@/lib/core/proof";
import type { ProofChallenge } from "@/types/database.types";
import { Badge, Card, CardContent, EmptyState, FeatureScreen } from "@/systems/design-system";
import { MessageSquare, Target } from "lucide-react";

type ProofClaimDetailScreenProps = {
  claim: ProofClaimWithMeta;
  challenges: ProofChallenge[];
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

function successCriteriaOf(claim: ProofClaimWithMeta): string[] {
  const raw = claim.standard?.success_criteria;
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export function ProofClaimDetailScreen({ claim, challenges }: ProofClaimDetailScreenProps) {
  const stage = deriveProofClaimStage(claim);
  const successCriteria = successCriteriaOf(claim);

  return (
    <FeatureScreen
      label={PROOF_CLAIM_TYPE_LABELS[claim.claim_type]}
      title={claim.title}
      description={claim.body || undefined}
      action={<CreateChallengeModal claimId={claim.id} disabled={claim.status !== "active"} />}
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Badge variant={STAGE_BADGE_VARIANT[stage]}>{PROOF_CLAIM_STAGE_LABELS[stage]}</Badge>
              </div>

              {claim.standard?.problem_statement && (
                <div>
                  <p className="text-label">Problem</p>
                  <p className="mt-1 text-body text-fg-secondary">{claim.standard.problem_statement}</p>
                </div>
              )}

              <div>
                <p className="text-label">Success criteria</p>
                {successCriteria.length === 0 ? (
                  <p className="mt-1 text-caption text-fg-faint">No success criteria declared.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {successCriteria.map((criterion, index) => (
                      <li
                        key={`${criterion}-${index}`}
                        className="flex items-start gap-2 text-body text-fg-secondary"
                      >
                        <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {claim.standard?.deadline && (
                <div>
                  <p className="text-label">Deadline</p>
                  <p className="mt-1 text-body text-fg-secondary">
                    {new Date(claim.standard.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <p className="text-heading mb-3 text-fg-primary">Challenges ({challenges.length})</p>
            {challenges.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No challenges yet"
                description="Be the first to test, support, counter, improve, or execute this claim."
              />
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardContent className="space-y-2 pt-4">
                      <Badge variant="outline">{PROOF_CHALLENGE_TYPE_LABELS[challenge.challenge_type]}</Badge>
                      <p className="text-body text-fg-secondary">{challenge.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-label">At a glance</p>
            <div className="flex items-center justify-between text-body">
              <span className="text-fg-faint">Challenges</span>
              <span className="font-medium text-fg-primary">{claim.challengeCount}</span>
            </div>
            <div className="flex items-center justify-between text-body">
              <span className="text-fg-faint">Participants</span>
              <span className="font-medium text-fg-primary">{claim.participantCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureScreen>
  );
}
