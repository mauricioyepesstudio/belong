import type { SupabaseServerClient } from "@/lib/core/types";
import type { ProjectWithMemberCount, UserCommunity, UserStats } from "@/lib/core";
import type { ConnectionSuggestion } from "@/engines/ai/coach-types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { MissionEngineData, WeeklyGoal } from "@/engines/mission/types";
import type { Notification } from "@/types/database.types";
import { todayUtc } from "@/engines/mission/hierarchy";

export type SmartHomeItem = {
  id: string;
  kind: "mission" | "project" | "community" | "notification" | "person";
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  priority: number;
};

export type DashboardTimeline = {
  todayMission: {
    id: string;
    title: string;
    href: string;
    status: string;
    impactPoints: number;
  } | null;
  activeProject: {
    id: string;
    name: string;
    status: string;
    href: string;
    memberCount: number;
  } | null;
  communityPulse: {
    title: string;
    communityName: string;
    href: string;
    createdAt: string;
  } | null;
  weeklyGoalProgress: number;
  weeklyGoalTitle: string | null;
  impactScore: number;
  weeklyImpactDelta: number;
  impactHistory: { date: string; score: number }[];
};

export type CrossModuleLink = {
  label: string;
  href: string;
  description: string;
};

export async function fetchCommunityPulse(
  supabase: SupabaseServerClient,
  userId: string,
  joinedCommunities: UserCommunity[]
): Promise<DashboardTimeline["communityPulse"]> {
  if (!joinedCommunities.length) return null;

  const communityIds = joinedCommunities.map((c) => c.id);
  const slugMap = new Map(joinedCommunities.map((c) => [c.id, c.slug]));
  const nameMap = new Map(joinedCommunities.map((c) => [c.id, c.name]));

  const { data: post } = await supabase
    .from("community_posts")
    .select("id, content, community_id, created_at, author_id")
    .in("community_id", communityIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!post) return null;

  const slug = slugMap.get(post.community_id);
  return {
    title: post.content.slice(0, 100) + (post.content.length > 100 ? "…" : ""),
    communityName: nameMap.get(post.community_id) ?? "Community",
    href: slug ? `/community/${slug}` : "/community",
    createdAt: post.created_at,
  };
}

export async function fetchProjectNeedingAttention(
  supabase: SupabaseServerClient,
  userId: string,
  recentProjects: ProjectWithMemberCount[]
): Promise<ProjectWithMemberCount | null> {
  const attention = recentProjects.filter(
    (p) => p.status === "planning" || p.status === "active"
  );
  if (attention.length) {
    return [...attention].sort(
      (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    )[0];
  }

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  const memberProjectIds = (memberRows ?? []).map((r) => r.project_id);
  if (!memberProjectIds.length) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .in("id", memberProjectIds)
    .in("status", ["planning", "active"])
    .order("updated_at", { ascending: true })
    .limit(1);

  const project = projects?.[0];
  if (!project) return null;

  return {
    ...project,
    memberCount: 0,
    community: null,
  };
}

export function buildDashboardTimeline(input: {
  missionEngine: MissionEngineData;
  recentProjects: ProjectWithMemberCount[];
  communityPulse: DashboardTimeline["communityPulse"];
  weeklyProgress: number;
  weeklyGoals: WeeklyGoal[];
  impactEngine: ImpactEngineData;
  activeProject: ProjectWithMemberCount | null;
}): DashboardTimeline {
  const today = todayUtc();
  const pendingToday = input.missionEngine.dailyMissions.find(
    (m) => m.status === "pending" && m.mission_date === today
  );
  const anyPending = input.missionEngine.dailyMissions.find((m) => m.status === "pending");
  const todayMission = pendingToday ?? anyPending ?? null;

  const activeWeekly = input.missionEngine.weeklyGoals.find((g) => g.status === "active");

  return {
    todayMission: todayMission
      ? {
          id: todayMission.id,
          title: todayMission.title,
          href: todayMission.action_href,
          status: todayMission.status,
          impactPoints: todayMission.impact_points,
        }
      : null,
    activeProject: input.activeProject
      ? {
          id: input.activeProject.id,
          name: input.activeProject.name,
          status: input.activeProject.status,
          href: `/projects/${input.activeProject.id}`,
          memberCount: input.activeProject.memberCount,
        }
      : null,
    communityPulse: input.communityPulse,
    weeklyGoalProgress: input.weeklyProgress,
    weeklyGoalTitle: activeWeekly?.title ?? null,
    impactScore: input.impactEngine.score.score,
    weeklyImpactDelta: input.impactEngine.weeklyImpact.points,
    impactHistory: input.impactEngine.history,
  };
}

export function buildSmartHomeStack(input: {
  missionEngine: MissionEngineData;
  projectNeedingAttention: ProjectWithMemberCount | null;
  communityPulse: DashboardTimeline["communityPulse"];
  stats: UserStats;
  recentNotifications: Notification[];
  connectionSuggestions: ConnectionSuggestion[];
}): SmartHomeItem[] {
  const items: SmartHomeItem[] = [];
  const today = todayUtc();

  const pendingMission =
    input.missionEngine.dailyMissions.find(
      (m) => m.status === "pending" && m.mission_date === today
    ) ?? input.missionEngine.dailyMissions.find((m) => m.status === "pending");

  if (pendingMission) {
    items.push({
      id: `mission-${pendingMission.id}`,
      kind: "mission",
      title: pendingMission.title,
      description:
        pendingMission.description ?? "Your highest-priority action today.",
      href: pendingMission.action_href,
      actionLabel: "Complete mission",
      priority: 1,
    });
  }

  if (input.projectNeedingAttention) {
    const p = input.projectNeedingAttention;
    items.push({
      id: `project-${p.id}`,
      kind: "project",
      title: p.name,
      description: `Project in ${p.status} — needs your attention.`,
      href: `/projects/${p.id}`,
      actionLabel: "Open project",
      priority: 2,
    });
  }

  if (input.communityPulse) {
    items.push({
      id: "community-pulse",
      kind: "community",
      title: input.communityPulse.communityName,
      description: input.communityPulse.title,
      href: input.communityPulse.href,
      actionLabel: "View update",
      priority: 3,
    });
  }

  if (input.stats.unreadNotifications > 0) {
    const latest = input.recentNotifications[0];
    items.push({
      id: "notifications",
      kind: "notification",
      title: `${input.stats.unreadNotifications} unread notification${input.stats.unreadNotifications === 1 ? "" : "s"}`,
      description: latest?.title ?? "Review what you missed across BELONG.",
      href: "/notifications",
      actionLabel: "Open inbox",
      priority: 4,
    });
  }

  for (const suggestion of input.connectionSuggestions.slice(0, 2)) {
    items.push({
      id: `person-${suggestion.id}`,
      kind: "person",
      title: suggestion.name,
      description: suggestion.reason,
      href: suggestion.actionHref,
      actionLabel: "Connect",
      priority: 5,
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

export function buildCrossModuleLinks(input: {
  timeline: DashboardTimeline;
  stats: UserStats;
}): CrossModuleLink[] {
  const { timeline, stats } = input;

  return [
    {
      label: "Mission",
      href: timeline.todayMission?.href ?? "#missions",
      description: timeline.todayMission?.title ?? "Set today's focus",
    },
    {
      label: "Project",
      href: timeline.activeProject?.href ?? "/projects",
      description: timeline.activeProject?.name ?? "Start or join a project",
    },
    {
      label: "Community",
      href: timeline.communityPulse?.href ?? "/community",
      description: timeline.communityPulse?.communityName ?? `${stats.communities} joined`,
    },
    {
      label: "Contribution",
      href: "/profile",
      description: "Log impact & contributions",
    },
    {
      label: "Impact",
      href: "/profile",
      description: `${timeline.impactScore} lifetime score`,
    },
  ];
}
