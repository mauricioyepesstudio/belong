import type { SupabaseServerClient } from "@/lib/core/types";
import {
  recordImpactEvent,
  type ImpactEvent,
  type RecordImpactEventInput,
} from "@/engines/identity/reputation";
import { getImpactActionLabel, getImpactPoints } from "./config";
import type { ImpactScoreEvent, ImpactScoreProfile } from "./score-types";

function weekStartIso(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString();
}

function monthStartIso(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

function mapScoreEvent(event: ImpactEvent): ImpactScoreEvent {
  return {
    id: event.id,
    action: event.eventType,
    label: getImpactActionLabel(event.eventType),
    points: event.points,
    module: event.module,
    sourceId: event.sourceId,
    metadata: event.metadata,
    createdAt: event.createdAt,
  };
}

export type RecordImpactActionInput = Omit<RecordImpactEventInput, "points"> & {
  points?: number;
};

/** Records a participation impact event using configurable v1 point values. */
export async function recordImpactAction(
  supabase: SupabaseServerClient,
  input: RecordImpactActionInput
): Promise<ImpactEvent | null> {
  return recordImpactEvent(supabase, {
    ...input,
    points: getImpactPoints(input.eventType, input.points),
  });
}

export async function fetchImpactScoreProfile(
  supabase: SupabaseServerClient,
  userId: string,
  recentLimit = 10
): Promise<ImpactScoreProfile> {
  const weekStart = weekStartIso();
  const monthStart = monthStartIso();

  const { data: events } = await supabase
    .from("impact_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = events ?? [];
  let totalScore = 0;
  let weeklyScore = 0;
  let monthlyScore = 0;

  for (const row of rows) {
    totalScore += row.points;
    if (row.created_at >= weekStart) weeklyScore += row.points;
    if (row.created_at >= monthStart) monthlyScore += row.points;
  }

  const recentEvents: ImpactScoreEvent[] = rows.slice(0, recentLimit).map((row) =>
    mapScoreEvent({
      id: row.id,
      userId: row.user_id,
      module: row.module,
      eventType: row.event_type,
      points: row.points,
      sourceId: row.source_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    })
  );

  return {
    totalScore,
    weeklyScore,
    monthlyScore,
    recentEvents,
  };
}
