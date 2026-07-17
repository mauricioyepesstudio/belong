import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createDefaultCoreEngine } from "@/engines/core/server";
import type { DiscoverCommunity } from "@/engines/core/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { MissionEngineData, WeeklyGoal, UserMomentum } from "@/engines/mission/types";
import type { ProjectWithMemberCount, UserCommunity, UserStats } from "@/lib/core";
import {
  fetchUserRecentActivity,
  type UserActivityItem,
} from "@/engines/belong/global-feed";
import type { UserProfile } from "@/types/database.types";
import type { Mission } from "@/types/database.types";

export type HomeEngineData = {
  profile: UserProfile;
  stats: UserStats;
  impactEngine: ImpactEngineData;
  missionEngine: MissionEngineData;
  communities: UserCommunity[];
  discoverCommunities: DiscoverCommunity[];
  recentProjects: ProjectWithMemberCount[];
  weeklyGoals: WeeklyGoal[];
  weeklyProgress: number;
  momentum: UserMomentum;
  recentActivity: UserActivityItem[];
  primaryMission: Mission | null;
};

export async function getHomeEngineData(): Promise<HomeEngineData> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const core = createDefaultCoreEngine();
  const [result, recentActivity] = await Promise.all([
    core.resolve({ supabase, profile, userId: profile.id }),
    fetchUserRecentActivity(supabase, profile.id),
  ]);

  return {
    profile: result.profile,
    stats: result.stats,
    impactEngine: result.impact,
    missionEngine: result.mission,
    communities: result.community.joined,
    discoverCommunities: result.community.discover,
    recentProjects: result.projects.recent,
    weeklyGoals: result.weeklyGoals.goals,
    weeklyProgress: result.weeklyGoals.progress,
    momentum: result.weeklyGoals.momentum,
    recentActivity,
    primaryMission: result.primaryMission,
  };
}
