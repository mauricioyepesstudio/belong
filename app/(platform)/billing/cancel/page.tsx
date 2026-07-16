import { Button, Card, CardContent, FeatureScreen } from "@/systems/design-system";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment canceled" };

export default function BillingCancelPage() {
  return (
    <FeatureScreen
      label="Billing"
      title="Payment canceled"
      description="No charges were made. You can try again anytime."
    >
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <p className="text-lg font-semibold text-fg-primary">Checkout canceled</p>
          <p className="mt-2 text-sm text-fg-muted">
            Your payment was not completed. Return when you are ready.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/pricing">
              <Button variant="brand">View plans</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Go home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </FeatureScreen>
  );
}
