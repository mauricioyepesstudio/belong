import { OpportunityScreen, getOpportunityRecommendations } from "@/engines/opportunity";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { recommendations } = await getOpportunityRecommendations(supabase, profile);

  return <OpportunityScreen recommendations={recommendations} userId={profile.id} />;
}
