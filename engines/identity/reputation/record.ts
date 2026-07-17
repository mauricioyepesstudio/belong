import type { SupabaseServerClient } from "@/lib/core/types";
import type { Json } from "@/types/database.types";
import type { ImpactEvent, ImpactEventModule, RecordImpactEventInput } from "./types";
import { defaultPointsForEvent } from "./calculate";

function mapRow(row: {
  id: string;
  user_id: string;
  module: ImpactEventModule;
  event_type: string;
  points: number;
  source_id: string | null;
  metadata: Json;
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

async function applyEventSideEffects(
  supabase: SupabaseServerClient,
  input: RecordImpactEventInput & { points: number }
) {
  const { userId, eventType, points, sourceId, metadata } = input;

  if (eventType === "mission_completed") {
    const { data: user } = await supabase
      .from("users")
      .select("founder_reputation")
      .eq("id", userId)
      .single();
    if (user) {
      const boost = Math.max(1, Math.floor(points / 5));
      await supabase
        .from("users")
        .update({ founder_reputation: user.founder_reputation + boost })
        .eq("id", userId);
    }
  }

  if (
    eventType === "community_join" ||
    eventType === "community_post" ||
    eventType === "community_comment" ||
    eventType === "community_like"
  ) {
    const communityId =
      sourceId ??
      (metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? (metadata.community_id as string | undefined)
        : undefined);

    if (communityId) {
      const contributionType =
        eventType === "community_join"
          ? "join"
          : eventType === "community_post"
            ? "post"
            : eventType === "community_comment"
              ? "comment"
              : "like";

      await supabase.from("community_contributions").insert({
        user_id: userId,
        community_id: communityId,
        contribution_type: contributionType,
        points,
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("community_contribution_points")
      .eq("id", userId)
      .single();

    if (user) {
      await supabase
        .from("users")
        .update({
          community_contribution_points: user.community_contribution_points + points,
        })
        .eq("id", userId);
    }
  }

  if (eventType === "project_completed") {
    const { data: user } = await supabase
      .from("users")
      .select("founder_reputation")
      .eq("id", userId)
      .single();
    if (user) {
      await supabase
        .from("users")
        .update({ founder_reputation: user.founder_reputation + Math.max(5, Math.floor(points / 3)) })
        .eq("id", userId);
    }
  }
}

export async function recordImpactEvent(
  supabase: SupabaseServerClient,
  input: RecordImpactEventInput
): Promise<ImpactEvent | null> {
  const points = defaultPointsForEvent(input.eventType, input.points);

  const { data, error } = await supabase
    .from("impact_events")
    .insert({
      user_id: input.userId,
      module: input.module,
      event_type: input.eventType,
      points,
      source_id: input.sourceId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("recordImpactEvent failed:", error?.message);
    return null;
  }

  await applyEventSideEffects(supabase, { ...input, points });

  return mapRow(data as Parameters<typeof mapRow>[0]);
}
