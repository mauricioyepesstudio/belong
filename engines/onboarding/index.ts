// Constants
export {
  ONBOARDING_ENGINE_VERSION,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_ORDER,
  FIRST_ONBOARDING_STEP,
  LAST_ONBOARDING_STEP,
  ONBOARDING_SESSION_STATUS,
  DEFAULT_WEEKLY_GOAL_TARGET,
  DEFAULT_WEEKLY_GOAL_IMPACT,
} from "./constants";

// Types
export type {
  OnboardingStep,
  OnboardingSessionStatus,
  OnboardingProjectDraft,
  OnboardingWeeklyGoalDraft,
  OnboardingDraft,
  OnboardingAIRecommendation,
  OnboardingSession,
  OnboardingEngineContext,
  OnboardingStepInput,
  OnboardingCompleteInput,
  OnboardingCompleteResult,
  OnboardingEngineResult,
  OnboardingAIProvider,
  BuildGoal,
} from "./types";

// Contracts
export type { OnboardingEngineService, OnboardingEngineFactory } from "./onboarding-engine";

// Utilities
export {
  isOnboardingStep,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  isFirstStep,
  isLastStep,
  mergeDraft,
} from "./utils";
