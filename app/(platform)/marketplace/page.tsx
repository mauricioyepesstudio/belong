import { MarketplaceScreen } from "@/engines/marketplace";
import { getActiveListings, getMyListings } from "@/lib/data/marketplace";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources" };

export default async function MarketplacePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [listings, myListings] = await Promise.all([
    getActiveListings(),
    getMyListings(),
  ]);

  return (
    <MarketplaceScreen
      listings={listings}
      myListings={myListings}
      currentUserId={profile.id}
    />
  );
}
