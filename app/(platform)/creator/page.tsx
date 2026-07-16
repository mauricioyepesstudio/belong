import { CreatorScreen } from "@/engines/billing";
import { getCreatorStats } from "@/lib/data/marketplace";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Creator" };

export default async function CreatorPage() {
  const stats = await getCreatorStats();
  if (!stats.profile) redirect("/login");

  return (
    <CreatorScreen
      profile={stats.profile}
      totalEarnings={stats.totalEarnings}
      activeSubscribers={stats.activeSubscribers}
      activeListings={stats.activeListings}
      payments={stats.payments}
    />
  );
}
