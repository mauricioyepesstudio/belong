import { SettingsView } from "@/components/features/settings/settings-view";
import { Spinner } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth/session";
import { getBillingSummary } from "@/lib/data/billing";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const billing = await getBillingSummary();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SettingsView profile={profile} billing={billing} />
    </Suspense>
  );
}
