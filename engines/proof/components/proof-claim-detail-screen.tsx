import { CreateApproachModal } from "./create-approach-modal";
import { CreateChallengeModal } from "./create-challenge-modal";
import { ResolveProofModal } from "./resolve-proof-modal";
import { ShareProofButton } from "./share-proof-button";
import { ShowUpModal } from "./show-up-modal";
import { SubmitEvidenceModal } from "./submit-evidence-modal";
import type { ProjectWithMemberCount } from "@/lib/core";
import type { ProofClaimWithMeta, ProofExecutionLinkWithProjectName } from "@/lib/core/proof";
import {
  deriveProofClaimStage,
  PROOF_CHALLENGE_TYPE_LABELS,
  PROOF_CLAIM_STAGE_LABELS,
  PROOF_CLAIM_TYPE_LABELS,
  PROOF_EVIDENCE_PROVENANCE_LABELS,
  PROOF_RESOLUTION_LABELS,
} from "@/lib/core/proof";
import type { ProofApproach, ProofChallenge, ProofEvidence } from "@/types/database.types";
import { Badge, Button, Card, CardContent, EmptyState, FeatureScreen } from "@/systems/design-system";
import {
  CheckCircle2,
  FileCheck,
  Lightbulb,
  Link as LinkIcon,
  LogIn,
  MessageSquare,
  Rocket,
  Target,
} from "lucide-react";
import Link from "next/link";

type ProofClaimDetailScreenProps = {
  claim: ProofClaimWithMeta;
  challenges: ProofChallenge[];
  approachesByChallenge: Map<string, ProofApproach[]>;
  executionLinksByApproach: Map<string, ProofExecutionLinkWithProjectName[]>;
  userProjects: ProjectWithMemberCount[];
  evidence: ProofEvidence[];
  /**
   * Null for the anonymous visitor a shared /proof/[id] link is meant to
   * reach (see PROOF_LOOP_SHARE_GAP.md) -- this screen renders the same
   * read-only content either way and swaps every action control for a
   * single sign-in prompt rather than letting an anonymous submit hit
   * requireProfile()'s "Unauthorized" in lib/actions/proof.ts.
   */
  currentUserId: string | null;
};

function SignInToParticipate({ claimId }: { claimId: string }) {
  return (
    <Link href={`/login?next=/proof/${claimId}`}>
      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Sign in to participate
      </Button>
    </Link>
  );
}

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

export function ProofClaimDetailScreen({
  claim,
  challenges,
  approachesByChallenge,
  executionLinksByApproach,
  userProjects,
  evidence,
  currentUserId,
}: ProofClaimDetailScreenProps) {
  const stage = deriveProofClaimStage(claim);
  const successCriteria = successCriteriaOf(claim);
  const isAuthor = currentUserId === claim.author_id;

  return (
    <FeatureScreen
      label={PROOF_CLAIM_TYPE_LABELS[claim.claim_type]}
      title={claim.title}
      description={claim.body || undefined}
      action={
        <div className="flex flex-wrap gap-2">
          <ShareProofButton claimId={claim.id} />
          {currentUserId ? (
            <>
              <CreateChallengeModal claimId={claim.id} disabled={claim.status !== "active"} />
              {isAuthor && claim.status === "active" && <ResolveProofModal claimId={claim.id} />}
            </>
          ) : (
            <SignInToParticipate claimId={claim.id} />
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {claim.outcome && (
            <Card className="border-brand/20 bg-brand/[0.04]">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand" aria-hidden />
                  <p className="text-label text-brand">Outcome</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{PROOF_RESOLUTION_LABELS[claim.outcome.resolution]}</Badge>
                  {claim.outcome.position_updated && (
                    <Badge variant="outline">Position updated after evidence</Badge>
                  )}
                </div>
                <p className="text-body text-fg-secondary">{claim.outcome.summary}</p>
                {claim.outcome.uncertainty_notes && (
                  <div>
                    <p className="text-label">Uncertainty</p>
                    <p className="mt-1 text-caption text-fg-faint">{claim.outcome.uncertainty_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-heading text-fg-primary">Evidence ({evidence.length})</p>
              {currentUserId && (
                <SubmitEvidenceModal claimId={claim.id} disabled={claim.status !== "active"} />
              )}
            </div>
            {evidence.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="No evidence yet"
                description="Evidence toward the success criteria will show up here as it comes in."
              />
            ) : (
              <div className="space-y-3">
                {evidence.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="space-y-2 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === "disputed" ? "warning" : "outline"}>
                          {PROOF_EVIDENCE_PROVENANCE_LABELS[item.provenance]}
                        </Badge>
                        {item.status !== "active" && (
                          <Badge variant="warning" className="capitalize">
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      {item.body && <p className="text-body text-fg-secondary">{item.body}</p>}
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-caption text-brand hover:underline"
                        >
                          <LinkIcon className="h-3.5 w-3.5" aria-hidden />
                          {item.source_url}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
                {challenges.map((challenge) => {
                  const approaches = approachesByChallenge.get(challenge.id) ?? [];
                  return (
                    <Card key={challenge.id}>
                      <CardContent className="space-y-3 pt-4">
                        <Badge variant="outline">{PROOF_CHALLENGE_TYPE_LABELS[challenge.challenge_type]}</Badge>
                        <p className="text-body text-fg-secondary">{challenge.body}</p>

                        {approaches.length > 0 && (
                          <ul className="space-y-3 border-t border-border-subtle pt-3">
                            {approaches.map((approach) => {
                              const links = executionLinksByApproach.get(approach.id) ?? [];
                              return (
                                <li key={approach.id} className="flex items-start gap-2">
                                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                                  <div className="flex-1 space-y-2">
                                    <p className="text-body font-medium text-fg-primary">{approach.title}</p>
                                    {approach.body && (
                                      <p className="text-caption text-fg-faint">{approach.body}</p>
                                    )}
                                    {links.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {links.map((link) => (
                                          <Badge key={link.id} variant="success" className="gap-1">
                                            <Rocket className="h-3 w-3" aria-hidden />
                                            {link.projectName ?? "Linked project"}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    {currentUserId && approach.status !== "withdrawn" && (
                                      <ShowUpModal approachId={approach.id} projects={userProjects} />
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {currentUserId && challenge.status === "active" && (
                          <CreateApproachModal challengeId={challenge.id} />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
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
