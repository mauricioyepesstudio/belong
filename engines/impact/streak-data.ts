import type { SupabaseServerClient } from "@/lib/core/types";
import { computeStreak, type StreakResult } from "./streak";

/**
 * How far back to look for check-in activity. Grace-day windows only ever
 * span 7 days, so 90 days is comfortably more headroom than the streak math
 * needs — this just keeps the query bounded instead of scanning a user's
 * entire posting history.
 */
const STREAK_LOOKBACK_DAYS = 90;

/**
 * Fetches a user's recent social_posts activity and computes their Momento
 * Belong streak (see streak.ts). A "check-in day" is any UTC calendar day
 * on which the user authored at least one post.
 */
export async function fetchStreakInputs(
  supabase: SupabaseServerClient,
  userId: string
): Promise<StreakResult> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - STREAK_LOOKBACK_DAYS);

  const { data: rows } = await supabase
    .from("social_posts")
    .select("created_at")
    .eq("author_id", userId)
    .gte("created_at", cutoff.toISOString());

  const checkInDates = [
    ...new Set((rows ?? []).map((row) => new Date(row.created_at).toISOString().slice(0, 10))),
  ];

  return computeStreak(checkInDates, today);
}
