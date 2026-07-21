import type { SupabaseServerClient } from "@/lib/core/types";
import {
  recordImpactEvent,
  type ImpactEvent,
  type RecordImpactEventInput,
} from "@/engines/identity/reputation";
import { getImpactActionLabel, getImpactPoints } from "./config";
import type { ImpactScoreEvent, ImpactScoreProfile } from "./score-types";

export function weekStartIso(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString();
}

export function monthStartIso(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

export function aggregateImpactScores(
  rows: { points: number; created_at: string }[],
  now = new Date()
): Pick<ImpactScoreProfile, "totalScore" | "weeklyScore" | "monthlyScore"> {
  const weekStart = weekStartIso(now);
  const monthStart = monthStartIso(now);

  let totalScore = 0;
  let weeklyScore = 0;
  let monthlyScore = 0;

  for (const row of rows) {
    totalScore += row.points;
    if (row.created_at >= weekStart) weeklyScore += row.points;
    if (row.created_at >= monthStart) monthlyScore += row.points;
  }

  return { totalScore, weeklyScore, monthlyScore };
}

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
  });
}

export async function fetchImpactScoreProfile(
  supabase: SupabaseServerClient,
  userId: string,
  recentLimit = 10
): Promise<ImpactScoreProfile> {
  const { data: events } = await supabase
    .from("impact_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = events ?? [];
  const { totalScore, weeklyScore, monthlyScore } = aggregateImpactScores(rows);

  const recentEvents: ImpactScoreEvent[] = rows.slice(0, recentLimit).map((row) =>
    mapScoreEvent(mapDbRowToImpactEvent(row as Parameters<typeof mapDbRowToImpactEvent>[0]))
  );

  return {
    totalScore,
    weeklyScore,
    monthlyScore,
    recentEvents,
  };
}
