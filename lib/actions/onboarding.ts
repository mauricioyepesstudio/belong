"use server";

import { createOnboardingEngineService } from "@/engines/onboarding/server";
import { createClient } from "@/lib/supabase/server";
import type { BuildGoal } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OnboardingResult = { error?: string };

export async function completeOnboarding(data: {
  buildGoal: BuildGoal;
  buildVision?: string;
  fullName?: string;
}): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  await engine.start({ userId: user.id });
  await engine.saveDraft({ userId: user.id }, {
    buildGoal: data.buildGoal,
    buildVision: data.buildVision,
    fullName: data.fullName,
  });

  const result = await engine.complete(
    { userId: user.id },
    {
      buildGoal: data.buildGoal,
      buildVision: data.buildVision,
      fullName: data.fullName,
    }
  );

  if (result.error) return { error: result.error };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function startOnboarding(): Promise<{
  error?: string;
  session?: import("@/engines/onboarding/types").OnboardingSession;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  const result = await engine.start({ userId: user.id });
  if (result.error) return { error: result.error };
  return { session: result.data };
}

export async function resumeOnboarding(): Promise<{
  error?: string;
  session?: import("@/engines/onboarding/types").OnboardingSession | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  const result = await engine.resume({ userId: user.id });
  if (result.error) return { error: result.error };
  return { session: result.data };
}

export async function saveOnboardingDraft(
  draft: import("@/engines/onboarding/types").OnboardingStepInput
): Promise<{
  error?: string;
  session?: import("@/engines/onboarding/types").OnboardingSession;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  const result = await engine.saveDraft({ userId: user.id }, draft);
  if (result.error) return { error: result.error };
  return { session: result.data };
}

export async function advanceOnboardingStep(
  input?: import("@/engines/onboarding/types").OnboardingStepInput
): Promise<{
  error?: string;
  session?: import("@/engines/onboarding/types").OnboardingSession;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  const result = await engine.nextStep({ userId: user.id }, input);
  if (result.error) return { error: result.error };
  return { session: result.data };
}

export async function previousOnboardingStep(): Promise<{
  error?: string;
  session?: import("@/engines/onboarding/types").OnboardingSession;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const engine = createOnboardingEngineService(supabase);
  const result = await engine.previousStep({ userId: user.id });
  if (result.error) return { error: result.error };
  return { session: result.data };
}
