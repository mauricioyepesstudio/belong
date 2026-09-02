import { StreakBadge } from "@/components/features/impact/streak-badge";
import { DashboardScreen, getDashboardData } from "@/engines/dashboard";
import { fetchStreakInputs } from "@/engines/impact/streak-data";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await requireProfile();
  const [data, streak] = await Promise.all([
    getDashboardData(),
    fetchStreakInputs(supabase, profile.id),
  ]);

  return (
    <>
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
