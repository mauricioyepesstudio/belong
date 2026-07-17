import type {
  Community,
  Mission,
  Organization,
  OrganizationMemberRole,
  Project,
  UserProfile,
} from "@/types/database.types";
import type { SupabaseServerClient } from "./types";
import {
  nextLevelThreshold,
  progressToNextLevel,
  reputationLevelFromScore,
} from "@/engines/identity/reputation/calculate";

export type UserOrganization = Organization & {
  role: OrganizationMemberRole;
  memberCount: number;
  joinedAt: string;
};

export type DiscoverOrganization = Organization & {
  memberCount: number;
};

export type OrganizationMember = {
  id: string;
  userId: string;
  role: OrganizationMemberRole;
  joinedAt: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type OrganizationImpact = {
  totalImpact: number;
  reputationLevel: string;
  memberContributions: number;
  projectImpact: number;
  communityImpact: number;
  missionImpact: number;
};

export type OrganizationAnalytics = {
  healthScore: number;
  memberCount: number;
  projectCount: number;
  communityCount: number;
  missionCount: number;
  activeProjects: number;
  completedProjects: number;
  participationRate: number;
};

export type OrganizationReputation = {
  impactScore: number;
  reputationLevel: string;
  progressToNext: number;
  nextThreshold: number;
  totalEvents: number;
  memberContributions: number;
};

export type OrganizationDetail = {
  organization: Organization;
  owner: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
  memberCount: number;
  membership: { role: OrganizationMemberRole; joinedAt: string } | null;
  members: OrganizationMember[];
  communities: Community[];
  projects: Project[];
  missions: Mission[];
  impact: OrganizationImpact;
  analytics: OrganizationAnalytics;
  reputation: OrganizationReputation;
};

const MANAGER_ROLES: OrganizationMemberRole[] = ["owner", "admin", "manager"];
const ADMIN_ROLES: OrganizationMemberRole[] = ["owner", "admin"];

export function canManageOrganization(role: OrganizationMemberRole | null | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.includes(role));
}

export function canAdminOrganization(role: OrganizationMemberRole | null | undefined): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}

export function canWriteOrganization(role: OrganizationMemberRole | null | undefined): boolean {
  return Boolean(role && role !== "guest");
}

export async function fetchUserOrganizations(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<UserOrganization[]> {
  let query = supabase
    .from("organization_members")
    .select("role, organization_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: memberships } = await query;
  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.organization_id);
  const [{ data: organizations }, { data: allMembers }] = await Promise.all([
    supabase.from("organizations").select("*").in("id", ids),
    supabase.from("organization_members").select("organization_id").in("organization_id", ids),
  ]);

  if (!organizations) return [];

  const counts = new Map<string, number>();
  for (const row of allMembers ?? []) {
    counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);
  }

  return memberships
    .map((m) => {
      const organization = organizations.find((o) => o.id === m.organization_id);
      if (!organization) return null;
      return {
        ...organization,
        role: m.role,
        memberCount: counts.get(m.organization_id) ?? 1,
        joinedAt: m.joined_at,
      };
    })
    .filter((o): o is UserOrganization => o !== null);
}

export async function fetchDiscoverOrganizations(
  supabase: SupabaseServerClient,
  options?: { search?: string; limit?: number }
): Promise<DiscoverOrganization[]> {
  const limit = options?.limit ?? 48;
  let query = supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const search = options?.search?.trim();
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: organizations } = await query;
  if (!organizations?.length) return [];

  const ids = organizations.map((o) => o.id);
  const { data: members } = await supabase
    .from("organization_members")
    .select("organization_id")
    .in("organization_id", ids);

  const counts = new Map<string, number>();
  for (const row of members ?? []) {
    counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);
  }

  return organizations.map((organization) => ({
    ...organization,
    memberCount: counts.get(organization.id) ?? 0,
  }));
}

export async function fetchOrganizationMembership(
  supabase: SupabaseServerClient,
  organizationId: string,
  userId: string
): Promise<{ role: OrganizationMemberRole; joinedAt: string } | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("role, joined_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role, joinedAt: data.joined_at };
}

export async function fetchOrganizationMembers(
  supabase: SupabaseServerClient,
  organizationId: string
): Promise<OrganizationMember[]> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id, role, joined_at")
    .eq("organization_id", organizationId)
    .order("joined_at", { ascending: true });

  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, bio")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return members.map((m) => {
    const user = userMap.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      fullName: user?.full_name ?? null,
      avatarUrl: user?.avatar_url ?? null,
      bio: user?.bio ?? null,
    };
  });
}

function computeOrganizationAnalytics(input: {
  memberCount: number;
  projects: Project[];
  communities: Community[];
  missions: Mission[];
}): OrganizationAnalytics {
  const activeProjects = input.projects.filter((p) => p.status === "active").length;
  const completedProjects = input.projects.filter((p) => p.status === "completed").length;
  const participationRate =
    input.memberCount > 0
      ? Math.min(100, Math.round(((activeProjects + completedProjects) / input.memberCount) * 25))
      : 0;

  const healthScore = Math.min(
    100,
    Math.round(
      (input.memberCount > 0 ? 20 : 0) +
        Math.min(30, input.communities.length * 10) +
        Math.min(30, activeProjects * 8 + completedProjects * 5) +
        Math.min(20, input.missions.filter((m) => m.state === "active").length * 5)
    )
  );

  return {
    healthScore,
    memberCount: input.memberCount,
    projectCount: input.projects.length,
    communityCount: input.communities.length,
    missionCount: input.missions.length,
    activeProjects,
    completedProjects,
    participationRate,
  };
}

async function fetchOrganizationReputation(
  supabase: SupabaseServerClient,
  organization: Organization,
  memberUserIds: string[]
): Promise<OrganizationReputation> {
  const [{ count: orgEventCount }, { data: memberEvents }] = await Promise.all([
    supabase
      .from("impact_events")
      .select("*", { count: "exact", head: true })
      .eq("source_id", organization.id),
    memberUserIds.length
      ? supabase
          .from("impact_events")
          .select("points")
          .in("user_id", memberUserIds)
          .eq("module", "organization")
      : Promise.resolve({ data: [] as { points: number }[] }),
  ]);

  const memberContributions = (memberEvents ?? []).reduce((sum, row) => sum + row.points, 0);
  const impactScore = organization.impact_score;
  const reputationLevel =
    organization.reputation_level || reputationLevelFromScore(impactScore);

  return {
    impactScore,
    reputationLevel,
    progressToNext: progressToNextLevel(impactScore),
    nextThreshold: nextLevelThreshold(impactScore),
    totalEvents: orgEventCount ?? 0,
    memberContributions,
  };
}

export async function fetchOrganizationDetail(
  supabase: SupabaseServerClient,
  slug: string,
  currentUserId: string | null
): Promise<OrganizationDetail | null> {
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!organization) return null;

  const [
    membership,
    members,
    { data: owner },
    { data: communities },
    { data: projects },
    { data: missions },
    { count: memberCount },
  ] = await Promise.all([
    currentUserId
      ? fetchOrganizationMembership(supabase, organization.id, currentUserId)
      : Promise.resolve(null),
    fetchOrganizationMembers(supabase, organization.id),
    supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .eq("id", organization.owner_id)
      .maybeSingle(),
    supabase.from("communities").select("*").eq("organization_id", organization.id),
    supabase.from("projects").select("*").eq("organization_id", organization.id),
    supabase.from("missions").select("*").eq("organization_id", organization.id),
    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id),
  ]);

  const impact: OrganizationImpact = {
    totalImpact: organization.impact_score,
    reputationLevel: organization.reputation_level,
    memberContributions: members.length * 5,
    projectImpact: (projects ?? []).reduce((sum, p) => sum + p.progress, 0),
    communityImpact: (communities ?? []).length * 10,
    missionImpact: (missions ?? []).filter((m) => m.state === "completed").length * 15,
  };

  const analytics = computeOrganizationAnalytics({
    memberCount: memberCount ?? members.length,
    projects: projects ?? [],
    communities: communities ?? [],
    missions: missions ?? [],
  });

  const reputation = await fetchOrganizationReputation(
    supabase,
    organization,
    members.map((m) => m.userId)
  );

  return {
    organization,
    owner: owner ?? { id: organization.owner_id, full_name: null, avatar_url: null },
    memberCount: memberCount ?? members.length,
    membership,
    members,
    communities: communities ?? [],
    projects: projects ?? [],
    missions: missions ?? [],
    impact,
    analytics,
    reputation,
  };
}

export async function resolveUserOrganizationId(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId?: string | null
): Promise<string | null> {
  if (organizationId) {
    const membership = await fetchOrganizationMembership(supabase, organizationId, userId);
    if (membership && canWriteOrganization(membership.role)) return organizationId;
  }

  const orgs = await fetchUserOrganizations(supabase, userId, 1);
  if (orgs[0]) return orgs[0].id;

  return null;
}

export async function ensureDefaultOrganization(
  supabase: SupabaseServerClient,
  userId: string,
  fullName: string | null
): Promise<string> {
  const existing = await fetchUserOrganizations(supabase, userId, 1);
  if (existing[0]) return existing[0].id;

  const name = `${fullName?.trim() || "Builder"}'s Organization`;
  const slug = `org-${userId.replace(/-/g, "").slice(0, 12)}`;

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      description: "Default organization",
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    const { data: fallback } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (fallback) return fallback.id;
    throw new Error(error.message);
  }

  await supabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: userId,
    role: "owner",
  });

  return organization.id;
}
