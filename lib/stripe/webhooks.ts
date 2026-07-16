import { APP_URL, platformFeeCents } from "@/lib/stripe/config";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier, Json } from "@/types/database.types";
import type Stripe from "stripe";

type CheckoutMeta = {
  type: string;
  user_id?: string;
  community_id?: string;
  project_id?: string;
  recipient_id?: string;
  listing_id?: string;
  tier?: SubscriptionTier;
  amount_cents?: string;
};

export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ status: number; message: string }> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return { status: 500, message: "Webhook secret not configured" };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return { status: 400, message: `Webhook Error: ${message}` };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    return { status: 200, message: "Already processed" };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        break;
    }

    await admin.from("stripe_webhook_events").insert({
      id: event.id,
      event_type: event.type,
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return { status: 500, message: "Handler failed" };
  }

  return { status: 200, message: "OK" };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata as CheckoutMeta | null;
  if (!meta?.type) return;

  switch (meta.type) {
    case "platform_subscription":
      await fulfillPlatformSubscription(session, meta);
      break;
    case "community_subscription":
      await fulfillCommunitySubscription(session, meta);
      break;
    case "project_funding":
      await fulfillProjectFunding(session, meta);
      break;
    case "donation":
    case "creator_tip":
      await fulfillDonation(session, meta);
      break;
    case "marketplace_purchase":
      await fulfillMarketplacePurchase(session, meta);
      break;
  }
}

async function fulfillPlatformSubscription(
  session: Stripe.Checkout.Session,
  meta: CheckoutMeta
) {
  if (!meta.user_id || !meta.tier) return;

  const admin = createAdminClient();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  await admin
    .from("users")
    .update({ subscription_tier: meta.tier })
    .eq("id", meta.user_id);

  if (subscriptionId) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    await admin.from("subscriptions").upsert(
      {
        user_id: meta.user_id,
        subscription_type: "platform",
        status: mapSubscriptionStatus(sub.status),
        stripe_subscription_id: sub.id,
        stripe_customer_id:
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        community_id: null,
        price_cents: sub.items.data[0]?.price.unit_amount ?? null,
        currency: sub.currency,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  await notifyUser(meta.user_id, "Welcome to BELONG Premium", `Your ${meta.tier} membership is active.`, {
    type: "platform_subscription",
    tier: meta.tier,
  });
}

async function fulfillCommunitySubscription(
  session: Stripe.Checkout.Session,
  meta: CheckoutMeta
) {
  if (!meta.user_id || !meta.community_id) return;

  const admin = createAdminClient();

  const { error: memberError } = await admin.from("community_members").upsert(
    {
      community_id: meta.community_id,
      user_id: meta.user_id,
      role: "member",
    },
    { onConflict: "community_id,user_id", ignoreDuplicates: false }
  );

  if (memberError && memberError.code !== "23505") {
    throw memberError;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (subscriptionId) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    await admin.from("subscriptions").upsert(
      {
        user_id: meta.user_id,
        subscription_type: "community",
        status: mapSubscriptionStatus(sub.status),
        stripe_subscription_id: sub.id,
        stripe_customer_id:
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        community_id: meta.community_id,
        price_cents: sub.items.data[0]?.price.unit_amount ?? null,
        currency: sub.currency,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      },
      { onConflict: "user_id,community_id" }
    );
  }

  const { data: community } = await admin
    .from("communities")
    .select("name, owner_id")
    .eq("id", meta.community_id)
    .single();

  if (community) {
    await notifyUser(
      meta.user_id,
      "Community subscription active",
      `You now have access to ${community.name}.`,
      { community_id: meta.community_id }
    );

    if (community.owner_id !== meta.user_id) {
      await notifyUser(
        community.owner_id,
        "New subscriber",
        `Someone subscribed to ${community.name}.`,
        { community_id: meta.community_id, type: "community_subscription" }
      );
    }
  }
}

async function fulfillProjectFunding(session: Stripe.Checkout.Session, meta: CheckoutMeta) {
  if (!meta.user_id || !meta.project_id || !meta.amount_cents) return;

  const amountCents = parseInt(meta.amount_cents, 10);
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("name, owner_id")
    .eq("id", meta.project_id)
    .single();

  if (!project) return;

  await admin.rpc("increment_project_funding", {
    p_project_id: meta.project_id,
    p_amount_cents: amountCents,
  });

  await admin.from("payments").insert({
    payer_id: meta.user_id,
    recipient_id: project.owner_id,
    payment_type: "project_funding",
    status: "succeeded",
    amount_cents: amountCents,
    platform_fee_cents: platformFeeCents(amountCents),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    target_type: "project",
    target_id: meta.project_id,
  });

  await notifyUser(
    project.owner_id,
    "New project backer",
    `Someone contributed $${(amountCents / 100).toFixed(2)} to ${project.name}.`,
    { project_id: meta.project_id, amount_cents: amountCents }
  );

  await notifyUser(
    meta.user_id,
    "Contribution confirmed",
    `Thank you for backing ${project.name}.`,
    { project_id: meta.project_id }
  );
}

async function fulfillDonation(session: Stripe.Checkout.Session, meta: CheckoutMeta) {
  if (!meta.user_id || !meta.recipient_id || !meta.amount_cents) return;

  const amountCents = parseInt(meta.amount_cents, 10);
  const admin = createAdminClient();
  const paymentType = meta.type === "creator_tip" ? "creator_tip" : "donation";

  const { data: recipient } = await admin
    .from("users")
    .select("full_name")
    .eq("id", meta.recipient_id)
    .single();

  await admin.from("payments").insert({
    payer_id: meta.user_id,
    recipient_id: meta.recipient_id,
    payment_type: paymentType,
    status: "succeeded",
    amount_cents: amountCents,
    platform_fee_cents: platformFeeCents(amountCents),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    target_type: "user",
    target_id: meta.recipient_id,
  });

  await notifyUser(
    meta.recipient_id,
    paymentType === "creator_tip" ? "New tip received" : "New donation",
    `You received $${(amountCents / 100).toFixed(2)}${recipient?.full_name ? "" : ""}.`,
    { payer_id: meta.user_id, amount_cents: amountCents }
  );

  await notifyUser(
    meta.user_id,
    "Payment confirmed",
    `Your ${paymentType === "creator_tip" ? "tip" : "donation"} was sent successfully.`,
    { recipient_id: meta.recipient_id }
  );
}

async function fulfillMarketplacePurchase(
  session: Stripe.Checkout.Session,
  meta: CheckoutMeta
) {
  if (!meta.user_id || !meta.listing_id || !meta.recipient_id) return;

  const admin = createAdminClient();

  const { data: listing } = await admin
    .from("marketplace_listings")
    .select("title, price_cents, seller_id")
    .eq("id", meta.listing_id)
    .single();

  if (!listing) return;

  await admin
    .from("marketplace_listings")
    .update({ status: "sold" })
    .eq("id", meta.listing_id);

  await admin.from("payments").insert({
    payer_id: meta.user_id,
    recipient_id: listing.seller_id,
    payment_type: "marketplace_purchase",
    status: "succeeded",
    amount_cents: listing.price_cents,
    platform_fee_cents: platformFeeCents(listing.price_cents),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    target_type: "listing",
    target_id: meta.listing_id,
  });

  await notifyUser(
    listing.seller_id,
    "Item sold",
    `${listing.title} was purchased.`,
    { listing_id: meta.listing_id, buyer_id: meta.user_id }
  );

  await notifyUser(
    meta.user_id,
    "Purchase confirmed",
    `You purchased ${listing.title}.`,
    { listing_id: meta.listing_id }
  );
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const userId = subscription.metadata?.user_id;
  const communityId = subscription.metadata?.community_id;
  const tier = subscription.metadata?.tier as SubscriptionTier | undefined;
  const subType = subscription.metadata?.type;

  const status = mapSubscriptionStatus(subscription.status);
  const isActive = status === "active" || status === "trialing";

  await admin
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (subType === "platform" && userId && tier) {
    await admin
      .from("users")
      .update({ subscription_tier: isActive ? tier : "free" })
      .eq("id", userId);
  }

  if (subType === "community" && userId && communityId && !isActive) {
    await admin
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.user_id;
  if (!userId) return;

  const admin = createAdminClient();
  await admin
    .from("users")
    .update({
      connect_charges_enabled: account.charges_enabled ?? false,
      connect_payouts_enabled: account.payouts_enabled ?? false,
    })
    .eq("id", userId);
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid" {
  const map: Record<string, ReturnType<typeof mapSubscriptionStatus>> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    unpaid: "unpaid",
  };
  return map[status] ?? "incomplete";
}

async function notifyUser(
  userId: string,
  title: string,
  body: string,
  metadata: Json
) {
  const admin = createAdminClient();
  await admin.rpc("create_notification", {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_type: "payment",
    p_metadata: metadata,
  });
}

export async function ensureCheckoutCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string | null
) {
  return getOrCreateStripeCustomer(userId, email, existingCustomerId);
}

export function checkoutUrls() {
  return {
    success: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${APP_URL}/billing/cancel`,
  };
}
