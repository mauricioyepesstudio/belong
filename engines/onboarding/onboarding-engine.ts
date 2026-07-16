import type {
  OnboardingAIProvider,
  OnboardingCompleteInput,
  OnboardingCompleteResult,
  OnboardingDraft,
  OnboardingEngineContext,
  OnboardingEngineResult,
  OnboardingSession,
  OnboardingStepInput,
} from "./types";

/**
 * Onboarding Engine service contract.
 * Guides new users through Purpose → Life Mission → First Project → Weekly Goal.
 */
export interface OnboardingEngineService {
  start(context: OnboardingEngineContext): Promise<OnboardingEngineResult<OnboardingSession>>;

  nextStep(
    context: OnboardingEngineContext,
    input?: OnboardingStepInput
  ): Promise<OnboardingEngineResult<OnboardingSession>>;

  previousStep(
    context: OnboardingEngineContext
  ): Promise<OnboardingEngineResult<OnboardingSession>>;

  saveDraft(
    context: OnboardingEngineContext,
    draft: OnboardingStepInput
  ): Promise<OnboardingEngineResult<OnboardingSession>>;

  resume(context: OnboardingEngineContext): Promise<OnboardingEngineResult<OnboardingSession | null>>;

  complete(
    context: OnboardingEngineContext,
    input: OnboardingCompleteInput
  ): Promise<OnboardingEngineResult<OnboardingCompleteResult>>;
}

export interface OnboardingEngineFactory {
  create(aiProvider?: OnboardingAIProvider): OnboardingEngineService;
}
