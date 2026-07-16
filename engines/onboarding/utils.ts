import {
  FIRST_ONBOARDING_STEP,
  LAST_ONBOARDING_STEP,
  ONBOARDING_STEP_ORDER,
} from "./constants";
import type { OnboardingStep } from "./types";

export function isOnboardingStep(value: string): value is OnboardingStep {
  return (ONBOARDING_STEP_ORDER as readonly string[]).includes(value);
}

export function getStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEP_ORDER.indexOf(step);
}

export function getNextStep(current: OnboardingStep): OnboardingStep | null {
  const index = getStepIndex(current);
  if (index < 0 || index >= ONBOARDING_STEP_ORDER.length - 1) return null;
  return ONBOARDING_STEP_ORDER[index + 1];
}

export function getPreviousStep(current: OnboardingStep): OnboardingStep | null {
  const index = getStepIndex(current);
  if (index <= 0) return null;
  return ONBOARDING_STEP_ORDER[index - 1];
}

export function isFirstStep(step: OnboardingStep): boolean {
  return step === FIRST_ONBOARDING_STEP;
}

export function isLastStep(step: OnboardingStep): boolean {
  return step === LAST_ONBOARDING_STEP;
}

export function mergeDraft<T extends Record<string, unknown>>(
  current: T,
  patch: Partial<T>
): T {
  return { ...current, ...patch };
}
