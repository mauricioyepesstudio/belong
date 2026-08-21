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
import {
  deriveResourceCategory,
  deriveResourceType,
  RESOURCE_CATEGORIES,
  resourceCategoryLabel,
  type ResourceCategory,
} from "@/lib/data/resource-category";
import type { MarketplaceListing } from "@/types/database.types";
import {
  Briefcase,
  Compass,
  GraduationCap,
  Plus,
  Rocket,
  ShoppingBag,
  Store,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type MarketplaceScreenProps = {
  listings: ListingWithSeller[];
  myListings: MarketplaceListing[];
  currentUserId: string;
};

const CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  tools: Wrench,
  guidance: Compass,
  learning: GraduationCap,
  funding: Rocket,
  services: Briefcase,
};

export function MarketplaceScreen({
  listings,
  myListings,
  currentUserId,
}: MarketplaceScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("discover");
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | "all">("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<"all" | "product" | "service">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [offerKind, setOfferKind] = useState<"product" | "service">("product");
  const [isPending, startTransition] = useTransition();

  const myActive = useMemo(
    () => myListings.filter((l) => l.status === "active" || l.status === "draft"),
    [myListings]
  );

  const categorizedListings = useMemo(
    () =>
      listings.map((listing) => ({
        listing,
        category: deriveResourceCategory(listing),
        resourceType: deriveResourceType(listing),
      })),
    [listings]
  );

  const categoryTabs = useMemo(() => {
    const counts = new Map<ResourceCategory, number>();
    for (const { category } of categorizedListings) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [
      { id: "all" as const, label: "All", count: categorizedListings.length },
      ...RESOURCE_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        count: counts.get(c.id) ?? 0,
      })),
    ];
  }, [categorizedListings]);

  const filteredListings = useMemo(
    () =>
      categorizedListings.filter(({ category, resourceType }) =>
        (categoryFilter === "all" || category === categoryFilter) &&
        (resourceTypeFilter === "all" || resourceType === resourceTypeFilter)
      ),
    [categorizedListings, categoryFilter, resourceTypeFilter]
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
        toast("Resource created", "success");
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
        toast("Resource published", "success");
        router.refresh();
      }
    });
  };

  const handleArchive = (listingId: string) => {
    startTransition(async () => {
      const result = await archiveListing(listingId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Resource archived", "success");
        router.refresh();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Marketplace"
        title="Resources"
        description="Discover services, tools, guidance, and support from builders in your network."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Offer a resource
          </Button>
        }
        toolbar={
          <Tabs
            className="w-fit"
            tabs={[
              { id: "discover", label: "Discover", count: listings.length },
              { id: "mine", label: "My resources", count: myActive.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      >
        {tab === "discover" ? (
          listings.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-brand" aria-hidden />
              <h2 className="mt-3 text-lg font-semibold text-fg-primary">Be the first to offer something to the BELONG community.</h2>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button onClick={() => { setOfferKind("product"); setCreateOpen(true); }}>Offer a Product</Button>
                <Button variant="secondary" onClick={() => { setOfferKind("service"); setCreateOpen(true); }}>Offer a Service</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <Tabs
                tabs={[
                  { id: "all", label: "All", count: categorizedListings.length },
                  { id: "product", label: "Products", count: categorizedListings.filter((item) => item.resourceType === "product").length },
                  { id: "service", label: "Services", count: categorizedListings.filter((item) => item.resourceType === "service").length },
                ]}
                active={resourceTypeFilter}
                onChange={(id) => setResourceTypeFilter(id as "all" | "product" | "service")}
                className="w-fit"
              />
              <Tabs
                tabs={categoryTabs}
                active={categoryFilter}
                onChange={(id) => setCategoryFilter(id as ResourceCategory | "all")}
                className="w-fit flex-wrap"
              />
              {filteredListings.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No resources in this category"
                  description="Try a different category, or check back later."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredListings.map(({ listing, category, resourceType }) => (
                    <ResourceCard
                      key={listing.id}
                      listing={listing}
                      category={category}
                      resourceType={resourceType}
                      isOwner={listing.seller_id === currentUserId}
                      isPending={isPending}
                      onPurchase={() => handlePurchase(listing.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        ) : myActive.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No resources yet"
            description="Offer a resource to start sharing with the BELONG community."
            action={{ label: "Offer a resource", onClick: () => setCreateOpen(true) }}
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
        title={`Offer a ${offerKind}`}
        description={offerKind === "product" ? "Share a product, tool, or resource with the community." : "Describe the service you can provide to the community."}
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder={offerKind === "product" ? "Product name" : "Service name"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What are you offering?" />
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
              Offer resource
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ResourceCard({
  listing,
  category,
  resourceType,
  isOwner,
  isPending,
  onPurchase,
}: {
  listing: ListingWithSeller;
  category: ResourceCategory;
  resourceType: "product" | "service";
  isOwner: boolean;
  isPending: boolean;
  onPurchase: () => void;
}) {
  const CategoryIcon = CATEGORY_ICONS[category];
  const detailHref = `/marketplace/${listing.id}`;
  const isFree = listing.price_cents <= 0;

  return (
    <Card className="group overflow-hidden transition-all hover:border-border-strong hover:shadow-md">
      <Link
        href={detailHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt=""
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand/15 to-brand-secondary/10">
            <CategoryIcon className="h-8 w-8 text-brand/70" aria-hidden />
          </div>
        )}
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="brand">{resourceType === "product" ? "Product" : "Service"}</Badge>
              <Badge variant="outline">{resourceCategoryLabel(category)}</Badge>
            </div>
            {isFree && <Badge variant="success">Free</Badge>}
          </div>
          <h3 className="font-semibold text-fg-primary transition-colors group-hover:text-brand">
            {listing.title}
          </h3>
          {listing.description && (
            <p className="text-caption line-clamp-2">{listing.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Avatar
              src={listing.seller?.avatar_url ?? undefined}
              fallback={formatInitials(listing.seller?.full_name)}
              size="sm"
            />
            <p className="text-sm text-fg-muted">{listing.seller?.full_name ?? "Builder"}</p>
          </div>
        </CardContent>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-6 py-4">
        <p className="text-lg font-bold text-brand">
          {isFree ? "Free" : formatCents(listing.price_cents)}
        </p>
        <div className="flex items-center gap-2">
          <Link href={detailHref}>
            <Button size="sm" variant="secondary">
              View
            </Button>
          </Link>
          {!isOwner && !isFree && (
            <Button size="sm" variant="brand" disabled={isPending} onClick={onPurchase}>
              Buy
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
