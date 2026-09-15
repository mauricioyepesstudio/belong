import { ProofClaimDetailScreen } from "@/engines/proof";
import {
  getApproachesForChallenges,
  getChallengesForClaim,
  getExecutionLinksForApproachIds,
  getProofClaim,
} from "@/lib/data/proof";
import { getUserProjects } from "@/lib/data/projects";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const claim = await getProofClaim(id);
  return { title: claim?.title ?? "Proof" };
}

export default async function ProofClaimPage({ params }: PageProps) {
  const { id } = await params;
  const claim = await getProofClaim(id);
  if (!claim) notFound();

  const challenges = await getChallengesForClaim(id);
  const approachesByChallenge = await getApproachesForChallenges(challenges.map((c) => c.id));
  const approachIds = [...approachesByChallenge.values()].flat().map((approach) => approach.id);
  const [executionLinksByApproach, userProjects] = await Promise.all([
    getExecutionLinksForApproachIds(approachIds),
    getUserProjects(),
  ]);

  return (
    <ProofClaimDetailScreen
      claim={claim}
      challenges={challenges}
      approachesByChallenge={approachesByChallenge}
      executionLinksByApproach={executionLinksByApproach}
      userProjects={userProjects}
    />
  );
}
