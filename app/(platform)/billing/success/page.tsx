import { Button, Card, CardContent, FeatureScreen } from "@/systems/design-system";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment successful" };

export default function BillingSuccessPage() {
  return (
    <FeatureScreen
      label="Billing"
      title="Payment successful"
      description="Your transaction was processed. Changes may take a moment to appear."
    >
      <Card className="mx-auto max-w-md border-success/20 bg-success/5">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="h-12 w-12 text-success" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-fg-primary">Thank you!</p>
          <p className="mt-2 text-sm text-fg-muted">
            You will receive a confirmation notification shortly.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/dashboard">
              <Button variant="brand">Go home</Button>
            </Link>
            <Link href="/settings">
              <Button variant="secondary">Settings</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </FeatureScreen>
  );
}
