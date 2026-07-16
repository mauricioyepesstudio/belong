/**
 * BELONG Core Engine — shared constants.
 * Sprint 1: structure only; values are stable identifiers for orchestration.
 */

export const CORE_ENGINE_VERSION = "1.0.0" as const;

export const ENGINE_NAMES = {
  mission: "mission",
  impact: "impact",
  projects: "projects",
  community: "community",
  ai: "ai",
  weeklyGoals: "weeklyGoals",
} as const;

export const CORE_ENGINE_REGISTRY_ORDER = [
  ENGINE_NAMES.mission,
  ENGINE_NAMES.impact,
  ENGINE_NAMES.projects,
  ENGINE_NAMES.community,
  ENGINE_NAMES.ai,
  ENGINE_NAMES.weeklyGoals,
] as const;

export const DEFAULT_CORE_ENGINE_OPTIONS = {
  parallel: true,
  failFast: false,
} as const;
