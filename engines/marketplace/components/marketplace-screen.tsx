"use client";

import {
  archiveListing,
  createListing,
  publishListing,
} from "@/lib/actions/marketplace";
import { createMarketplaceCheckout } from "@/lib/actions/billing";
import { formatCents } from "@/engines/billing";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  EntityCard,
  FeatureScreen,
  Input,
  Label,
  Modal,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { MIN_LISTING_CENTS } from "@/lib/stripe/config";
import type { ListingWithSeller } from "@/lib/data/marketplace";
import type { MarketplaceListing } from "@/types/database.types";
import { Plus, ShoppingBag, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type MarketplaceScreenProps = {
  listings: ListingWithSeller[];
  myListings: MarketplaceListing[];
  currentUserId: string;
};

export function MarketplaceScreen({
  listings,
  myListings,
  currentUserId,
}: MarketplaceScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("browse");
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const myActive = useMemo(
    () => myListings.filter((l) => l.status === "active" || l.status === "draft"),
    [myListings]
  );

  const handlePurchase = (listingId: string) => {
    startTransition(async () => {
      const result = await createMarketplaceCheckout(listingId);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  const handleCreate = (formData: FormData) => {
    const price = parseFloat(formData.get("price") as string);
    if (Number.isNaN(price) || price <= 0) {
      toast("Enter a valid price", "error");
      return;
    }
    const cents = Math.round(price * 100);
    if (cents < MIN_LISTING_CENTS) {
      toast(`Minimum price is $${(MIN_LISTING_CENTS / 100).toFixed(2)}`, "error");
      return;
    }

    startTransition(async () => {
      const result = await createListing({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priceCents: cents,
        publish: formData.get("publish") === "on",
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Listing created", "success");
        setCreateOpen(false);
        router.refresh();
      }
    });
  };

  const handlePublish = (listingId: string) => {
    startTransition(async () => {
      const result = await publishListing(listingId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Listing published", "success");
        router.refresh();
      }
    });
  };

  const handleArchive = (listingId: string) => {
    startTransition(async () => {
      const result = await archiveListing(listingId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Listing archived", "success");
        router.refresh();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Marketplace"
        title="Creator marketplace"
        description="Buy and sell digital goods, templates, and resources from builders."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New listing
          </Button>
        }
        toolbar={
          <Tabs
            className="w-fit"
            tabs={[
              { id: "browse", label: "Browse", count: listings.length },
              { id: "selling", label: "My listings", count: myActive.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      >
        {tab === "browse" ? (
          listings.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No listings yet"
              description="Be the first to sell something on the BELONG marketplace."
              action={{ label: "Create listing", onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <EntityCard
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  title={listing.title}
                  description={listing.description}
                  iconNode={
                    <Avatar
                      src={listing.seller?.avatar_url ?? undefined}
                      fallback={formatInitials(listing.seller?.full_name)}
                      size="sm"
                    />
                  }
                  meta={
                    <p className="text-sm text-fg-muted">
                      {listing.seller?.full_name ?? "Seller"}
                    </p>
                  }
                  footer={
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-brand">
                        {formatCents(listing.price_cents)}
                      </p>
                      {listing.seller_id !== currentUserId && (
                        <Button
                          size="sm"
                          variant="brand"
                          disabled={isPending}
                          onClick={() => handlePurchase(listing.id)}
                        >
                          Buy
                        </Button>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )
        ) : myActive.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No listings yet"
            description="Create a listing to start selling to the BELONG community."
            action={{ label: "Create listing", onClick: () => setCreateOpen(true) }}
          />
        ) : (
          <div className="space-y-3">
            {myActive.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-fg-primary">{listing.title}</h3>
                      <Badge
                        variant={
                          listing.status === "active"
                            ? "success"
                            : listing.status === "sold"
                              ? "outline"
                              : "warning"
                        }
                      >
                        {listing.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-brand">{formatCents(listing.price_cents)}</p>
                  </div>
                  <div className="flex gap-2">
                    {listing.status === "draft" && (
                      <Button
                        size="sm"
                        variant="brand"
                        disabled={isPending}
                        onClick={() => handlePublish(listing.id)}
                      >
                        Publish
                      </Button>
                    )}
                    {listing.status === "active" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleArchive(listing.id)}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </FeatureScreen>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New listing"
        description="Sell a digital product to the community."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Product name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What are you selling?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={MIN_LISTING_CENTS / 100}
              step="0.01"
              required
              placeholder="9.99"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-secondary">
            <input type="checkbox" name="publish" className="rounded border-border" />
            Publish immediately (requires payout setup)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create listing
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
