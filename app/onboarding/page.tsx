import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getCurrentProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  return <OnboardingFlow initialName={profile?.full_name ?? ""} />;
}
