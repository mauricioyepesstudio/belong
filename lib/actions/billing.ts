"use server";

import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import {
  APP_URL,
  isStripeConfigured,
  MIN_COMMUNITY_SUB_CENTS,
  MIN_DONATION_CENTS,
  MIN_FUNDING_CENTS,
  MIN_LISTING_CENTS,
  STRIPE_PRICES,
} from "@/lib/stripe/config";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripe } from "@/lib/stripe/server";
import { checkoutUrls } from "@/lib/stripe/webhooks";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/types/database.types";
import { revalidatePath } from "next/cache";

function stripeGuard(): ActionResult | null {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured. Contact support." };
  }
  return null;
}

export async function createPlatformCheckout(
  tier: "pro" | "creator"
): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const profile = await requireProfile();
  const priceId = tier === "pro" ? STRIPE_PRICES.pro : STRIPE_PRICES.creator;

  if (!priceId) {
    return { error: `Stripe price for ${tier} is not configured` };
  }

  const customerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.stripe_customer_id
  );

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
    metadata: {
      type: "platform_subscription",
      user_id: profile.id,
      tier,
    },
    subscription_data: {
      metadata: {
        type: "platform",
        user_id: profile.id,
        tier,
      },
    },
  });

  if (!session.url) return { error: "Could not create checkout session" };
  return { url: session.url };
}

export async function createBillingPortalSession(): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const profile = await requireProfile();
  if (!profile.stripe_customer_id) {
    return { error: "No billing account found. Subscribe to a plan first." };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${APP_URL}/settings`,
  });

  return { url: session.url };
}

export async function createCommunitySubscriptionCheckout(
  communityId: string
): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, is_paid, stripe_price_id, owner_id")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };
  if (!community.is_paid || !community.stripe_price_id) {
    return { error: "This community is free to join" };
  }

  const { data: owner } = await supabase
    .from("users")
    .select("stripe_connect_account_id, connect_charges_enabled")
    .eq("id", community.owner_id)
    .single();

  if (!owner?.stripe_connect_account_id || !owner.connect_charges_enabled) {
    return { error: "Community payments are not available yet" };
  }

  const customerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.stripe_customer_id
  );

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: community.stripe_price_id, quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
    metadata: {
      type: "community_subscription",
      user_id: profile.id,
      community_id: communityId,
    },
    subscription_data: {
      transfer_data: { destination: owner.stripe_connect_account_id },
      application_fee_percent: 10,
      metadata: {
        type: "community",
        user_id: profile.id,
        community_id: communityId,
      },
    },
  });

  if (!session.url) return { error: "Could not create checkout session" };
  return { url: session.url };
}

export async function createProjectFundingCheckout(
  projectId: string,
  amountCents: number
): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  if (amountCents < MIN_FUNDING_CENTS) {
    return { error: `Minimum contribution is $${(MIN_FUNDING_CENTS / 100).toFixed(2)}` };
  }

  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, funding_enabled, owner_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };
  if (!project.funding_enabled) return { error: "Funding is not enabled for this project" };
  if (project.owner_id === profile.id) {
    return { error: "You cannot fund your own project" };
  }

  const { data: owner } = await supabase
    .from("users")
    .select("stripe_connect_account_id, connect_charges_enabled")
    .eq("id", project.owner_id)
    .single();

  if (!owner?.stripe_connect_account_id || !owner.connect_charges_enabled) {
    return { error: "Project owner has not set up payouts" };
  }

  const customerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.stripe_customer_id
  );

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();
  const fee = Math.floor(amountCents * 0.1);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: `Back ${project.name}` },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: fee,
      transfer_data: { destination: owner.stripe_connect_account_id },
      metadata: {
        type: "project_funding",
        project_id: projectId,
        user_id: profile.id,
      },
    },
    success_url: success,
    cancel_url: cancel,
    metadata: {
      type: "project_funding",
      user_id: profile.id,
      project_id: projectId,
      amount_cents: String(amountCents),
    },
  });

  if (!session.url) return { error: "Could not create checkout session" };
  return { url: session.url };
}

export async function createDonationCheckout(
  recipientId: string,
  amountCents: number,
  kind: "donation" | "creator_tip" = "donation"
): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  if (amountCents < MIN_DONATION_CENTS) {
    return { error: `Minimum amount is $${(MIN_DONATION_CENTS / 100).toFixed(2)}` };
  }

  const supabase = await createClient();
  const profile = await requireProfile();

  if (recipientId === profile.id) {
    return { error: "You cannot donate to yourself" };
  }

  const { data: recipient } = await supabase
    .from("users")
    .select("full_name, stripe_connect_account_id, connect_charges_enabled")
    .eq("id", recipientId)
    .single();

  if (!recipient) return { error: "Recipient not found" };
  if (!recipient.stripe_connect_account_id || !recipient.connect_charges_enabled) {
    return { error: "This creator has not set up payments yet" };
  }

  const customerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.stripe_customer_id
  );

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();
  const fee = Math.floor(amountCents * 0.1);
  const label =
    kind === "creator_tip"
      ? `Tip ${recipient.full_name ?? "creator"}`
      : `Donate to ${recipient.full_name ?? "creator"}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: label },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: fee,
      transfer_data: { destination: recipient.stripe_connect_account_id },
    },
    success_url: success,
    cancel_url: cancel,
    metadata: {
      type: kind,
      user_id: profile.id,
      recipient_id: recipientId,
      amount_cents: String(amountCents),
    },
  });

  if (!session.url) return { error: "Could not create checkout session" };
  return { url: session.url };
}

export async function createMarketplaceCheckout(listingId: string): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, price_cents, status, seller_id, stripe_price_id")
    .eq("id", listingId)
    .single();

  if (!listing) return { error: "Listing not found" };
  if (listing.status !== "active") return { error: "This listing is not available" };
  if (listing.seller_id === profile.id) {
    return { error: "You cannot purchase your own listing" };
  }

  const { data: seller } = await supabase
    .from("users")
    .select("stripe_connect_account_id, connect_charges_enabled")
    .eq("id", listing.seller_id)
    .single();

  if (!seller?.stripe_connect_account_id || !seller.connect_charges_enabled) {
    return { error: "Seller has not set up payouts" };
  }

  const customerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.stripe_customer_id
  );

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();
  const fee = Math.floor(listing.price_cents * 0.1);

  const lineItem = listing.stripe_price_id
    ? { price: listing.stripe_price_id, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          unit_amount: listing.price_cents,
          product_data: { name: listing.title },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [lineItem],
    payment_intent_data: {
      application_fee_amount: fee,
      transfer_data: { destination: seller.stripe_connect_account_id },
    },
    success_url: success,
    cancel_url: cancel,
    metadata: {
      type: "marketplace_purchase",
      user_id: profile.id,
      listing_id: listingId,
      recipient_id: listing.seller_id,
    },
  });

  if (!session.url) return { error: "Could not create checkout session" };
  return { url: session.url };
}

export async function enableProjectFunding(
  projectId: string,
  goalCents: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (goalCents < MIN_FUNDING_CENTS) {
    return { error: `Minimum goal is $${(MIN_FUNDING_CENTS / 100).toFixed(2)}` };
  }

  if (!profile.connect_charges_enabled) {
    return { error: "Complete creator payout setup before enabling funding" };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      funding_enabled: true,
      funding_goal_cents: goalCents,
    })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  return {};
}

export async function configurePaidCommunity(
  communityId: string,
  priceCents: number
): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  if (priceCents < MIN_COMMUNITY_SUB_CENTS) {
    return {
      error: `Minimum subscription price is $${(MIN_COMMUNITY_SUB_CENTS / 100).toFixed(2)}/mo`,
    };
  }

  const supabase = await createClient();
  const profile = await requireProfile();

  if (!profile.connect_charges_enabled) {
    return { error: "Complete creator payout setup before enabling paid access" };
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, owner_id")
    .eq("id", communityId)
    .single();

  if (!community || community.owner_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const stripe = getStripe();

  let productId: string;
  let priceId: string;

  const { data: existing } = await supabase
    .from("communities")
    .select("stripe_product_id, stripe_price_id")
    .eq("id", communityId)
    .single();

  if (existing?.stripe_product_id) {
    productId = existing.stripe_product_id;
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: priceCents,
      currency: "usd",
      recurring: { interval: "month" },
    });
    priceId = price.id;
  } else {
    const product = await stripe.products.create({
      name: `${community.name} Membership`,
      metadata: { community_id: communityId },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceCents,
      currency: "usd",
      recurring: { interval: "month" },
    });
    productId = product.id;
    priceId = price.id;
  }

  const { error } = await supabase
    .from("communities")
    .update({
      is_paid: true,
      subscription_price_cents: priceCents,
      stripe_product_id: productId,
      stripe_price_id: priceId,
    })
    .eq("id", communityId);

  if (error) return { error: error.message };

  revalidatePath("/community");
  return {};
}

export type BillingSummary = {
  tier: SubscriptionTier;
  hasCustomer: boolean;
  connectEnabled: boolean;
  earningsCents: number;
};

export async function getBillingSummary(): Promise<BillingSummary> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: earnings } = await supabase
    .from("payments")
    .select("amount_cents, platform_fee_cents")
    .eq("recipient_id", profile.id)
    .eq("status", "succeeded");

  const earningsCents =
    earnings?.reduce(
      (sum, p) => sum + p.amount_cents - (p.platform_fee_cents ?? 0),
      0
    ) ?? 0;

  return {
    tier: profile.subscription_tier ?? "free",
    hasCustomer: Boolean(profile.stripe_customer_id),
    connectEnabled: Boolean(profile.connect_charges_enabled),
    earningsCents,
  };
}
