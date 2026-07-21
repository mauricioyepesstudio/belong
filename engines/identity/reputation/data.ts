import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import { fetchImpactEngineData } from "@/engines/impact/data";
import type { ImpactEvent, ImpactEventModule, ImpactEventType, ReputationProfile } from "./types";
import {
  computeReputationScores,
  founderLabel,
  MODULE_LABELS,
  progressToNextLevel,
  reputationLevelFromScore,
  nextLevelThreshold,
} from "./calculate";

function emptyModuleTotals(): Record<ImpactEventModule, number> {
  return { mission: 0, community: 0, project: 0, organization: 0, event: 0, system: 0 };
}

export async function fetchReputationProfile(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: { connections: number; projects: number; communities: number },
  hasMission: boolean,
  missionProgressPercent = 0
): Promise<ReputationProfile> {
  const impactEngine = await fetchImpactEngineData(
    supabase,
    userId,
    profile,
    stats,
    hasMission,
    missionProgressPercent
  );

  const [
    { data: events },
    { data: momentum },
    { count: missionsCompleted },
    { count: missionsTotal },
    { count: projectsCompleted },
    { count: projectsTotal },
    { count: projectsJoined },
    { count: founderRank },
    { count: communityRank },
    { count: totalFounders },
    { count: totalContributors },
  ] = await Promise.all([
    supabase
      .from("impact_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("user_momentum").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("daily_missions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("daily_missions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "completed"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase
      .from("project_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true)
      .gt("founder_reputation", impactEngine.founderReputation.score),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true)
      .gt("community_contribution_points", impactEngine.communityContributionPoints),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true)
      .gt("founder_reputation", 0),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_completed", true)
      .gt("community_contribution_points", 0),
  ]);

  const eventPointsByModule = emptyModuleTotals();
  const eventCountsByType: Partial<Record<ImpactEventType, number>> = {};

  for (const row of events ?? []) {
    const mod = row.module as ImpactEventModule;
    eventPointsByModule[mod] += row.points;
    const t = row.event_type as ImpactEventType;
    eventCountsByType[t] = (eventCountsByType[t] ?? 0) + 1;
  }

  const scores = computeReputationScores({
    eventPointsByModule,
    eventCountsByType,
    founderReputation: impactEngine.founderReputation.score,
    connections: stats.connections,
    projectsJoined: projectsJoined ?? 0,
    missionsCompleted: missionsCompleted ?? 0,
    missionsTotal: missionsTotal ?? 0,
    projectsCompleted: projectsCompleted ?? 0,
    projectsTotal: projectsTotal ?? 0,
    communityContributionPoints: impactEngine.communityContributionPoints,
  });

  const totalImpact = impactEngine.score.score;
  const reputationLevel = reputationLevelFromScore(totalImpact);

  const recentEvents: ImpactEvent[] = (events ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    module: row.module as ImpactEventModule,
    eventType: row.event_type as ImpactEventType,
    points: row.points,
    sourceId: row.source_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));

  const eventTotals = (Object.keys(eventPointsByModule) as ImpactEventModule[])
    .filter((mod) => eventPointsByModule[mod] > 0)
    .map((mod) => ({
      module: mod,
      points: eventPointsByModule[mod],
      count: recentEvents.filter((e) => e.module === mod).length,
    }));

  const breakdown = [
    ...impactEngine.score.breakdown,
    { label: "Reputation composite", points: scores.reputationScore },
    { label: `Founder (${founderLabel(scores.founderScore)})`, points: scores.founderScore },
    { label: "Collaboration", points: scores.collaborationScore },
  ].filter((b) => b.points > 0);

  return {
    totalImpact,
    reputationLevel,
    scores,
    ranks: {
      founderRank: (founderRank ?? 0) + 1,
      communityRank: (communityRank ?? 0) + 1,
      totalFounders: totalFounders ?? 0,
      totalContributors: totalContributors ?? 0,
    },
    currentStreak: momentum?.current_streak ?? 0,
    longestStreak: momentum?.longest_streak ?? 0,
    weeklyCompletions: momentum?.weekly_completions ?? 0,
    recentEvents,
    eventTotals,
    breakdown,
    history: impactEngine.history,
    nextLevelAt: nextLevelThreshold(totalImpact),
    progressToNext: progressToNextLevel(totalImpact),
  };
}

export { MODULE_LABELS };
