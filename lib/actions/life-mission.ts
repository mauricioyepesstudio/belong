"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createMissionEngineService } from "@/engines/mission/service";
import { MISSION_STATES } from "@/engines/mission/constants";
import type { ActionResult } from "@/lib/actions/types";
import type { Mission, MissionProgress } from "@/engines/mission/types";
import { revalidatePath } from "next/cache";

function revalidateMissionPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

export async function saveLifeMission(data: {
  title: string;
  description?: string;
  vision?: string;
}): Promise<ActionResult & { mission?: Mission }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const title = data.title.trim();
  if (!title) return { error: "Title is required" };

  const service = createMissionEngineService(supabase);
  const existing = await service.getMission({ userId: profile.id });

  try {
    if (existing) {
      const mission = await service.updateMission({ userId: profile.id }, existing.id, {
        title,
        description: data.description?.trim() || null,
        vision: data.vision?.trim() || null,
        state: MISSION_STATES.active,
        isPrimary: true,
      });
      revalidateMissionPaths();
      return { mission };
    }

    const mission = await service.createMission({ userId: profile.id }, {
      title,
      description: data.description?.trim() || null,
      vision: data.vision?.trim() || null,
      state: MISSION_STATES.active,
      isPrimary: true,
      category: profile.build_goal ?? null,
    });

    if (data.vision?.trim()) {
      await supabase
        .from("users")
        .update({ build_vision: data.vision.trim() })
        .eq("id", profile.id);
    }

    revalidateMissionPaths();
    return { mission };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save life mission",
    };
  }
}

export async function refreshLifeMissionProgress(): Promise<MissionProgress | null> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const service = createMissionEngineService(supabase);
  const mission = await service.getMission({ userId: profile.id });
  if (!mission) return null;
  return service.calculateMissionProgress({ userId: profile.id }, mission.id);
}
