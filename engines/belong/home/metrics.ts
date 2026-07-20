import type { ImpactEngineData } from "@/engines/impact/types";
import type { ReputationProfile } from "@/engines/identity/reputation";
import type { UserStats } from "@/lib/core";
import type { HomeImpactMetrics } from "./types";

export function buildHomeImpactMetrics(input: {
  stats: UserStats;
  impactEngine: ImpactEngineData;
  reputation: ReputationProfile;
}): HomeImpactMetrics {
  const communityEvents = input.reputation.eventTotals.find((t) => t.module === "community");
  const projectEvents = input.reputation.eventTotals.find((t) => t.module === "project");
  const connectionEvents = input.reputation.recentEvents.filter(
    (e) => e.eventType === "connection_accepted"
  ).length;

  return {
    peopleHelped:
      (communityEvents?.count ?? 0) +
      input.reputation.recentEvents.filter((e) =>
        ["community_comment", "community_post", "community_like"].includes(e.eventType)
      ).length,
    projectsBuilt: projectEvents?.count ?? input.stats.projects,
    collaborations: Math.max(input.stats.connections, connectionEvents),
    communities: input.stats.communities,
    impactScore: input.impactEngine.score.score ?? 0,
  };
}
