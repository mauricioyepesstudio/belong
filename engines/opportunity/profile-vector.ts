import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import type { CompatibilityProfile, OpportunityGraphContext } from "./types";

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
    { data: connections },
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
    supabase
      .from("project_members")
      .select("project_id, projects(name)")
      .eq("user_id", userId),
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
    supabase
      .from("connections")
      .select("requester_id, recipient_id, status")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted"),
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

  const projectIds: string[] = [];
  const projectNames: Record<string, string> = {};
  for (const row of projectRows ?? []) {
    projectIds.push(row.project_id);
    const project = row.projects as { name?: string } | null;
    if (project?.name) {
      projectNames[row.project_id] = project.name;
    }
  }

  const connectionIds: string[] = [];
  const connectionNames: Record<string, string> = {};
  for (const row of connections ?? []) {
    const otherId = row.requester_id === userId ? row.recipient_id : row.requester_id;
    connectionIds.push(otherId);
  }

  if (connectionIds.length > 0) {
    const { data: connectionUsers } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", connectionIds);
    for (const user of connectionUsers ?? []) {
      connectionNames[user.id] = user.full_name ?? "Builder";
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
    projectIds,
    projectNames,
    organizationIds: (orgRows ?? []).map((row) => row.organization_id),
    activityModules,
    currentStreak: momentum?.current_streak ?? 0,
    connectionIds,
    connectionNames,
  };
}

export async function buildOpportunityGraphContext(
  supabase: SupabaseServerClient,
  profile: CompatibilityProfile
): Promise<OpportunityGraphContext> {
  const [{ data: memberRows }, { data: users }] = await Promise.all([
    profile.communityIds.length > 0
      ? supabase
          .from("community_members")
          .select("community_id, user_id")
          .in("community_id", profile.communityIds)
      : Promise.resolve({ data: [] as { community_id: string; user_id: string }[] }),
    supabase.from("users").select("id, full_name").eq("onboarding_completed", true).limit(200),
  ]);

  const membersByCommunity: Record<string, string[]> = {};
  for (const row of memberRows ?? []) {
    if (!membersByCommunity[row.community_id]) membersByCommunity[row.community_id] = [];
    membersByCommunity[row.community_id].push(row.user_id);
  }

  const userNames: Record<string, string> = {};
  for (const user of users ?? []) {
    userNames[user.id] = user.full_name ?? "Builder";
  }
  for (const [id, name] of Object.entries(profile.connectionNames)) {
    userNames[id] = name;
  }

  return { membersByCommunity, userNames };
}

export function resolveMutualCollaborators(
  profile: CompatibilityProfile,
  candidateCommunityIds: string[],
  candidateProjectIds: string[],
  context: OpportunityGraphContext
): string[] {
  const connectionSet = new Set(profile.connectionIds);
  const names = new Set<string>();

  const sharedCommunityIds = profile.communityIds.filter((id) =>
    candidateCommunityIds.includes(id)
  );

  for (const communityId of sharedCommunityIds) {
    const members = context.membersByCommunity[communityId] ?? [];
    for (const memberId of members) {
      if (memberId === profile.userId) continue;
      if (connectionSet.has(memberId)) {
        names.add(context.userNames[memberId] ?? "Builder");
      }
    }
  }

  return [...names].slice(0, 6);
}

export function resolveSharedCommunityNames(
  profile: CompatibilityProfile,
  candidateCommunityIds: string[]
): string[] {
  return candidateCommunityIds
    .filter((id) => profile.communityIds.includes(id))
    .map((id) => profile.communityNames[id] ?? "Shared community");
}

export function resolveSharedProjectNames(
  profile: CompatibilityProfile,
  candidateProjectIds: string[]
): string[] {
  return candidateProjectIds
    .filter((id) => profile.projectIds.includes(id))
    .map((id) => profile.projectNames[id] ?? "Shared project");
}
