import type { SupabaseServerClient } from "@/lib/core/types";
import { createNotification } from "@/lib/supabase/notify";

export function getWeekStartUtc(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function incrementQuarterlyProgress(
  supabase: SupabaseServerClient,
  userId: string,
  increment = 4
) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: goals } = await supabase
    .from("quarterly_goals")
    .select("id, progress_percent")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(1);

  const goal = goals?.[0];
  if (!goal) return;

  const next = Math.min(100, goal.progress_percent + increment);
  const completed = next >= 100;
  await supabase
    .from("quarterly_goals")
    .update({
      progress_percent: next,
      status: completed ? "completed" : "active",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", goal.id);

  if (completed) {
    const { data: goalRow } = await supabase
      .from("quarterly_goals")
      .select("title")
      .eq("id", goal.id)
      .single();

    await createNotification(supabase, {
      userId,
      title: "Quarterly goal completed",
      body: goalRow?.title ?? "You completed a quarterly goal.",
      type: "system",
      metadata: { goal_id: goal.id, kind: "quarterly_goal" },
    });
  }
}

export async function recordMissionCompletionImpact(
  supabase: SupabaseServerClient,
  userId: string,
  impactPoints: number
) {
  const { data: user } = await supabase
    .from("users")
    .select("founder_reputation")
    .eq("id", userId)
    .single();

  if (!user) return;

  const boost = Math.max(1, Math.floor(impactPoints / 5));
  await supabase
    .from("users")
    .update({ founder_reputation: user.founder_reputation + boost })
    .eq("id", userId);
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
    const completed = next >= goal.target_count;
    await supabase
      .from("weekly_goals")
      .update({
        current_count: next,
        status: completed ? "completed" : "active",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", goal.id);

    if (completed) {
      await createNotification(supabase, {
        userId,
        title: "Weekly goal completed",
        body: goal.title,
        type: "system",
        metadata: { goal_id: goal.id, kind: "weekly_goal" },
      });
    }
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
