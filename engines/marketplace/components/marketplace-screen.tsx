"use client";

import {
  archiveListing,
  createListing,
  publishListing,
  uploadListingImage,
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
import type { MarketplaceListing, MarketplaceListingCategory } from "@/types/database.types";
import { BookOpen, ExternalLink, ImageIcon, Plus, Search, Store, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

const LISTING_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const LISTING_CATEGORIES: MarketplaceListingCategory[] = [
  "Services",
  "Tools & templates",
  "Guidance",
  "Learning",
  "Funding & launch",
];

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [isPending, startTransition] = useTransition();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePending, startImageTransition] = useTransition();
  const [newListingCategory, setNewListingCategory] = useState<MarketplaceListingCategory | null>(null);

  const myActive = useMemo(
    () => myListings.filter((l) => l.status === "active" || l.status === "draft"),
    [myListings]
  );
  const categories = ["All", "Services", "Tools & templates", "Guidance", "Learning", "Funding & launch"];
  // Prefer the seller-chosen category (stored on the row) once set. Older
  // listings created before the category picker existed have category: null,
  // so fall back to guessing from the title/description text for those only.
  const guessListingCategory = (listing: ListingWithSeller) => {
    const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();
    if (/template|tool|kit|software|resource/.test(text)) return "Tools & templates";
    if (/coach|mentor|advice|consult|strategy|guide/.test(text)) return "Guidance";
    if (/course|class|workshop|training|learn/.test(text)) return "Learning";
    if (/fund|grant|launch|pitch|capital/.test(text)) return "Funding & launch";
    return "Services";
  };
  const listingCategory = (listing: ListingWithSeller) => listing.category ?? guessListingCategory(listing);
  const visibleListings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (category !== "All" && listingCategory(listing) !== category) return false;
      if (!needle) return true;
      return [
        listing.title,
        listing.description ?? "",
        listing.seller?.full_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [category, listings, query]);

  const handlePurchase = (listingId: string) => {
    startTransition(async () => {
      const result = await createMarketplaceCheckout(listingId);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  const resetImageState = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
    setImageUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setImageUrl(null);
    setImageUploading(true);
    const formData = new FormData();
    formData.set("image", file);
    startImageTransition(async () => {
      const result = await uploadListingImage(formData);
      setImageUploading(false);
      if (result.error || !result.imageUrl) {
        toast(result.error ?? "Could not attach image. You can publish without it.", "error");
        return;
      }
      setImageUrl(result.imageUrl);
    });
  };

  const handleRemoveImage = () => {
    resetImageState();
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetImageState();
    setNewListingCategory(null);
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
    if (imageUploading) {
      toast("Wait for the image to finish uploading", "error");
      return;
    }
    if (!newListingCategory) {
      toast("Choose a category for this resource", "error");
      return;
    }

    startTransition(async () => {
      const result = await createListing({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        priceCents: cents,
        imageUrl: imageUrl ?? undefined,
        publish: formData.get("publish") === "on",
        category: newListingCategory,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Listing created", "success");
        setCreateOpen(false);
        resetImageState();
        setNewListingCategory(null);
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
        label="Resources"
        title="Practical support for meaningful work"
        description="Find services, guidance, tools, and provider-fulfilled resources that help projects and impact move forward."
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
              { id: "browse", label: "Discover", count: listings.length },
              { id: "selling", label: "My resources", count: myActive.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      >
        {tab === "browse" ? (
          listings.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No resources available yet"
              description="Be the first to offer practical support to people building with purpose."
              action={{ label: "Offer a resource", onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="space-y-5">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search resources, services, or providers..."
                  className="pl-10"
                  aria-label="Search resources"
                />
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Resource categories">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      category === item
                        ? "border-brand/40 bg-brand/15 text-brand"
                        : "border-border-subtle bg-bg-elevated text-fg-muted hover:text-fg-primary"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {visibleListings.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No resources match"
                  description={`Nothing matched "${query}". Try a broader search.`}
                  action={{ label: "Clear search", onClick: () => setQuery("") }}
                />
              ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                  {listing.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.image_url} alt="" className="h-36 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-36 place-items-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,.2),transparent_55%),linear-gradient(145deg,rgba(124,58,237,.16),rgba(3,7,18,.9))]">
                      <BookOpen className="h-9 w-9 text-cyan-200/70" aria-hidden />
                    </div>
                  )}
                  <CardContent className="flex min-h-[250px] flex-col pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{listingCategory(listing)}</Badge>
                      <span className="text-sm font-bold text-brand">{formatCents(listing.price_cents)}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-fg-primary">{listing.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">
                      {listing.description ?? "Provider-fulfilled support for purposeful work."}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <Avatar src={listing.seller?.avatar_url ?? undefined} fallback={formatInitials(listing.seller?.full_name)} size="sm" />
                      <p className="min-w-0 flex-1 truncate text-xs text-fg-secondary">{listing.seller?.full_name ?? "BELONG provider"}</p>
                      <Link href={`/marketplace/${listing.id}`}>
                        <Button size="sm" variant="secondary"><ExternalLink className="h-3.5 w-3.5" aria-hidden />View</Button>
                      </Link>
                    </div>
                    {listing.seller_id !== currentUserId && (
                      <Button className="mt-3 w-full" size="sm" variant="brand" disabled={isPending} onClick={() => handlePurchase(listing.id)}>
                        Request access
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
              )}
            </div>
          )
        ) : myActive.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No resources offered yet"
            description="Create an offer for a service, session, tool, or resource you can fulfill directly."
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
        onClose={closeCreateModal}
        title="Offer a resource"
        description="Describe the practical support you can provide and how it helps people move meaningful work forward."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="What are you offering?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Explain what the recipient gets, who it helps, and how you will fulfill it."
            />
          </div>
          <div className="space-y-2">
            <Label id="listing-category-label">Category</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="listing-category-label">
              {LISTING_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={newListingCategory === item}
                  onClick={() => setNewListingCategory(item)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    newListingCategory === item
                      ? "border-brand/40 bg-brand/15 text-brand"
                      : "border-border-subtle bg-bg-elevated text-fg-muted hover:text-fg-primary"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-image">Cover photo</Label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="h-40 w-full object-cover" />
                {imageUploading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-medium text-fg-primary">
                    Uploading...
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={imageUploading}
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-fg-primary transition hover:bg-black/80 focus-ring disabled:opacity-50"
                  aria-label="Remove cover photo"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imagePending}
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] text-sm text-fg-muted transition hover:border-brand/30 hover:text-fg-secondary disabled:opacity-50"
              >
                <ImageIcon className="h-5 w-5" aria-hidden />
                Add a cover photo (optional)
              </button>
            )}
            <input
              ref={imageInputRef}
              id="listing-image"
              type="file"
              accept={LISTING_IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => handleImageSelect(event.target.files?.[0] ?? null)}
            />
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
            <Button type="button" variant="ghost" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending} disabled={isPending || imageUploading}>
              Create resource
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
