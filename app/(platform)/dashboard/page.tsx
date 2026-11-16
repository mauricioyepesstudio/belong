import { StreakBadge } from "@/engines/impact/components/streak-badge";
import { DashboardScreen, getDashboardData } from "@/engines/dashboard";
import { fetchStreakInputs } from "@/engines/impact/streak-data";
import { FirstWeekGuide } from "@/engines/onboarding/components/first-week-guide";
import { buildFirstWeekPlan } from "@/engines/onboarding/first-week";
import { fetchFirstWeekCircleFacts } from "@/engines/onboarding/first-week-data";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await requireProfile();
  const [data, streak, circleFacts] = await Promise.all([
    getDashboardData(),
    fetchStreakInputs(supabase, profile.id),
    // The guide is optional: a failed read hides it instead of breaking Home.
    fetchFirstWeekCircleFacts(supabase, profile.id).catch(() => null),
  ]);

  const firstWeek = circleFacts
    ? buildFirstWeekPlan({
        joinedAt: profile.created_at,
        hasMission: Boolean(data.primaryMission ?? data.missionEngine.lifeMission),
        hasWeeklyGoal: data.weeklyGoals.length > 0,
        ...circleFacts,
      })
    : null;

  return (
    <>
      {firstWeek && <FirstWeekGuide plan={firstWeek} className="mb-6" />}
      <StreakBadge
        currentStreak={streak.currentStreak}
        longestStreak={streak.longestStreak}
        usedGraceThisWeek={streak.usedGraceThisWeek}
        className="mb-6"
      />
      <DashboardScreen {...data} />
    </>
  );
}
