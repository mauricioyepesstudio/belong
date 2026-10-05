import { SettingsView } from "@/engines/settings/components/settings-view";
import { Spinner } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth/session";
import { getBillingSummary } from "@/lib/data/billing";
import { getProfileData } from "@/engines/settings/data";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const [billing, profileData] = await Promise.all([getBillingSummary(), getProfileData()]);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SettingsView
        profile={profile}
        billing={billing}
        compatibility={profileData.compatibility}
      />
    </Suspense>
  );
}
