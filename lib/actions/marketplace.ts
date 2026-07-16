"use server";

import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import { isStripeConfigured, MIN_LISTING_CENTS } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createListing(data: {
  title: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  publish?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.title.trim()) return { error: "Title is required" };
  if (data.priceCents < MIN_LISTING_CENTS) {
    return { error: `Minimum price is $${(MIN_LISTING_CENTS / 100).toFixed(2)}` };
  }

  if (data.publish && !profile.connect_charges_enabled) {
    return { error: "Complete creator payout setup before publishing" };
  }

  let stripePriceId: string | null = null;
  let stripeProductId: string | null = null;

  if (data.publish && isStripeConfigured()) {
    const stripe = getStripe();
    const product = await stripe.products.create({
      name: data.title.trim(),
      description: data.description?.trim(),
      metadata: { seller_id: profile.id },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: data.priceCents,
      currency: "usd",
    });
    stripeProductId = product.id;
    stripePriceId = price.id;
  }

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .insert({
      seller_id: profile.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      price_cents: data.priceCents,
      image_url: data.imageUrl?.trim() || null,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      status: data.publish ? "active" : "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  return { id: listing.id };
}

export async function publishListing(listingId: string): Promise<ActionResult> {
  const blocked = !isStripeConfigured()
    ? { error: "Payments are not configured" }
    : null;
  if (blocked) return blocked;

  const supabase = await createClient();
  const profile = await requireProfile();

  if (!profile.connect_charges_enabled) {
    return { error: "Complete creator payout setup before publishing" };
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, description, price_cents, stripe_price_id, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== profile.id) {
    return { error: "Not authorized" };
  }

  let stripePriceId = listing.stripe_price_id;

  if (!stripePriceId) {
    const stripe = getStripe();
    const product = await stripe.products.create({
      name: listing.title,
      description: listing.description ?? undefined,
      metadata: { listing_id: listingId, seller_id: profile.id },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: listing.price_cents,
      currency: "usd",
    });
    stripePriceId = price.id;

    await supabase
      .from("marketplace_listings")
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      })
      .eq("id", listingId);
  }

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status: "active" })
    .eq("id", listingId);

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  return {};
}

export async function archiveListing(listingId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status: "archived" })
    .eq("id", listingId)
    .eq("seller_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  return {};
}
