import type { SupabaseServerClient } from "@/lib/core/types";

export function getWeekStartUtc(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function incrementWeeklyGoalByTitle(
  supabase: SupabaseServerClient,
  userId: string,
  titleFragment: string
) {
  const start = getWeekStartUtc();
  const { data: goals } = await supabase
    .from("weekly_goals")
    .select("id, current_count, target_count, title")
    .eq("user_id", userId)
    .eq("week_start", start)
    .eq("status", "active");

  for (const goal of goals ?? []) {
    if (!goal.title.toLowerCase().includes(titleFragment.toLowerCase())) continue;
    const next = goal.current_count + 1;
    await supabase
      .from("weekly_goals")
      .update({
        current_count: next,
        status: next >= goal.target_count ? "completed" : "active",
        completed_at: next >= goal.target_count ? new Date().toISOString() : null,
      })
      .eq("id", goal.id);
  }
}

export async function recordMissionActivity(
  supabase: SupabaseServerClient,
  userId: string
) {
  await supabase.rpc("record_user_activity", { p_user_id: userId });

  const { data: momentum } = await supabase
    .from("user_momentum")
    .select("weekly_completions")
    .eq("user_id", userId)
    .maybeSingle();

  await supabase
    .from("user_momentum")
    .update({
      weekly_completions: (momentum?.weekly_completions ?? 0) + 1,
    })
    .eq("user_id", userId);
}

export async function syncUserSkill(
  supabase: SupabaseServerClient,
  userId: string,
  skill: string | null | undefined
) {
  const trimmed = skill?.trim();
  if (!trimmed) return;

  await supabase.from("user_skills").upsert(
    { user_id: userId, skill: trimmed },
    { onConflict: "user_id,skill", ignoreDuplicates: true }
  );
}

export async function logCommunityContribution(
  supabase: SupabaseServerClient,
  userId: string,
  communityId: string,
  contributionType: string,
  points = 5
) {
  await supabase.from("community_contributions").insert({
    user_id: userId,
    community_id: communityId,
    contribution_type: contributionType,
    points,
  });

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
