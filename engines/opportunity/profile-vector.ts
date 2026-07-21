import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import type { CompatibilityProfile } from "./types";

export async function buildCompatibilityProfile(
  supabase: SupabaseServerClient,
  profile: UserProfile
): Promise<CompatibilityProfile> {
  const userId = profile.id;

  const [
    { data: identityProfile },
    { data: skillRows },
    { data: communityRows },
    { data: projectRows },
    { data: orgRows },
    { data: impactRows },
    { data: momentum },
  ] = await Promise.all([
    supabase
      .from("identity_profiles")
      .select("strengths, interests, values")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_skills").select("skill").eq("user_id", userId),
    supabase
      .from("community_members")
      .select("community_id, communities(name)")
      .eq("user_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
    supabase.from("organization_members").select("organization_id").eq("user_id", userId),
    supabase
      .from("impact_events")
      .select("module")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_momentum")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const communityIds: string[] = [];
  const communityNames: Record<string, string> = {};
  for (const row of communityRows ?? []) {
    communityIds.push(row.community_id);
    const community = row.communities as { name?: string } | null;
    if (community?.name) {
      communityNames[row.community_id] = community.name;
    }
  }

  const skills = (skillRows ?? []).map((row) => row.skill);
  if (profile.role && !skills.some((s) => s.toLowerCase() === profile.role!.toLowerCase())) {
    skills.push(profile.role);
  }

  const activityModules = [
    ...new Set((impactRows ?? []).map((row) => row.module).filter(Boolean)),
  ];

  return {
    userId,
    fullName: profile.full_name,
    role: profile.role,
    location: profile.location,
    bio: profile.bio,
    buildGoal: profile.build_goal,
    buildVision: profile.build_vision,
    skills,
    interests: identityProfile?.interests ?? [],
    strengths: identityProfile?.strengths ?? [],
    values: identityProfile?.values ?? [],
    communityIds,
    communityNames,
    projectIds: (projectRows ?? []).map((row) => row.project_id),
    organizationIds: (orgRows ?? []).map((row) => row.organization_id),
    activityModules,
    currentStreak: momentum?.current_streak ?? 0,
  };
}
