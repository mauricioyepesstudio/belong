"use client";

import { createMarketplaceCheckout } from "@/lib/actions/billing";
import type { ListingWithSeller } from "@/lib/data/marketplace";
import { formatCents } from "@/engines/billing";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

export function ListingDetailView({
  listing,
  currentUserId,
}: {
  listing: ListingWithSeller;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isOwner = listing.seller_id === currentUserId;

  const handlePurchase = () => {
    startTransition(async () => {
      const result = await createMarketplaceCheckout(listing.id);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <FeatureScreen
      label="Marketplace"
      title={listing.title}
      description={formatCents(listing.price_cents)}
      action={
        <Link href="/marketplace">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to marketplace
          </Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center gap-3">
            <Avatar
              src={listing.seller.avatar_url ?? undefined}
              fallback={formatInitials(listing.seller.full_name)}
            />
            <div>
              <p className="font-medium text-fg-primary">
                {listing.seller.full_name ?? "Seller"}
              </p>
              <p className="text-caption text-fg-muted capitalize">{listing.status}</p>
            </div>
          </div>
          {listing.description && (
            <p className="text-body leading-relaxed text-fg-secondary">{listing.description}</p>
          )}
          {!isOwner && listing.status === "active" && (
            <Button variant="brand" disabled={isPending} isLoading={isPending} onClick={handlePurchase}>
              Buy for {formatCents(listing.price_cents)}
            </Button>
          )}
          {!isOwner && listing.status !== "active" && (
            <p className="text-sm text-fg-muted">
              This listing is no longer available for purchase.
            </p>
          )}
        </CardContent>
      </Card>
    </FeatureScreen>
  );
}
