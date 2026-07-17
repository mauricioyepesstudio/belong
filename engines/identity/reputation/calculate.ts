import type { ImpactEventModule, ImpactEventType, ReputationScores } from "./types";

export const IMPACT_EVENT_POINTS: Partial<Record<ImpactEventType, number>> = {
  mission_completed: 10,
  weekly_goal_completed: 25,
  quarterly_goal_completed: 50,
  community_join: 5,
  community_post: 10,
  community_comment: 5,
  community_like: 2,
  project_created: 18,
  project_join: 8,
  project_post: 6,
  project_comment: 4,
  project_completed: 30,
  project_task_created: 5,
  project_task_completed: 8,
  project_file_uploaded: 6,
  project_goal_completed: 15,
  project_milestone_completed: 12,
  organization_created: 20,
  organization_join: 10,
  organization_invite_accepted: 8,
  ai_copilot_applied: 6,
  streak_activity: 3,
  connection_accepted: 12,
};

export const MODULE_LABELS: Record<ImpactEventModule, string> = {
  mission: "Mission Engine",
  community: "Community",
  project: "Projects",
  organization: "Organizations",
  system: "Platform",
};

export function defaultPointsForEvent(eventType: ImpactEventType, override?: number): number {
  if (override != null && override > 0) return override;
  return IMPACT_EVENT_POINTS[eventType] ?? 5;
}

export function computeReputationScores(input: {
  eventPointsByModule: Record<ImpactEventModule, number>;
  eventCountsByType: Partial<Record<ImpactEventType, number>>;
  founderReputation: number;
  connections: number;
  projectsJoined: number;
  missionsCompleted: number;
  missionsTotal: number;
  projectsCompleted: number;
  projectsTotal: number;
  communityContributionPoints: number;
}): ReputationScores {
  const missionPoints = input.eventPointsByModule.mission;
  const communityPoints = input.eventPointsByModule.community;
  const projectPoints = input.eventPointsByModule.project;

  const collaborationEvents =
    (input.eventCountsByType.project_join ?? 0) +
    (input.eventCountsByType.project_comment ?? 0) +
    (input.eventCountsByType.community_comment ?? 0) +
    (input.eventCountsByType.connection_accepted ?? 0);

  const collaborationScore =
    input.connections * 4 +
    input.projectsJoined * 6 +
    collaborationEvents * 3;

  const missionCompletionRate =
    input.missionsTotal > 0
      ? Math.round((input.missionsCompleted / input.missionsTotal) * 100)
      : 0;

  const projectCompletionScore =
    input.projectsTotal > 0
      ? Math.round((input.projectsCompleted / input.projectsTotal) * 100)
      : 0;

  const reputationScore =
    missionPoints +
    communityPoints +
    projectPoints +
    Math.floor(input.founderReputation / 2) +
    Math.floor(collaborationScore / 3);

  return {
    reputationScore,
    founderScore: input.founderReputation,
    collaborationScore,
    communityContributionScore: input.communityContributionPoints || communityPoints,
    projectCompletionScore,
    missionCompletionRate,
  };
}

export function reputationLevelFromScore(totalImpact: number): string {
  if (totalImpact >= 500) return "Legend";
  if (totalImpact >= 350) return "Impact Builder";
  if (totalImpact >= 200) return "Momentum";
  if (totalImpact >= 100) return "Growing";
  if (totalImpact >= 50) return "Starting";
  return "Emerging";
}

export const LEVEL_THRESHOLDS = [50, 100, 200, 350, 500];

export function nextLevelThreshold(score: number): number {
  for (const t of LEVEL_THRESHOLDS) {
    if (score < t) return t;
  }
  return 500;
}

export function progressToNextLevel(score: number): number {
  const next = nextLevelThreshold(score);
  const prev = LEVEL_THRESHOLDS.filter((t) => t <= score).pop() ?? 0;
  if (next === prev) return 100;
  return Math.min(100, Math.round(((score - prev) / (next - prev)) * 100));
}

export function founderLabel(score: number): string {
  if (score >= 100) return "Established Founder";
  if (score >= 50) return "Rising Founder";
  if (score >= 20) return "Community Builder";
  return "Emerging Founder";
}
