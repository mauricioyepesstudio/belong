"use server";

import { createClient } from "@/lib/supabase/server";
import { BUILD_GOALS } from "@/engines/mission/config";
import { syncUserSkill } from "@/lib/engine/mission-progress";
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

  const goalLabel =
    BUILD_GOALS.find((g) => g.id === data.buildGoal)?.label ?? data.buildGoal;

  const { error: profileError } = await supabase
    .from("users")
    .update({
      build_goal: data.buildGoal,
      build_vision: data.buildVision?.trim() || null,
      onboarding_completed: true,
      role: goalLabel,
      ...(data.fullName?.trim() ? { full_name: data.fullName.trim() } : {}),
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  const vision = data.buildVision?.trim();
  await supabase.from("missions").insert({
    user_id: user.id,
    title: `Build: ${goalLabel}`,
    description: vision || `Building toward ${goalLabel.toLowerCase()}.`,
    is_primary: true,
  });

  await syncUserSkill(supabase, user.id, goalLabel);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
