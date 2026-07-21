import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import { fetchOpportunityCandidates } from "./data";
import { scoreAllMatches } from "./matchers";
import { buildCompatibilityProfile } from "./profile-vector";
import type { CompatibilityProfile, OpportunityRecommendations } from "./types";

export async function getOpportunityRecommendations(
  supabase: SupabaseServerClient,
  profile: UserProfile
): Promise<{
  profile: CompatibilityProfile;
  recommendations: OpportunityRecommendations;
}> {
  const compatibilityProfile = await buildCompatibilityProfile(supabase, profile);
  const candidates = await fetchOpportunityCandidates(
    supabase,
    profile.id,
    compatibilityProfile.communityIds,
    compatibilityProfile.projectIds,
    compatibilityProfile.organizationIds
  );

  const recommendations = scoreAllMatches(compatibilityProfile, candidates);

  return { profile: compatibilityProfile, recommendations };
}

export async function getCompatibilityProfile(
  supabase: SupabaseServerClient,
  profile: UserProfile
): Promise<CompatibilityProfile> {
  return buildCompatibilityProfile(supabase, profile);
}
