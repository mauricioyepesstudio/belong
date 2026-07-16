import type { BuildGoal } from "@/types/database.types";
import type { ONBOARDING_STEPS } from "./constants";

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export type OnboardingSessionStatus = "in_progress" | "completed" | "abandoned";

export type OnboardingProjectDraft = {
  name: string;
  description?: string | null;
  deadline?: string | null;
};

export type OnboardingWeeklyGoalDraft = {
  title: string;
  description?: string | null;
  targetCount?: number;
};

export type OnboardingDraft = {
  buildGoal?: BuildGoal;
  fullName?: string;
  buildVision?: string;
  missionTitle?: string;
  project?: OnboardingProjectDraft;
  weeklyGoal?: OnboardingWeeklyGoalDraft;
};

/** Reserved for future AI-guided onboarding recommendations. */
export type OnboardingAIRecommendation = {
  id: string;
  step: OnboardingStep;
  title: string;
  description: string;
  actionLabel?: string;
  priority: "high" | "medium" | "low";
};

export type OnboardingSession = {
  userId: string;
  currentStep: OnboardingStep;
  draft: OnboardingDraft;
  status: OnboardingSessionStatus;
  createdAt: string;
  updatedAt: string;
  recommendations?: OnboardingAIRecommendation[];
};

export type OnboardingEngineContext = {
  userId: string;
};

export type OnboardingStepInput = Partial<OnboardingDraft>;

export type OnboardingCompleteInput = OnboardingDraft & {
  buildGoal: BuildGoal;
};

export type OnboardingCompleteResult = {
  session: OnboardingSession;
  missionId: string;
  projectId?: string;
  weeklyGoalId?: string;
};

export type OnboardingEngineResult<T = void> = {
  data?: T;
  error?: string;
};

/** Future hook for AI-powered onboarding guidance. */
export interface OnboardingAIProvider {
  getRecommendations(session: OnboardingSession): Promise<OnboardingAIRecommendation[]>;
}

export type { BuildGoal };
