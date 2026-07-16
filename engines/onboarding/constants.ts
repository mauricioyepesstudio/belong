/**
 * BELONG Onboarding Engine — shared constants.
 */

export const ONBOARDING_ENGINE_VERSION = "1.0.0" as const;

export const ONBOARDING_STEPS = {
  purpose: "purpose",
  lifeMission: "life_mission",
  firstProject: "first_project",
  weeklyGoal: "weekly_goal",
} as const;

export const ONBOARDING_STEP_ORDER = [
  ONBOARDING_STEPS.purpose,
  ONBOARDING_STEPS.lifeMission,
  ONBOARDING_STEPS.firstProject,
  ONBOARDING_STEPS.weeklyGoal,
] as const;

export const FIRST_ONBOARDING_STEP = ONBOARDING_STEPS.purpose;

export const LAST_ONBOARDING_STEP = ONBOARDING_STEPS.weeklyGoal;

export const ONBOARDING_SESSION_STATUS = {
  inProgress: "in_progress",
  completed: "completed",
  abandoned: "abandoned",
} as const;

export const DEFAULT_WEEKLY_GOAL_TARGET = 1;

export const DEFAULT_WEEKLY_GOAL_IMPACT = 35;
