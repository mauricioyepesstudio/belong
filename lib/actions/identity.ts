"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createIdentityEngineService } from "@/engines/identity/services/identity-service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";

function parseList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateCompatibilityMetadata(input: {
  skills?: string;
  interests?: string;
  strengths?: string;
  values?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const service = createIdentityEngineService(supabase);

  try {
    await service.setCollections(
      { userId: profile.id },
      {
        skills: input.skills !== undefined ? parseList(input.skills) : undefined,
        interests: input.interests !== undefined ? parseList(input.interests) : undefined,
        strengths: input.strengths !== undefined ? parseList(input.strengths) : undefined,
        values: input.values !== undefined ? parseList(input.values) : undefined,
      }
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save compatibility data" };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  await trackServerEvent({
    name: "profile_updated",
    userId: profile.id,
    screen: AnalyticsScreen.SETTINGS,
    source: AnalyticsSource.PROFILE_COMPATIBILITY,
    entityId: profile.id,
  });

  return {};
}
