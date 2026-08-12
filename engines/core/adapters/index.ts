import { aiService } from "@/engines/ai/service";
import type { AIContext } from "@/engines/ai/types";
import { fetchImpactEngineData } from "@/engines/impact/data";
import { fetchMissionEngineData } from "@/engines/mission/engine";
import { fetchUserStats, getAllProjectsForUser, joinMembershipsWithCommunities } from "@/lib/core";
import { ENGINE_NAMES } from "../constants";
import type {
  AIEngineAdapter,
  CommunityEngineAdapter,
  CoreEngineContext,
  CoreEngineOptions,
  CoreEngineResult,
  DiscoverCommunity,
  ImpactEngineAdapter,
  MissionEngineAdapter,
  MissionEngineResult,
  ProjectsEngineAdapter,
  WeeklyGoalsEngineAdapter,
} from "../types";

export function createMissionEngineAdapter(): MissionEngineAdapter {
  return {
    name: ENGINE_NAMES.mission,
    async fetch(context) {
      const stats =
        context.runtime?.stats ??
        (await fetchUserStats(context.supabase, context.userId));
      return fetchMissionEngineData(
        context.supabase,
        context.userId,
        context.profile,
        stats
      );
    },
  };
}

export function createImpactEngineAdapter(): ImpactEngineAdapter {
  return {
    name: ENGINE_NAMES.impact,
    async fetch(context, mission) {
      const runtime = context.runtime;
      if (!runtime) {
        throw new Error("ImpactEngineAdapter requires CoreEngineContext.runtime");
      }

      return fetchImpactEngineData(
        context.supabase,
        context.userId,
        context.profile,
        runtime.stats,
        runtime.hasMission,
        mission?.lifeMissionProgress?.completionPercent ?? 0
      );
    },
  };
}

export function createProjectsEngineAdapter(): ProjectsEngineAdapter {
  return {
    name: ENGINE_NAMES.projects,
    async fetch(context, options) {
      const all = await getAllProjectsForUser(context.supabase, context.userId);
      const active = all.filter((p) => p.status === "active" || p.status === "planning");
      const limit = options?.recentProjectLimit ?? 4;
      return { recent: active.slice(0, limit), total: all.length };
    },
  };
}

export function createCommunityEngineAdapter(): CommunityEngineAdapter {
  return {
    name: ENGINE_NAMES.community,
    async fetch(context, options) {
      const limit = options?.discoverCommunityLimit ?? 12;
      const joined = await joinMembershipsWithCommunities(
        context.supabase,
        context.userId,
        6
      );

      const { data: discoverAll } = await context.supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24);

      const joinedIds = new Set(joined.map((c) => c.id));
      const discoverBase = (discoverAll ?? [])
        .filter((c) => !joinedIds.has(c.id))
        .slice(0, limit);

      const discoverCounts = new Map<string, number>();
      if (discoverBase.length > 0) {
        const { data: discoverMembers } = await context.supabase
          .from("community_members")
          .select("community_id")
          .in("community_id", discoverBase.map((c) => c.id));

        for (const row of discoverMembers ?? []) {
          discoverCounts.set(row.community_id, (discoverCounts.get(row.community_id) ?? 0) + 1);
        }
      }

      const discover: DiscoverCommunity[] = discoverBase.map((c) => ({
        ...c,
        memberCount: discoverCounts.get(c.id) ?? 0,
      }));

      return { joined, discover };
    },
  };
}

export function createWeeklyGoalsEngineAdapter(): WeeklyGoalsEngineAdapter {
  return {
    name: ENGINE_NAMES.weeklyGoals,
    async fetch(_context, mission) {
      return {
        goals: mission.weeklyGoals,
        primary:
          mission.weeklyGoals.find((g) => g.status === "active") ??
          mission.weeklyGoals[0] ??
          null,
        progress: mission.weeklyProgress,
        momentum: mission.momentum,
      };
    },
  };
}

export function createAIEngineAdapter(): AIEngineAdapter {
  return {
    name: ENGINE_NAMES.ai,
    async fetch(context, snapshot) {
      const runtime = context.runtime;
      const aiContext: AIContext = {
        connections: runtime?.stats.connections ?? 0,
        pendingConnections: runtime?.stats.pendingConnections ?? 0,
        projects: snapshot.projects.total,
        communities: snapshot.community.joined.length,
        unreadNotifications: runtime?.stats.unreadNotifications ?? 0,
        unreadMessages: runtime?.stats.unreadMessages ?? 0,
        hasMission: runtime?.hasMission ?? false,
        buildGoal: context.profile.build_goal,
        impactLevel: snapshot.impact.score.level,
        streak: snapshot.mission.momentum.current_streak,
      };

      return {
        context: aiContext,
        insights: aiService.generateInsights(aiContext),
      };
    },
  };
}

export function createDefaultEngineAdapters() {
  return [
    createMissionEngineAdapter(),
    createImpactEngineAdapter(),
    createProjectsEngineAdapter(),
    createCommunityEngineAdapter(),
    createWeeklyGoalsEngineAdapter(),
    createAIEngineAdapter(),
  ];
}

export type PartialCoreEngineSnapshot = Partial<
  Pick<CoreEngineResult, "mission" | "impact" | "projects" | "community" | "weeklyGoals" | "ai">
>;

export async function invokeAdapterFetch(
  adapter: CoreEngineAdapterUnion,
  context: CoreEngineContext,
  snapshot: PartialCoreEngineSnapshot,
  options?: CoreEngineOptions
): Promise<unknown> {
  switch (adapter.name) {
    case ENGINE_NAMES.mission:
      return (adapter as MissionEngineAdapter).fetch(context, options);
    case ENGINE_NAMES.impact:
      return (adapter as ImpactEngineAdapter).fetch(
        context,
        snapshot.mission as MissionEngineResult,
        options
      );
    case ENGINE_NAMES.projects:
      return (adapter as ProjectsEngineAdapter).fetch(context, options);
    case ENGINE_NAMES.community:
      return (adapter as CommunityEngineAdapter).fetch(context, options);
    case ENGINE_NAMES.weeklyGoals:
      return (adapter as WeeklyGoalsEngineAdapter).fetch(
        context,
        snapshot.mission as MissionEngineResult,
        options
      );
    case ENGINE_NAMES.ai:
      return (adapter as AIEngineAdapter).fetch(
        context,
        snapshot as Pick<
          CoreEngineResult,
          "mission" | "impact" | "projects" | "community" | "weeklyGoals"
        >,
        options
      );
    default:
      throw new Error(`Unknown adapter: ${(adapter as { name: string }).name}`);
  }
}

type CoreEngineAdapterUnion =
  | MissionEngineAdapter
  | ImpactEngineAdapter
  | ProjectsEngineAdapter
  | CommunityEngineAdapter
  | WeeklyGoalsEngineAdapter
  | AIEngineAdapter;
