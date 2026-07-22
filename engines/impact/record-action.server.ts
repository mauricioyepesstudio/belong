import "server-only";

import type { SupabaseServerClient } from "@/lib/core/types";
import {
  recordImpactEvent,
  type ImpactEvent,
  type RecordImpactEventInput,
} from "@/engines/identity/reputation";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";
import { getImpactPoints } from "./config";

export type RecordImpactActionInput = Omit<RecordImpactEventInput, "points"> & {
  points?: number;
};

function mapDbRowToImpactEvent(row: {
  id: string;
  user_id: string;
  module: ImpactEvent["module"];
  event_type: string;
  points: number;
  source_id: string | null;
  metadata: ImpactEvent["metadata"];
  created_at: string;
}): ImpactEvent {
  return {
    id: row.id,
    userId: row.user_id,
    module: row.module,
    eventType: row.event_type as ImpactEvent["eventType"],
    points: row.points,
    sourceId: row.source_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

/** Records a participation impact event using configurable v1 point values. */
export async function recordImpactAction(
  supabase: SupabaseServerClient,
  input: RecordImpactActionInput
): Promise<ImpactEvent | null> {
  if (input.sourceId) {
    const { data: existing } = await supabase
      .from("impact_events")
      .select("*")
      .eq("user_id", input.userId)
      .eq("event_type", input.eventType)
      .eq("source_id", input.sourceId)
      .maybeSingle();

    if (existing) {
      return mapDbRowToImpactEvent(existing as Parameters<typeof mapDbRowToImpactEvent>[0]);
    }
  }

  return recordImpactEvent(supabase, {
    ...input,
    points: getImpactPoints(input.eventType, input.points),
  }).then(async (created) => {
    if (created) {
      await trackServerEvent({
        name: "impact_event_created",
        userId: input.userId,
        screen: AnalyticsScreen.DASHBOARD,
        source: AnalyticsSource.IMPACT_ENGINE,
        entityId: created.id,
        properties: { event_type: input.eventType, points: created.points },
      });
    }
    return created;
  });
}
