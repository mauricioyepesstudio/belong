import { fetchDiscoverCommunities } from "@/lib/core/communities";
import { fetchDiscoverOrganizations } from "@/lib/core/organizations";
import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  CommunityCandidate,
  MissionCandidate,
  OpportunityCandidatePool,
  OrganizationCandidate,
  PersonCandidate,
  ProjectCandidate,
} from "./types";

export async function fetchOpportunityCandidates(
  supabase: SupabaseServerClient,
  userId: string,
  joinedCommunityIds: string[],
  joinedProjectIds: string[],
  joinedOrganizationIds: string[]
): Promise<OpportunityCandidatePool> {
  const [
    people,
    projects,
    communities,
    organizations,
    dailyMissions,
    weeklyGoals,
  ] = await Promise.all([
    fetchPeopleCandidates(supabase, userId),
    fetchProjectCandidates(supabase, userId, joinedProjectIds),
    fetchCommunityCandidates(supabase, joinedCommunityIds),
    fetchOrganizationCandidates(supabase, joinedOrganizationIds),
    fetchDailyMissionCandidates(supabase, userId),
    fetchWeeklyGoalCandidates(supabase, userId),
  ]);

  return {
    people,
    projects,
    communities,
    organizations,
    missions: [...dailyMissions, ...weeklyGoals],
  };
}

async function fetchPeopleCandidates(
  supabase: SupabaseServerClient,
  userId: string
): Promise<PersonCandidate[]> {
  const [{ data: users }, { data: connections }, { data: identityRows }, { data: skillRows }, { data: memberRows }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, avatar_url, role, location, bio, build_goal")
        .neq("id", userId)
        .eq("onboarding_completed", true)
        .limit(40),
      supabase
        .from("connections")
        .select("requester_id, recipient_id, status")
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
      supabase.from("identity_profiles").select("user_id, interests"),
      supabase.from("user_skills").select("user_id, skill"),
      supabase.from("community_members").select("user_id, community_id"),
    ]);

  const excluded = new Set<string>();
  for (const connection of connections ?? []) {
    const otherId =
      connection.requester_id === userId ? connection.recipient_id : connection.requester_id;
    if (connection.status === "accepted" || connection.status === "pending") {
      excluded.add(otherId);
    }
  }

  const interestsByUser = new Map<string, string[]>();
  for (const row of identityRows ?? []) {
    interestsByUser.set(row.user_id, row.interests ?? []);
  }

  const skillsByUser = new Map<string, string[]>();
  for (const row of skillRows ?? []) {
    const list = skillsByUser.get(row.user_id) ?? [];
    list.push(row.skill);
    skillsByUser.set(row.user_id, list);
  }

  const communitiesByUser = new Map<string, string[]>();
  for (const row of memberRows ?? []) {
    const list = communitiesByUser.get(row.user_id) ?? [];
    list.push(row.community_id);
    communitiesByUser.set(row.user_id, list);
  }

  return (users ?? [])
    .filter((user) => !excluded.has(user.id))
    .map((user) => ({
      id: user.id,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      location: user.location,
      bio: user.bio,
      buildGoal: user.build_goal,
      skills: skillsByUser.get(user.id) ?? (user.role ? [user.role] : []),
      interests: interestsByUser.get(user.id) ?? [],
      communityIds: communitiesByUser.get(user.id) ?? [],
    }));
}

async function fetchProjectCandidates(
  supabase: SupabaseServerClient,
  userId: string,
  joinedProjectIds: string[]
): Promise<ProjectCandidate[]> {
  let query = supabase
    .from("projects")
    .select("id, name, description, status, community_id, communities(name, tag)")
    .neq("owner_id", userId)
    .in("status", ["planning", "active"])
    .order("updated_at", { ascending: false })
    .limit(24);

  if (joinedProjectIds.length > 0) {
    query = query.not("id", "in", `(${joinedProjectIds.join(",")})`);
  }

  const { data } = await query;

  return (data ?? []).map((project) => {
    const community = project.communities as { name?: string; tag?: string | null } | null;
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      communityId: project.community_id,
      communityName: community?.name ?? "Community project",
      communityTag: community?.tag ?? null,
    };
  });
}

async function fetchCommunityCandidates(
  supabase: SupabaseServerClient,
  joinedCommunityIds: string[]
): Promise<CommunityCandidate[]> {
  const joined = new Set(joinedCommunityIds);
  const communities = await fetchDiscoverCommunities(supabase, { limit: 24 });

  return communities
    .filter((community) => !joined.has(community.id))
    .map((community) => ({
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      tag: community.tag,
      memberCount: community.memberCount,
    }));
}

async function fetchOrganizationCandidates(
  supabase: SupabaseServerClient,
  joinedOrganizationIds: string[]
): Promise<OrganizationCandidate[]> {
  const joined = new Set(joinedOrganizationIds);
  const organizations = await fetchDiscoverOrganizations(supabase);

  const candidates = organizations.filter((org) => !joined.has(org.id)).slice(0, 16);
  if (candidates.length === 0) return [];

  const orgIds = candidates.map((org) => org.id);
  const { data: communityRows } = await supabase
    .from("communities")
    .select("organization_id, tag")
    .in("organization_id", orgIds);

  const tagsByOrg = new Map<string, string[]>();
  for (const row of communityRows ?? []) {
    if (!row.tag) continue;
    const list = tagsByOrg.get(row.organization_id) ?? [];
    list.push(row.tag);
    tagsByOrg.set(row.organization_id, list);
  }

  return candidates.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    communityTags: tagsByOrg.get(org.id) ?? [],
  }));
}

async function fetchDailyMissionCandidates(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MissionCandidate[]> {
  const { data } = await supabase
    .from("daily_missions")
    .select("id, title, description, action_href, status")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("sort_order", { ascending: true })
    .limit(8);

  return (data ?? []).map((mission) => ({
    id: mission.id,
    title: mission.title,
    description: mission.description,
    href: mission.action_href || "/dashboard",
    kind: "daily" as const,
    status: mission.status,
  }));
}

async function fetchWeeklyGoalCandidates(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MissionCandidate[]> {
  const { data } = await supabase
    .from("weekly_goals")
    .select("id, title, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("week_start", { ascending: false })
    .limit(4);

  return (data ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    description: null,
    href: "/dashboard#missions",
    kind: "weekly" as const,
    status: goal.status,
  }));
}
