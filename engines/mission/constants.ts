/**
 * BELONG Mission Engine — shared constants.
 * Sprint 2: structure only; stable identifiers for life-mission orchestration.
 */

export const MISSION_ENGINE_VERSION = "1.0.0" as const;

export const MISSION_STATES = {
  draft: "draft",
  discovering: "discovering",
  active: "active",
  paused: "paused",
  completed: "completed",
  archived: "archived",
} as const;

export const MISSION_CATEGORIES = {
  startup: "startup",
  career: "career",
  learn: "learn",
  health: "health",
  relationships: "relationships",
  community: "community",
  travel: "travel",
  creator: "creator",
  custom: "custom",
} as const;

export const TERMINAL_MISSION_STATES = [
  MISSION_STATES.completed,
  MISSION_STATES.archived,
] as const;

export const ACTIVE_MISSION_STATES = [
  MISSION_STATES.discovering,
  MISSION_STATES.active,
] as const;

export const MISSION_INSIGHT_TYPES = {
  progress: "progress",
  momentum: "momentum",
  alignment: "alignment",
  opportunity: "opportunity",
} as const;

export const MISSION_RECOMMENDATION_PRIORITIES = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;

export const DEFAULT_MISSION_STATE = MISSION_STATES.draft;

export const DEFAULT_RECOMMENDATIONS_LIMIT = 5;

export const DEFAULT_INSIGHTS_LIMIT = 5;
