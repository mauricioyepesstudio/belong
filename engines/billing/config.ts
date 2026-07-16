import type { SubscriptionTier } from "@/types/database.types";
import { Crown, Sparkles, Zap } from "lucide-react";

export type PricingTier = {
  id: SubscriptionTier;
  name: string;
  price: string;
  priceCents: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  stripeTier?: "pro" | "creator";
};

export const PLATFORM_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceCents: 0,
    description: "Everything you need to start building.",
    features: [
      "Communities & connections",
      "Projects & events",
      "Messaging",
      "Basic profile",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    priceCents: 1200,
    description: "For serious builders who want an edge.",
    features: [
      "Everything in Free",
      "Priority AI insights",
      "Advanced analytics",
      "Pro badge on profile",
      "Early access features",
    ],
    highlighted: true,
    stripeTier: "pro",
  },
  {
    id: "creator",
    name: "Creator",
    price: "$29",
    priceCents: 2900,
    description: "Monetize your mission and grow your audience.",
    features: [
      "Everything in Pro",
      "Stripe Connect payouts",
      "Paid communities",
      "Project funding",
      "Marketplace listings",
      "Donations & tips",
    ],
    stripeTier: "creator",
  },
];

export const TIER_ICONS = {
  free: Sparkles,
  pro: Zap,
  creator: Crown,
} as const;

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
