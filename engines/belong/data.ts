import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import {
  fetchUserStats,
  getAllProjectsForUser,
  joinMembershipsWithCommunities,
} from "@/lib/core";
import { getDiscoverCommunities } from "@/lib/data/communities";
import { fetchMissionEngineData } from "@/engines/mission/engine";
import { fetchImpactEngineData } from "@/engines/impact/data";
import { getMissionText } from "@/engines/mission";
import type { Community, Mission, UserProfile } from "@/types/database.types";
import type { MissionEngineData } from "@/engines/mission/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { WeeklyGoal } from "@/engines/mission/types";
import type { ProjectWithMemberCount, UserCommunity } from "@/lib/core";
import {
  fetchUserRecentActivity,
  type UserActivityItem,
} from "@/engines/belong/global-feed";

export type HomeEngineData = {
  profile: UserProfile;
  impactEngine: ImpactEngineData;
  missionEngine: MissionEngineData;
  communities: UserCommunity[];
  discoverCommunities: Community[];
  recentProjects: ProjectWithMemberCount[];
  primaryWeeklyGoal: WeeklyGoal | null;
  recentActivity: UserActivityItem[];
  primaryMission: Mission | null;
};

export async function getHomeEngineData(): Promise<HomeEngineData> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const stats = await fetchUserStats(supabase, profile.id);

  const [{ data: primaryMission }, communities, discoverAll, recentProjects, recentActivity] =
    await Promise.all([
      supabase
        .from("missions")
        .select("*")
        .eq("user_id", profile.id)
        .eq("is_primary", true)
        .maybeSingle(),
      joinMembershipsWithCommunities(supabase, profile.id, 6),
      getDiscoverCommunities(),
      getAllProjectsForUser(supabase, profile.id).then((p) => p.slice(0, 4)),
      fetchUserRecentActivity(supabase, profile.id),
    ]);

  const joinedIds = new Set(communities.map((c) => c.id));
  const discoverCommunities = discoverAll.filter((c) => !joinedIds.has(c.id)).slice(0, 12);

  const hasMission = Boolean(getMissionText(profile, primaryMission));

  const [missionEngine, impactEngine] = await Promise.all([
    fetchMissionEngineData(supabase, profile.id, profile, stats),
    fetchImpactEngineData(supabase, profile.id, profile, stats, hasMission),
  ]);

  const primaryWeeklyGoal =
    missionEngine.weeklyGoals.find((g) => g.status === "active") ??
    missionEngine.weeklyGoals[0] ??
    null;

  return {
    profile,
    impactEngine,
    missionEngine,
    communities,
    discoverCommunities,
    recentProjects,
    primaryWeeklyGoal,
    recentActivity,
    primaryMission,
  };
}
