import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createDefaultCoreEngine } from "@/engines/core/server";
import type { DiscoverCommunity } from "@/engines/core/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { MissionEngineData, WeeklyGoal, UserMomentum } from "@/engines/mission/types";
import { fetchConversationPreviews, type ConversationPreview, type ProjectWithMemberCount, type UserCommunity, type UserStats } from "@/lib/core";
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
import type { ConnectionSuggestion, Opportunity } from "@/engines/ai/coach-types";
import type { ReputationProfile } from "@/engines/identity/reputation";
import { fetchReputationProfile } from "@/engines/identity/reputation";
import type { UserProfile, Mission, Notification } from "@/types/database.types";
import type { EventWithMeta } from "@/lib/core/events";
import { buildHomeTimeline } from "@/engines/belong/home/feed-builder";
import {
  buildHomeDiscoveryData,
  fetchTopContributors,
  fetchTrendingConversations,
} from "@/engines/belong/home/discovery";
import { buildHomeImpactMetrics } from "@/engines/belong/home/metrics";
import { buildTodaySummary } from "@/engines/belong/home/summary";
import { getOpportunityRecommendations } from "@/engines/opportunity";
import { fetchImpactScoreProfile, type ImpactScoreProfile } from "@/engines/impact";
import type { HomeActivity, HomeDiscoveryData, HomeImpactMetrics } from "@/engines/belong/home/types";
import type { OpportunityRecommendations } from "@/engines/opportunity";

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
  reputation: ReputationProfile;
  upcomingEvents: EventWithMeta[];
  opportunities: Opportunity[];
  homeTimeline: HomeActivity[];
  homeDiscovery: HomeDiscoveryData;
  homeImpactMetrics: HomeImpactMetrics;
  opportunityRecommendations: OpportunityRecommendations;
  recentConversations: ConversationPreview[];
  todaySummary: string;
  impactScore: ImpactScoreProfile;
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

  const reputation = await fetchReputationProfile(
    supabase,
    profile.id,
    profile,
    result.stats,
    Boolean(result.mission.lifeMission),
    result.mission.lifeMissionProgress?.completionPercent ?? 0
  );

  const [trendingConversations, topContributors, opportunityResult, recentConversations, impactScore] =
    await Promise.all([
    fetchTrendingConversations(supabase, 5),
    fetchTopContributors(supabase, 5),
    getOpportunityRecommendations(supabase, profile),
    fetchConversationPreviews(supabase, profile.id, 4),
    fetchImpactScoreProfile(supabase, profile.id, 5),
  ]);

  const engineData: Omit<
    HomeEngineData,
    | "homeTimeline"
    | "homeDiscovery"
    | "homeImpactMetrics"
    | "upcomingEvents"
    | "opportunities"
    | "opportunityRecommendations"
    | "recentConversations"
    | "todaySummary"
    | "impactScore"
  > & {
    upcomingEvents: EventWithMeta[];
    opportunities: Opportunity[];
  } = {
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
    reputation,
    upcomingEvents,
    opportunities,
  };

  return {
    ...engineData,
    homeTimeline: buildHomeTimeline({
      recentActivity: engineData.recentActivity,
      primaryRecommendation: engineData.primaryRecommendation,
      connectionSuggestions: engineData.connectionSuggestions,
      recentProjects: engineData.recentProjects,
      timeline: engineData.timeline,
      communities: engineData.communities,
      upcomingEvents,
      opportunities,
    }),
    homeDiscovery: buildHomeDiscoveryData({
      trendingConversations,
      upcomingEvents,
      discoverCommunities: result.community.discover,
      connectionSuggestions,
      primaryRecommendation,
      smartHome,
      opportunities,
      topContributors,
    }),
    homeImpactMetrics: buildHomeImpactMetrics({
      stats: engineData.stats,
      impactEngine: engineData.impactEngine,
      reputation: engineData.reputation,
    }),
    opportunityRecommendations: opportunityResult.recommendations,
    recentConversations,
    todaySummary: buildTodaySummary({
      missionEngine: engineData.missionEngine,
      stats: engineData.stats,
      upcomingEvents,
      recentConversations,
      recentProjects: engineData.recentProjects,
    }),
    impactScore,
  };
}
