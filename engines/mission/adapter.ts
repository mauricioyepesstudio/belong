import type { CoreEngineContext } from "@/engines/core/types";
import type { SupabaseServerClient } from "@/lib/core/types";
import { createMissionEngineService } from "./service";
import type { MissionEngineService } from "./mission-engine";
import type { Mission, MissionEngineContext } from "./types";

/**
 * Adapter bridging Core Engine context to the Life Mission service.
 * Keeps database types out of UI and Core Engine consumers.
 */
export function createLifeMissionAdapter(supabase: SupabaseServerClient) {
  const service = createMissionEngineService(supabase);

  return {
    async getPrimaryMission(context: CoreEngineContext): Promise<Mission | null> {
      return service.getMission(toMissionContext(context));
    },

    async getMission(context: CoreEngineContext, missionId: string): Promise<Mission | null> {
      return service.getMission(toMissionContext(context), missionId);
    },

    service,
  };
}

export type LifeMissionAdapter = ReturnType<typeof createLifeMissionAdapter>;

function toMissionContext(context: CoreEngineContext): MissionEngineContext {
  return { userId: context.userId };
}

export type { MissionEngineService };
