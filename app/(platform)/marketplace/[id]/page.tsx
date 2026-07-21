import { ListingDetailView } from "@/engines/marketplace/components/listing-detail-view";
import { getListingById } from "@/lib/data/marketplace";
import { requireProfile } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  return { title: listing?.title ?? "Listing" };
}

export default async function MarketplaceListingPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await requireProfile();
  const listing = await getListingById(id);
  if (!listing) notFound();
  return <ListingDetailView listing={listing} currentUserId={profile.id} />;
}
