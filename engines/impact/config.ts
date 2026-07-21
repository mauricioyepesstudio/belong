import type { ImpactEventType } from "@/engines/identity/reputation/types";

/**
 * Impact Score v1 — configurable points for meaningful participation.
 * Not a popularity score; awards existing platform actions only.
 */
export const IMPACT_SCORE_POINTS: Record<ImpactEventType, number> = {
  project_created: 5,
  community_join: 3,
  mission_completed: 5,
  community_post: 2,
  project_post: 2,
  helpful_reaction_received: 2,
  collaboration_started: 3,
  event_organized: 4,
  profile_completed: 1,
  organization_join: 2,

  weekly_goal_completed: 5,
  quarterly_goal_completed: 10,
  community_comment: 1,
  community_like: 1,
  project_join: 3,
  project_comment: 1,
  project_completed: 5,
  project_task_created: 1,
  project_task_completed: 2,
  project_file_uploaded: 1,
  project_goal_completed: 3,
  project_milestone_completed: 3,
  organization_created: 4,
  organization_invite_accepted: 2,
  ai_copilot_applied: 1,
  streak_activity: 1,
  connection_accepted: 3,
};

export const IMPACT_ACTION_LABELS: Partial<Record<ImpactEventType, string>> = {
  project_created: "Created a project",
  community_join: "Joined a community",
  mission_completed: "Completed a mission",
  community_post: "Published a post",
  project_post: "Published a project update",
  helpful_reaction_received: "Received a Helpful reaction",
  collaboration_started: "Started a collaboration",
  event_organized: "Organized an event",
  profile_completed: "Completed profile",
  organization_join: "Joined an organization",
  weekly_goal_completed: "Completed a weekly goal",
  quarterly_goal_completed: "Completed a quarterly goal",
  community_comment: "Commented in a community",
  community_like: "Engaged with a post",
  project_join: "Joined a project",
  project_comment: "Commented on a project",
  project_completed: "Completed a project",
  connection_accepted: "Connected with someone",
};

export function getImpactPoints(eventType: ImpactEventType, override?: number): number {
  if (override != null && override > 0) return override;
  return IMPACT_SCORE_POINTS[eventType] ?? 1;
}

export function getImpactActionLabel(eventType: ImpactEventType): string {
  return (
    IMPACT_ACTION_LABELS[eventType] ??
    eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
