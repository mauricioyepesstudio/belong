"use server";

import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function stripeGuard(): ActionResult | null {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured" };
  }
  return null;
}

export async function createConnectAccount(): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const profile = await requireProfile();

  if (profile.stripe_connect_account_id) {
    return { id: profile.stripe_connect_account_id };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: profile.email,
    metadata: { user_id: profile.id },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/creator");
  return { id: account.id };
}

export async function createConnectOnboardingLink(): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const profile = await requireProfile();
  let accountId = profile.stripe_connect_account_id;

  if (!accountId) {
    const result = await createConnectAccount();
    if (result.error) return result;
    accountId = result.id ?? null;
  }

  if (!accountId) return { error: "Could not create Connect account" };

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/creator?refresh=1`,
    return_url: `${appUrl}/creator?success=1`,
    type: "account_onboarding",
  });

  return { url: link.url };
}

export async function createConnectDashboardLink(): Promise<ActionResult> {
  const blocked = stripeGuard();
  if (blocked) return blocked;

  const profile = await requireProfile();
  if (!profile.stripe_connect_account_id) {
    return { error: "Complete creator setup first" };
  }

  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(profile.stripe_connect_account_id);
  return { url: link.url };
}
