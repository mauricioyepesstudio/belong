"use client";

import { PLATFORM_TIERS, TIER_ICONS } from "@/engines/billing/config";
import { CheckoutButton } from "@/engines/billing/components/checkout-button";
import { Badge, Button, Card, CardContent } from "@/systems/design-system";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/types/database.types";
import { Check } from "lucide-react";

type PricingCardsProps = {
  currentTier?: SubscriptionTier;
};

export function PricingCards({ currentTier = "free" }: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLATFORM_TIERS.map((tier) => {
        const Icon = TIER_ICONS[tier.id];
        const isCurrent = currentTier === tier.id;

        return (
          <Card
            key={tier.id}
            className={cn(
              "relative overflow-hidden transition-all",
              tier.highlighted && "border-brand/40 shadow-lg shadow-brand/10",
              isCurrent && "ring-2 ring-brand/30"
            )}
          >
            {tier.highlighted && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand/60 via-brand to-brand/60" />
            )}
            <CardContent className="flex h-full flex-col pt-8 pb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-fg-primary">{tier.name}</h3>
                    {isCurrent && <Badge variant="brand">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-fg-primary">
                    {tier.price}
                    {tier.priceCents > 0 && (
                      <span className="text-sm font-normal text-fg-muted">/mo</span>
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-fg-muted">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-fg-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {tier.stripeTier ? (
                  isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : (
                    <CheckoutButton tier={tier.stripeTier} className="w-full" variant="brand">
                      Upgrade to {tier.name}
                    </CheckoutButton>
                  )
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    {isCurrent ? "Current plan" : "Included"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
