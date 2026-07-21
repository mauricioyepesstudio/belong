import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import { fetchOpportunityCandidates } from "./data";
import { scoreAllMatches } from "./matchers";
import {
  buildCompatibilityProfile,
  buildOpportunityGraphContext,
} from "./profile-vector";
import type { CompatibilityProfile, OpportunityRecommendations } from "./types";

export async function getOpportunityRecommendations(
  supabase: SupabaseServerClient,
  profile: UserProfile
): Promise<{
  profile: CompatibilityProfile;
  recommendations: OpportunityRecommendations;
}> {
  const compatibilityProfile = await buildCompatibilityProfile(supabase, profile);
  const [candidates, context] = await Promise.all([
    fetchOpportunityCandidates(
      supabase,
      profile.id,
      compatibilityProfile.communityIds,
      compatibilityProfile.projectIds,
      compatibilityProfile.organizationIds
    ),
    buildOpportunityGraphContext(supabase, compatibilityProfile),
  ]);

  const recommendations = scoreAllMatches(compatibilityProfile, candidates, context);

  return { profile: compatibilityProfile, recommendations };
}

export async function getCompatibilityProfile(
  supabase: SupabaseServerClient,
  profile: UserProfile
): Promise<CompatibilityProfile> {
  return buildCompatibilityProfile(supabase, profile);
}
