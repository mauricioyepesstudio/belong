"use client";

import { createBillingPortalSession } from "@/lib/actions/billing";
import { createConnectOnboardingLink, createConnectDashboardLink } from "@/lib/actions/connect";
import { formatCents, TIER_ICONS } from "@/engines/billing/config";
import { CheckoutButton } from "@/engines/billing/components/checkout-button";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, useToast } from "@/systems/design-system";
import type { BillingSummary } from "@/lib/actions/billing";
import { CreditCard, DollarSign, ExternalLink, Wallet } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

type BillingSettingsProps = {
  summary: BillingSummary;
};

export function BillingSettings({ summary }: BillingSettingsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const TierIcon = TIER_ICONS[summary.tier];

  const openPortal = () => {
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  const setupConnect = () => {
    startTransition(async () => {
      const result = await createConnectOnboardingLink();
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  const openConnectDashboard = () => {
    startTransition(async () => {
      const result = await createConnectDashboardLink();
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TierIcon className="h-5 w-5 text-brand" aria-hidden />
            Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize text-fg-primary">{summary.tier} plan</p>
              <p className="text-sm text-fg-muted">
                {summary.tier === "free"
                  ? "Upgrade to unlock premium features and creator tools."
                  : "Your subscription is managed through Stripe."}
              </p>
            </div>
            <Badge variant={summary.tier === "free" ? "outline" : "brand"}>
              {summary.tier}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {summary.tier === "free" && (
              <>
                <CheckoutButton tier="pro" variant="brand">
                  Upgrade to Pro
                </CheckoutButton>
                <CheckoutButton tier="creator" variant="secondary">
                  Go Creator
                </CheckoutButton>
              </>
            )}
            {summary.hasCustomer && summary.tier !== "free" && (
              <Button variant="secondary" isLoading={isPending} onClick={openPortal}>
                <CreditCard className="h-4 w-4" aria-hidden />
                Manage billing
              </Button>
            )}
            <Link href="/pricing">
              <Button variant="ghost">View all plans</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand" aria-hidden />
            Creator payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-fg-muted">
            Connect Stripe to receive donations, community subscriptions, project funding, and
            resource sales. BELONG takes a 10% platform fee.
          </p>

          {summary.connectEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                <DollarSign className="h-4 w-4 text-success" aria-hidden />
                <span className="text-sm font-medium text-fg-primary">
                  Payouts enabled · {formatCents(summary.earningsCents)} earned
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" isLoading={isPending} onClick={openConnectDashboard}>
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Stripe dashboard
                </Button>
                <Link href="/creator">
                  <Button variant="ghost">Creator hub</Button>
                </Link>
              </div>
            </div>
          ) : (
            <Button variant="brand" isLoading={isPending} onClick={setupConnect}>
              Set up payouts
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
