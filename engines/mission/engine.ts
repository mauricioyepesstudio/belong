import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import type { UserStats } from "@/lib/core/stats";
import { getBuildGoalOption } from "@/engines/mission/config";
import type { MissionEngineData } from "@/engines/mission/types";
import {
  ensureMissionHierarchy,
  fetchLifeMissionBundle,
  fetchQuarterlyGoals,
  computeQuarterlyProgress,
  todayUtc,
  weekBounds,
} from "@/engines/mission/hierarchy";

type MissionTemplate = {
  title: string;
  description: string;
  action_href: string;
  impact_points: number;
  sort_order: number;
};

type WeeklyTemplate = {
  title: string;
  description: string;
  action_href: string;
  impact_points: number;
  target_count: number;
};

export function buildDailyMissionTemplates(
  profile: UserProfile,
  stats: UserStats
): MissionTemplate[] {
  const templates: MissionTemplate[] = [];
  const goal = getBuildGoalOption(profile.build_goal);

  if (stats.pendingConnections > 0) {
    templates.push({
      title: "Review connection requests",
      description: `${stats.pendingConnections} builder${stats.pendingConnections === 1 ? "" : "s"} want to connect.`,
      action_href: "/community",
      impact_points: 20,
      sort_order: 0,
    });
  }

  if (stats.unreadNotifications > 0) {
    templates.push({
      title: "Respond to platform activity",
      description: `${stats.unreadNotifications} notifications need your attention.`,
      action_href: "/notifications",
      impact_points: 15,
      sort_order: 1,
    });
  }

  if (stats.projects === 0) {
    templates.push({
      title: "Define your first project",
      description: "Turn intent into momentum with a concrete build.",
      action_href: "/projects",
      impact_points: 25,
      sort_order: 2,
    });
  } else {
    templates.push({
      title: "Advance an active project",
      description: "Ship one meaningful update on what you are building.",
      action_href: "/projects",
      impact_points: 20,
      sort_order: 2,
    });
  }

  if (stats.communities === 0) {
    templates.push({
      title: "Join a purpose-aligned community",
      description: "Builders move faster together. Find your people.",
      action_href: "/community",
      impact_points: 20,
      sort_order: 3,
    });
  } else {
    templates.push({
      title: "Contribute to a community",
      description: "Engage with a group you belong to today.",
      action_href: "/community",
      impact_points: 15,
      sort_order: 3,
    });
  }

  templates.push({
    title: goal ? `Move toward: ${goal.label}` : "Clarify your mission",
    description: goal
      ? `Take one action aligned with your ${goal.label.toLowerCase()} goal.`
      : "Define your life mission on the dashboard.",
    action_href: goal ? "/dashboard" : "/dashboard",
    impact_points: 15,
    sort_order: 4,
  });

  templates.push({
    title: "Connect with one builder",
    description: "Send a message or request a connection.",
    action_href: "/community",
    impact_points: 15,
    sort_order: 5,
  });

  return templates.slice(0, 4);
}

export function buildWeeklyGoalTemplates(
  profile: UserProfile,
  stats: UserStats
): WeeklyTemplate[] {
  const goal = getBuildGoalOption(profile.build_goal);
  return [
    {
      title: "Expand your network",
      description: "Make 3 meaningful connections this week.",
      action_href: "/community",
      impact_points: 40,
      target_count: 3,
    },
    {
      title: "Show up to an event",
      description: "Register and attend one gathering.",
      action_href: "/events",
      impact_points: 35,
      target_count: 1,
    },
    {
      title: goal ? `Progress on ${goal.label}` : "Build with purpose",
      description: "Complete 5 daily missions this week.",
      action_href: "/dashboard",
      impact_points: 50,
      target_count: 5,
    },
  ];
}

export async function fetchMissionEngineData(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: UserStats
): Promise<MissionEngineData> {
  const { lifeMission, lifeMissionProgress } = await fetchLifeMissionBundle(
    supabase,
    userId
  );

  const missionId = lifeMission?.id ?? null;

  await ensureMissionHierarchy(
    supabase,
    userId,
    profile,
    stats,
    missionId,
    lifeMission
  );

  const missionDate = todayUtc();
  const { start } = weekBounds();

  const [{ data: dailyMissions }, { data: weeklyGoals }, { data: momentum }, quarterlyGoals] =
    await Promise.all([
      supabase
        .from("daily_missions")
        .select("*")
        .eq("user_id", userId)
        .eq("mission_date", missionDate)
        .order("sort_order"),
      supabase
        .from("weekly_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", start)
        .in("status", ["active", "completed"])
        .order("created_at"),
      supabase.from("user_momentum").select("*").eq("user_id", userId).maybeSingle(),
      fetchQuarterlyGoals(supabase, userId),
    ]);

  const daily = dailyMissions ?? [];
  const dailyCompleted = daily.filter((m) => m.status === "completed").length;

  const weekly = weeklyGoals ?? [];
  const weeklyProgress =
    weekly.length > 0
      ? Math.round(
          (weekly.reduce((sum, g) => sum + g.current_count / g.target_count, 0) /
            weekly.length) *
            100
        )
      : 0;

  const quarterlyProgress = computeQuarterlyProgress(quarterlyGoals);

  return {
    dailyMissions: daily,
    weeklyGoals: weekly,
    momentum: momentum ?? {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      weekly_completions: 0,
      week_start: start,
    },
    dailyCompleted,
    dailyTotal: daily.length,
    weeklyProgress,
    lifeMission,
    lifeMissionProgress,
    quarterlyGoals,
    quarterlyProgress,
  };
}
