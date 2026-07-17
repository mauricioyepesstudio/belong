import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createDefaultCoreEngine } from "@/engines/core/server";
import type { DiscoverCommunity } from "@/engines/core/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { MissionEngineData, WeeklyGoal, UserMomentum } from "@/engines/mission/types";
import type { ProjectWithMemberCount, UserCommunity, UserStats } from "@/lib/core";
import { getUpcomingEventsWithMeta } from "@/lib/core/events";
import {
  fetchUserRecentActivity,
  type UserActivityItem,
} from "@/engines/belong/global-feed";
import {
  buildCrossModuleLinks,
  buildDashboardTimeline,
  buildSmartHomeStack,
  fetchCommunityPulse,
  fetchProjectNeedingAttention,
  type CrossModuleLink,
  type DashboardTimeline,
  type SmartHomeItem,
} from "@/engines/belong/creator-os";
import { generatePrimaryRecommendation, type CoachRecommendation } from "@/engines/belong/recommendation";
import { detectOpportunities, suggestConnections } from "@/engines/ai/opportunities";
import type { ConnectionSuggestion } from "@/engines/ai/coach-types";
import type { UserProfile, Mission, Notification } from "@/types/database.types";

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
  timeline: DashboardTimeline;
  smartHome: SmartHomeItem[];
  crossModuleLinks: CrossModuleLink[];
  primaryRecommendation: CoachRecommendation;
  connectionSuggestions: ConnectionSuggestion[];
  recentNotifications: Notification[];
};

export async function getHomeEngineData(): Promise<HomeEngineData> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const core = createDefaultCoreEngine();
  const result = await core.resolve({ supabase, profile, userId: profile.id });

  const [
    recentActivity,
    communityPulse,
    projectNeedingAttention,
    connectionSuggestions,
    recentNotifications,
    upcomingEvents,
  ] = await Promise.all([
    fetchUserRecentActivity(supabase, profile.id, 20),
    fetchCommunityPulse(supabase, profile.id, result.community.joined),
    fetchProjectNeedingAttention(supabase, profile.id, result.projects.recent),
    suggestConnections(supabase, profile.id, profile),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => data ?? []),
    getUpcomingEventsWithMeta(supabase, profile.id, 5),
  ]);

  const opportunities = await detectOpportunities(supabase, profile.id, {
    pendingConnections: result.stats.pendingConnections,
    projects: result.projects.total,
    communities: result.community.joined.length,
  }, upcomingEvents);

  const activeProject =
    projectNeedingAttention ??
    result.projects.recent.find((p) => p.status === "active" || p.status === "planning") ??
    null;

  const timeline = buildDashboardTimeline({
    missionEngine: result.mission,
    recentProjects: result.projects.recent,
    communityPulse,
    weeklyProgress: result.weeklyGoals.progress,
    weeklyGoals: result.weeklyGoals.goals,
    impactEngine: result.impact,
    activeProject,
  });

  const smartHome = buildSmartHomeStack({
    missionEngine: result.mission,
    projectNeedingAttention: activeProject,
    communityPulse,
    stats: result.stats,
    recentNotifications,
    connectionSuggestions,
  });

  const crossModuleLinks = buildCrossModuleLinks({ timeline, stats: result.stats });

  const primaryRecommendation = generatePrimaryRecommendation({
    profile,
    stats: result.stats,
    missionEngine: result.mission,
    impactEngine: result.impact,
    insights: result.ai.insights,
    opportunities,
    connectionSuggestions,
  });

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
    timeline,
    smartHome,
    crossModuleLinks,
    primaryRecommendation,
    connectionSuggestions,
    recentNotifications,
  };
}
