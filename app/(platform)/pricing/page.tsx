import { PricingCards } from "@/engines/billing";
import { FeatureScreen } from "@/systems/design-system";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <FeatureScreen
      label="Pricing"
      title="Choose your plan"
      description="Unlock premium features and creator tools to grow your mission on BELONG."
    >
      <PricingCards currentTier={profile.subscription_tier ?? "free"} />
    </FeatureScreen>
  );
}
