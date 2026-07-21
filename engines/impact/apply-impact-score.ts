import type { ImpactEvent } from "@/engines/identity/reputation";
import { getImpactActionLabel } from "./config";
import type { ImpactScoreProfile } from "./score-types";

/** Applies a realtime impact_events INSERT to client-side score state. */
export function applyImpactScoreInsert(
  prev: ImpactScoreProfile,
  event: ImpactEvent,
  recentLimit = 10
): ImpactScoreProfile {
  return {
    totalScore: prev.totalScore + event.points,
    weeklyScore: prev.weeklyScore + event.points,
    monthlyScore: prev.monthlyScore + event.points,
    recentEvents: [
      {
        id: event.id,
        action: event.eventType,
        label: getImpactActionLabel(event.eventType),
        points: event.points,
        module: event.module,
        sourceId: event.sourceId,
        metadata: event.metadata,
        createdAt: event.createdAt,
      },
      ...prev.recentEvents,
    ].slice(0, recentLimit),
  };
}
