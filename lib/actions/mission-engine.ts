"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import {
  incrementQuarterlyProgress,
  incrementWeeklyGoalByTitle,
  recordMissionActivity,
  recordMissionCompletionImpact,
} from "@/lib/engine/mission-progress";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/supabase/notify";

export async function completeDailyMission(missionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: mission } = await supabase
    .from("daily_missions")
    .select("id, status, user_id, impact_points, weekly_goal_id, title")
    .eq("id", missionId)
    .single();

  if (!mission || mission.user_id !== profile.id) {
    return { error: "Mission not found" };
  }
  if (mission.status === "completed") {
    return {};
  }

  const { error } = await supabase
    .from("daily_missions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", missionId);

  if (error) return { error: error.message };

  await recordMissionActivity(supabase, profile.id);
  await incrementWeeklyGoalByTitle(supabase, profile.id, "Build with purpose");
  await incrementWeeklyGoalByTitle(supabase, profile.id, "daily missions");
  await incrementWeeklyGoalByTitle(supabase, profile.id, "Progress on");
  await incrementQuarterlyProgress(supabase, profile.id);
  await recordMissionCompletionImpact(supabase, profile.id, mission.impact_points);

  await createNotification(supabase, {
    userId: profile.id,
    title: "Mission completed",
    body: `${mission.title} — +${mission.impact_points} impact`,
    type: "system",
    metadata: { mission_id: missionId, kind: "mission_completed" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/", "layout");
  return {};
}

export async function createCustomDailyMission(data: {
  title: string;
  description?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const title = data.title.trim();
  if (!title) return { error: "Title is required" };

  const missionDate = new Date().toISOString().slice(0, 10);

  const { data: lifeMission } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .neq("state", "archived")
    .maybeSingle();

  const weekStart = (() => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
  })();

  const { data: weeklyGoal } = lifeMission
    ? await supabase
        .from("weekly_goals")
        .select("id")
        .eq("user_id", profile.id)
        .eq("week_start", weekStart)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: inserted, error } = await supabase
    .from("daily_missions")
    .insert({
      user_id: profile.id,
      title,
      description: data.description?.trim() || null,
      action_href: "/dashboard",
      impact_points: 10,
      mission_date: missionDate,
      sort_order: 99,
      status: "pending",
      mission_id: lifeMission?.id ?? null,
      weekly_goal_id: weeklyGoal?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("daily_missions")
    .update({ action_href: `/missions/${inserted.id}` })
    .eq("id", inserted.id);

  revalidatePath("/dashboard");
  revalidatePath(`/missions/${inserted.id}`);
  return { id: inserted.id };
}

export async function joinDailyMission(missionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: mission } = await supabase
    .from("daily_missions")
    .select("id, user_id")
    .eq("id", missionId)
    .maybeSingle();

  if (!mission) return { error: "Mission not found" };
  if (mission.user_id === profile.id) return { error: "You already own this mission" };

  const { error } = await supabase.from("daily_mission_participants").insert({
    daily_mission_id: missionId,
    user_id: profile.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already joined" };
    return { error: error.message };
  }

  revalidatePath(`/missions/${missionId}`);
  revalidatePath("/dashboard");
  return {};
}
