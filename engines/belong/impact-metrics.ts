import type { SupabaseServerClient } from "@/lib/core/types";
import type { DailyMission } from "@/engines/mission/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { UserCommunity } from "@/lib/core/communities";

export type PersonalImpact = {
  peopleHelped: number;
  hoursContributed: number;
  rippleScore: number;
  reputation: number;
  reputationLabel: string;
  level: string;
  progressToNext: number;
  nextLevelAt: number;
};

export function calculatePersonalImpact(
  stats: {
    connections: number;
    communities: number;
    projects: number;
  },
  impactEngine: ImpactEngineData,
  metrics: {
    messagesSent: number;
    eventsAttended: number;
    dailyMissionsCompleted: number;
    communityContributions: number;
  }
): PersonalImpact {
  const peopleHelped =
    stats.connections +
    Math.floor(metrics.messagesSent / 3) +
    metrics.communityContributions * 2 +
    impactEngine.founderReputation.totalMembers;

  const hoursContributed = Math.round(
    metrics.dailyMissionsCompleted * 0.5 +
      metrics.eventsAttended * 2 +
      metrics.communityContributions * 0.25 +
      Math.min(metrics.messagesSent * 0.05, 10)
  );

  return {
    peopleHelped,
    hoursContributed: Math.max(hoursContributed, metrics.dailyMissionsCompleted > 0 ? 1 : 0),
    rippleScore: impactEngine.score.score,
    reputation: impactEngine.founderReputation.score,
    reputationLabel: impactEngine.founderReputation.label,
    level: impactEngine.score.level,
    progressToNext: impactEngine.progressToNext,
    nextLevelAt: impactEngine.nextLevelAt,
  };
}

export function estimateMissionReach(
  mission: DailyMission,
  stats: {
    connections: number;
    communities: number;
    pendingConnections: number;
  },
  communities: UserCommunity[],
  impactEngine: ImpactEngineData
): number {
  const title = mission.title.toLowerCase();

  if (title.includes("connection")) {
    return Math.max(stats.pendingConnections, stats.connections, 1);
  }
  if (title.includes("community") || title.includes("contribute")) {
    const reach = communities.length * 12 + impactEngine.communityContributionPoints;
    return Math.max(reach, 8);
  }
  if (title.includes("project")) {
    return Math.max(stats.connections + 3, 5);
  }
  if (title.includes("message") || title.includes("respond")) {
    return Math.max(Math.floor(stats.connections * 1.5), 3);
  }

  return Math.max(
    stats.connections + stats.communities * 4 + impactEngine.founderReputation.totalMembers,
    3
  );
}
