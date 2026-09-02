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
import { ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react";
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
      label="Resources"
      title={listing.title}
      description={formatCents(listing.price_cents)}
      action={
        <Link href="/marketplace">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to resources
          </Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar
              src={listing.seller.avatar_url ?? undefined}
              fallback={formatInitials(listing.seller.full_name)}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg-primary">
                {listing.seller.full_name ?? "Seller"}
              </p>
              <p className="text-caption text-fg-muted">
                BELONG provider · <span className="capitalize">{listing.status}</span>
              </p>
            </div>
            <Link href={`/people/${listing.seller_id}`}>
              <Button variant="secondary" size="sm">View provider</Button>
            </Link>
          </div>
          {listing.description && (
            <p className="text-body leading-relaxed text-fg-secondary">{listing.description}</p>
          )}
          <div className="rounded-2xl border border-brand/15 bg-brand/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <div>
                <p className="font-medium text-fg-primary">Provider-fulfilled resource</p>
                <p className="mt-1 text-sm leading-6 text-fg-muted">
                  The provider arranges delivery, access, or next steps directly after purchase.
                  BELONG does not currently promise an automatic file download.
                </p>
              </div>
            </div>
          </div>
          {!isOwner && listing.status === "active" && (
            <Button variant="brand" disabled={isPending} isLoading={isPending} onClick={handlePurchase}>
              <MessageSquare className="h-4 w-4" aria-hidden />
              Request for {formatCents(listing.price_cents)}
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
