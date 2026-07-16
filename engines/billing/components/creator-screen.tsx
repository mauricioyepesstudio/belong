"use client";

import { createConnectOnboardingLink, createConnectDashboardLink } from "@/lib/actions/connect";
import { formatCents } from "@/engines/billing";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeatureScreen,
  StatCard,
  useToast,
} from "@/systems/design-system";
import type { Payment, UserProfile } from "@/types/database.types";
import { DollarSign, Store, TrendingUp, Users, Wallet } from "lucide-react";
import { useTransition } from "react";

type CreatorScreenProps = {
  profile: UserProfile;
  totalEarnings: number;
  activeSubscribers: number;
  activeListings: number;
  payments: Pick<Payment, "amount_cents" | "platform_fee_cents" | "payment_type" | "created_at">[];
};

export function CreatorScreen({
  profile,
  totalEarnings,
  activeSubscribers,
  activeListings,
  payments,
}: CreatorScreenProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const setupPayouts = () => {
    startTransition(async () => {
      const result = await createConnectOnboardingLink();
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  const openDashboard = () => {
    startTransition(async () => {
      const result = await createConnectDashboardLink();
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <FeatureScreen
      label="Creator"
      title="Creator economy"
      description="Manage payouts, track earnings, and grow your revenue on BELONG."
      action={
        profile.connect_charges_enabled ? (
          <Button variant="secondary" isLoading={isPending} onClick={openDashboard}>
            Stripe dashboard
          </Button>
        ) : (
          <Button variant="brand" isLoading={isPending} onClick={setupPayouts}>
            Set up payouts
          </Button>
        )
      }
    >
      {!profile.connect_charges_enabled && (
        <Card className="mb-6 border-brand/20 bg-brand/5">
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
                <div>
                  <p className="font-semibold text-fg-primary">Connect Stripe to get paid</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    Enable donations, paid communities, project funding, and marketplace sales.
                  </p>
                </div>
              </div>
              <Button variant="brand" isLoading={isPending} onClick={setupPayouts}>
                Get started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earned" value={formatCents(totalEarnings)} icon={DollarSign} />
        <StatCard label="Subscribers" value={String(activeSubscribers)} icon={Users} />
        <StatCard label="Active listings" value={String(activeListings)} icon={Store} />
        <StatCard
          label="Plan"
          value={profile.subscription_tier ?? "free"}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-6 text-center text-caption">
              Payments will appear here once you start earning.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {payments.map((payment, i) => (
                <li
                  key={`${payment.created_at}-${i}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-fg-primary">
                      {payment.payment_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="brand">
                    +{formatCents(payment.amount_cents - (payment.platform_fee_cents ?? 0))}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </FeatureScreen>
  );
}
