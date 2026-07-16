export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const PLATFORM_FEE_PERCENT = 10;

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  creator: process.env.STRIPE_PRICE_CREATOR_MONTHLY ?? "",
} as const;

export const MIN_DONATION_CENTS = 100;
export const MIN_FUNDING_CENTS = 500;
export const MIN_LISTING_CENTS = 100;
export const MIN_COMMUNITY_SUB_CENTS = 500;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

export function platformFeeCents(amountCents: number): number {
  return Math.floor((amountCents * PLATFORM_FEE_PERCENT) / 100);
}
