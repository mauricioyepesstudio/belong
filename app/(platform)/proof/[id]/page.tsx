import { ProofClaimDetailScreen } from "@/engines/proof";
import { getChallengesForClaim, getProofClaim } from "@/lib/data/proof";
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

  return <ProofClaimDetailScreen claim={claim} challenges={challenges} />;
}
