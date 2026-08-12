import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import type { UserStats } from "@/lib/core/stats";
import { getBuildGoalOption } from "@/engines/mission/config";
import { createMissionEngineService } from "@/engines/mission/service";
import { createLifeMissionAdapter } from "@/engines/mission/adapter";
import type {
  Mission,
  MissionProgress,
  QuarterlyGoal,
} from "@/engines/mission/types";
import {
  buildDailyMissionTemplates,
  buildWeeklyGoalTemplates,
} from "@/engines/mission/engine";
import { createNotification } from "@/lib/supabase/notify";

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekBounds(date = new Date()): { start: string; end: string } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  const start = d.toISOString().slice(0, 10);
  const endDate = new Date(d);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export function quarterBounds(date = new Date()): { start: string; end: string } {
  const month = date.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const start = new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth + 3, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

type QuarterlyTemplate = {
  title: string;
  description: string;
};

export function buildQuarterlyGoalTemplates(
  profile: UserProfile,
  mission: Mission | null
): QuarterlyTemplate[] {
  const goal = getBuildGoalOption(profile.build_goal);
  const focus = mission?.title ?? goal?.label ?? "your mission";

  return [
    {
      title: `Foundation for ${focus}`,
      description: "Establish systems and habits that support your life mission.",
    },
    {
      title: `Momentum on ${focus}`,
      description: "Ship visible progress and deepen community alignment.",
    },
    {
      title: `Breakthrough on ${focus}`,
      description: "Close the quarter with a measurable outcome toward your vision.",
    },
  ];
}

export async function expireStaleWeeklyGoals(
  supabase: SupabaseServerClient,
  userId: string
) {
  const today = todayUtc();
  await supabase
    .from("weekly_goals")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "active")
    .lt("week_end", today);
}

export async function expireStaleQuarterlyGoals(
  supabase: SupabaseServerClient,
  userId: string
) {
  const today = todayUtc();
  await supabase
    .from("quarterly_goals")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "active")
    .lt("due_date", today);
}

export async function ensureQuarterlyGoals(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  missionId: string,
  mission: Mission | null
) {
  const { start, end } = quarterBounds();

  await expireStaleQuarterlyGoals(supabase, userId);

  const { count } = await supabase
    .from("quarterly_goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("due_date", start)
    .lte("due_date", end);

  if ((count ?? 0) >= 1) return;

  const templates = buildQuarterlyGoalTemplates(profile, mission);
  const rows = templates.map((t) => ({
    user_id: userId,
    mission_id: missionId,
    title: t.title,
    description: t.description,
    due_date: end,
    progress_percent: 0,
    status: "active" as const,
  }));

  await supabase.from("quarterly_goals").insert(rows);
}

export async function ensureWeeklyGoalsLinked(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: UserStats,
  missionId: string | null
) {
  await expireStaleWeeklyGoals(supabase, userId);

  const { start, end } = weekBounds();

  const { count } = await supabase
    .from("weekly_goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("week_start", start);

  let quarterlyGoalId: string | null = null;
  if (missionId) {
    const { data: qg } = await supabase
      .from("quarterly_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .eq("status", "active")
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    quarterlyGoalId = qg?.id ?? null;
  }

  if ((count ?? 0) >= 2) {
    if (missionId) {
      await supabase
        .from("weekly_goals")
        .update({ mission_id: missionId, quarterly_goal_id: quarterlyGoalId })
        .eq("user_id", userId)
        .eq("week_start", start)
        .is("mission_id", null);
    }
    return;
  }

  const templates = buildWeeklyGoalTemplates(profile);
  const rows = templates.map((t) => ({
    user_id: userId,
    title: t.title,
    description: t.description,
    target_count: t.target_count,
    action_href: t.action_href,
    impact_points: t.impact_points,
    week_start: start,
    week_end: end,
    mission_id: missionId,
    quarterly_goal_id: quarterlyGoalId,
  }));

  await supabase.from("weekly_goals").insert(rows);
}

export async function ensureDailyMissionsLinked(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: UserStats,
  missionId: string | null
) {
  const missionDate = todayUtc();

  const { count } = await supabase
    .from("daily_missions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mission_date", missionDate);

  const { start } = weekBounds();
  const { data: weeklyGoal } = missionId
    ? await supabase
        .from("weekly_goals")
        .select("id")
        .eq("user_id", userId)
        .eq("week_start", start)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const priorCount = count ?? 0;

  if (priorCount >= 3) {
    if (missionId) {
      await supabase
        .from("daily_missions")
        .update({
          mission_id: missionId,
          weekly_goal_id: weeklyGoal?.id ?? null,
        })
        .eq("user_id", userId)
        .eq("mission_date", missionDate)
        .is("mission_id", null);
    }
    return;
  }

  const templates = buildDailyMissionTemplates(profile, stats);
  const rows = templates.map((t) => ({
    user_id: userId,
    title: t.title,
    description: t.description,
    action_href: t.action_href,
    impact_points: t.impact_points,
    mission_date: missionDate,
    sort_order: t.sort_order,
    mission_id: missionId,
    weekly_goal_id: weeklyGoal?.id ?? null,
  }));

  await supabase.from("daily_missions").upsert(rows, {
    onConflict: "user_id,mission_date,title",
    ignoreDuplicates: true,
  });

  const { data: todayMissions } = await supabase
    .from("daily_missions")
    .select("id, title")
    .eq("user_id", userId)
    .eq("mission_date", missionDate)
    .eq("status", "pending")
    .order("sort_order", { ascending: true })
    .limit(1);

  const firstMission = todayMissions?.[0];
  if (firstMission && priorCount === 0) {
    await createNotification(supabase, {
      userId,
      title: "Today's mission is ready",
      body: firstMission.title,
      type: "system",
      metadata: { mission_id: firstMission.id, kind: "mission_due" },
    });
  }
}

export async function fetchQuarterlyGoals(
  supabase: SupabaseServerClient,
  userId: string
): Promise<QuarterlyGoal[]> {
  const { start, end } = quarterBounds();

  const { data } = await supabase
    .from("quarterly_goals")
    .select("*")
    .eq("user_id", userId)
    .gte("due_date", start)
    .lte("due_date", end)
    .in("status", ["active", "completed"])
    .order("due_date", { ascending: true });

  return (data ?? []) as QuarterlyGoal[];
}

export function computeQuarterlyProgress(goals: QuarterlyGoal[]): number {
  if (!goals.length) return 0;
  const total = goals.reduce((sum, g) => sum + g.progress_percent, 0);
  return Math.round(total / goals.length);
}

export async function fetchLifeMissionBundle(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ lifeMission: Mission | null; lifeMissionProgress: MissionProgress | null }> {
  const adapter = createLifeMissionAdapter(supabase);
  const lifeMission = await adapter.getPrimaryMission({
    supabase,
    profile: {} as UserProfile,
    userId,
  });

  if (!lifeMission) {
    return { lifeMission: null, lifeMissionProgress: null };
  }

  const service = createMissionEngineService(supabase);
  const lifeMissionProgress = await service.calculateMissionProgress(
    { userId },
    lifeMission.id
  );

  return { lifeMission, lifeMissionProgress };
}

export async function ensureMissionHierarchy(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: UserStats,
  missionId: string | null,
  lifeMission: Mission | null
) {
  if (!missionId) return;

  await ensureQuarterlyGoals(supabase, userId, profile, missionId, lifeMission);
  await ensureWeeklyGoalsLinked(supabase, userId, profile, stats, missionId);
  await ensureDailyMissionsLinked(supabase, userId, profile, stats, missionId);
}
