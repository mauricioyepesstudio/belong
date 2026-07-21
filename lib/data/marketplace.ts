import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { MarketplaceListing, UserProfile } from "@/types/database.types";

export type ListingWithSeller = MarketplaceListing & {
  seller: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
};

export async function getActiveListings(): Promise<ListingWithSeller[]> {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (!listings?.length) return [];

  const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
  const { data: sellers } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", sellerIds);

  const sellerMap = new Map(sellers?.map((s) => [s.id, s]) ?? []);

  return listings.map((listing) => ({
    ...listing,
    seller: sellerMap.get(listing.seller_id) ?? {
      id: listing.seller_id,
      full_name: null,
      avatar_url: null,
    },
  }));
}

export async function getMyListings(): Promise<MarketplaceListing[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getListingById(id: string): Promise<ListingWithSeller | null> {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!listing) return null;

  const { data: seller } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("id", listing.seller_id)
    .maybeSingle();

  return {
    ...listing,
    seller: seller ?? {
      id: listing.seller_id,
      full_name: null,
      avatar_url: null,
    },
  };
}

export async function getCreatorStats() {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: ownedCommunities } = await supabase
    .from("communities")
    .select("id")
    .eq("owner_id", profile.id);

  const communityIds = ownedCommunities?.map((c) => c.id) ?? [];

  const [paymentsResult, subscriptionsResult, listingCountResult] = await Promise.all([
    supabase
      .from("payments")
      .select("amount_cents, platform_fee_cents, payment_type, created_at")
      .eq("recipient_id", profile.id)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(20),
    communityIds.length > 0
      ? supabase
          .from("subscriptions")
          .select("id, status")
          .eq("subscription_type", "community")
          .in("community_id", communityIds)
      : Promise.resolve({ data: [] as { id: string; status: string }[] }),
    supabase
      .from("marketplace_listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", profile.id)
      .eq("status", "active"),
  ]);

  const payments = paymentsResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];

  const totalEarnings = payments.reduce(
    (sum, p) => sum + p.amount_cents - (p.platform_fee_cents ?? 0),
    0
  );

  const activeSubscribers = subscriptions.filter((s) => s.status === "active").length;

  return {
    profile,
    payments,
    totalEarnings,
    activeSubscribers,
    activeListings: listingCountResult.count ?? 0,
  };
}
