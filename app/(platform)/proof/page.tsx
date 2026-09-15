import { ProofScreen } from "@/engines/proof";
import { getActiveProofs } from "@/lib/data/proof";
import { getUserCommunities } from "@/lib/data/communities";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Proof" };

export default async function ProofPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [claims, communities] = await Promise.all([getActiveProofs(), getUserCommunities()]);

  return <ProofScreen claims={claims} communities={communities} />;
}
