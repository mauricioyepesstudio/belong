import type { SupabaseServerClient } from "@/lib/core/types";
import type { FirstWeekInput } from "./first-week";

/**
 * Reads the circle facts the first-week guide needs (RLS-scoped, read-only).
 * Mission and weekly goal come from the Home data the dashboard already loads,
 * so this only adds two count queries plus one owner lookup.
 */
export async function fetchFirstWeekCircleFacts(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Pick<FirstWeekInput, "inCircle" | "hasCheckin">> {
  const [memberships, owned, checkins] = await Promise.all([
    supabase
      .from("accountability_circle_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("accountability_circles")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", userId),
    supabase
      .from("accountability_checkins")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
  ]);

  return {
    inCircle: (memberships.count ?? 0) > 0 || (owned.count ?? 0) > 0,
    hasCheckin: (checkins.count ?? 0) > 0,
  };
}
