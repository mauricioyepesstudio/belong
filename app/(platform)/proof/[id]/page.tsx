import { ProofClaimDetailScreen } from "@/engines/proof";
import {
  getApproachesForChallenges,
  getChallengesForClaim,
  getEvidenceForClaimId,
  getExecutionLinksForApproachIds,
  getProofClaim,
  proofShareDescription,
} from "@/lib/data/proof";
import { getUserProjects } from "@/lib/data/projects";
import { getCurrentProfile } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * A shared /proof/[id] link is meant to be "exported to the wider
 * internet" (BELONG_PROOF_LOOP.md V1 item 10-11), which means the
 * unauthenticated crawler every chat app and social network uses to
 * unfurl a link into a preview card is this function's real audience as
 * often as a human is. A bare title with no description/OG/Twitter tags
 * unfurls as a dead gray box, which kills the distribution loop before it
 * starts -- see PROOF_LOOP_SHARE_GAP.md.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const claim = await getProofClaim(id);
  if (!claim) return { title: "Proof" };

  const title = `${claim.title} · BELONG Proof`;
  const description = proofShareDescription(claim);

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProofClaimPage({ params }: PageProps) {
  const { id } = await params;
  const claim = await getProofClaim(id);
  if (!claim) notFound();

  // Signed-in and anonymous visitors both reach this page (see
  // PROOF_LOOP_SHARE_GAP.md): a shared link has to actually show the
  // Proof to someone who isn't a member yet, not just to the author.
  // ProofClaimDetailScreen renders a read-only view with a sign-in
  // prompt in place of the action buttons when currentUserId is null.
  const profile = await getCurrentProfile();
  const challenges = await getChallengesForClaim(id);
  const approachesByChallenge = await getApproachesForChallenges(challenges.map((c) => c.id));
  const approachIds = [...approachesByChallenge.values()].flat().map((approach) => approach.id);
  const [executionLinksByApproach, userProjects, evidence] = await Promise.all([
    getExecutionLinksForApproachIds(approachIds),
    profile ? getUserProjects() : Promise.resolve([]),
    getEvidenceForClaimId(id),
  ]);

  return (
    <ProofClaimDetailScreen
      claim={claim}
      challenges={challenges}
      approachesByChallenge={approachesByChallenge}
      executionLinksByApproach={executionLinksByApproach}
      userProjects={userProjects}
      evidence={evidence}
      currentUserId={profile?.id ?? null}
    />
  );
}
