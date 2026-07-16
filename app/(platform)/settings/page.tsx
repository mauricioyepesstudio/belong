import { SettingsView } from "@/components/features/settings/settings-view";
import { getCurrentProfile } from "@/lib/auth/session";
import { getBillingSummary } from "@/lib/data/billing";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const billing = await getBillingSummary();
  return <SettingsView profile={profile} billing={billing} />;
}
