import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import { calculateImpactScore } from "@/engines/impact/calculate";
import type {
  ImpactEngineData,
  RippleRing,
  FounderReputation,
  WeeklyImpact,
} from "@/engines/impact/types";

const LEVEL_THRESHOLDS = [50, 100, 200, 350, 500];

function weekStartDate(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function fetchWeeklyImpact(
  supabase: SupabaseServerClient,
  userId: string
): Promise<WeeklyImpact> {
  const weekStart = weekStartDate();

  const [
    { data: completedMissions },
    { data: completedGoals },
    { data: contributions },
  ] = await Promise.all([
    supabase
      .from("daily_missions")
      .select("impact_points")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("mission_date", weekStart),
    supabase
      .from("weekly_goals")
      .select("impact_points")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("week_start", weekStart),
    supabase
      .from("community_contributions")
      .select("points")
      .eq("user_id", userId)
      .gte("created_at", `${weekStart}T00:00:00.000Z`),
  ]);

  const missionsCompleted = completedMissions?.length ?? 0;
  const goalsCompleted = completedGoals?.length ?? 0;
  const contributionsLogged = contributions?.length ?? 0;

  const points =
    (completedMissions ?? []).reduce((sum, m) => sum + m.impact_points, 0) +
    (completedGoals ?? []).reduce((sum, g) => sum + g.impact_points, 0) +
    (contributions ?? []).reduce((sum, c) => sum + c.points, 0);

  return {
    points,
    missionsCompleted,
    goalsCompleted,
    contributionsLogged,
  };
}

function nextLevelThreshold(score: number): number {
  for (const t of LEVEL_THRESHOLDS) {
    if (score < t) return t;
  }
  return 500;
}

export async function fetchImpactMetrics(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile
) {
  const [
    { count: eventsAttended },
    { count: messagesSent },
    { data: ownedProjects },
    { data: paymentsReceived },
    { count: contributionsCount },
    { data: ownedCommunities },
  ] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", userId),
    supabase.from("projects").select("funding_raised_cents").eq("owner_id", userId),
    supabase
      .from("payments")
      .select("amount_cents, platform_fee_cents")
      .eq("recipient_id", userId)
      .eq("status", "succeeded"),
    supabase
      .from("community_contributions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("communities").select("id").eq("owner_id", userId),
  ]);

  const fundingRaisedCents =
    ownedProjects?.reduce((sum, p) => sum + (p.funding_raised_cents ?? 0), 0) ?? 0;

  const earningsCents =
    paymentsReceived?.reduce(
      (sum, p) => sum + p.amount_cents - (p.platform_fee_cents ?? 0),
      0
    ) ?? 0;

  let totalMembers = 0;
  if (ownedCommunities?.length) {
    const { count } = await supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .in(
        "community_id",
        ownedCommunities.map((c) => c.id)
      );
    totalMembers = count ?? 0;
  }

  const founderScore =
    (ownedCommunities?.length ?? 0) * 25 +
    totalMembers * 3 +
    (contributionsCount ?? 0) * 5 +
    Math.floor(earningsCents / 2000);

  return {
    eventsAttended: eventsAttended ?? 0,
    messagesSent: messagesSent ?? 0,
    fundingRaisedCents,
    earningsCents,
    communityContributionPoints: profile.community_contribution_points ?? 0,
    founderReputation: profile.founder_reputation || founderScore,
    founderMeta: {
      communitiesOwned: ownedCommunities?.length ?? 0,
      totalMembers,
      contributionsLogged: contributionsCount ?? 0,
    },
  };
}

async function ensureImpactSnapshot(
  supabase: SupabaseServerClient,
  userId: string,
  score: number
) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("impact_snapshots").upsert(
    { user_id: userId, score, recorded_date: today },
    { onConflict: "user_id,recorded_date", ignoreDuplicates: false }
  );
}

export async function fetchImpactEngineData(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile,
  stats: {
    connections: number;
    projects: number;
    communities: number;
  },
  hasMission: boolean,
  missionProgressPercent = 0
): Promise<ImpactEngineData> {
  const [extended, weeklyImpact] = await Promise.all([
    fetchImpactMetrics(supabase, userId, profile),
    fetchWeeklyImpact(supabase, userId),
  ]);

  const profileComplete = Boolean(
    profile.full_name && profile.bio && profile.build_goal && profile.onboarding_completed
  );

  const score = calculateImpactScore({
    connections: stats.connections,
    projects: stats.projects,
    communities: stats.communities,
    eventsAttended: extended.eventsAttended,
    messagesSent: extended.messagesSent,
    hasMission,
    missionProgressPercent,
    profileComplete,
    fundingRaisedCents: extended.fundingRaisedCents,
    earningsCents: extended.earningsCents,
    subscriptionTier: profile.subscription_tier ?? "free",
    communityContributionPoints: extended.communityContributionPoints,
    founderReputation: extended.founderReputation,
  });

  await ensureImpactSnapshot(supabase, userId, score.score);

  if (extended.founderReputation !== profile.founder_reputation) {
    await supabase
      .from("users")
      .update({ founder_reputation: extended.founderReputation })
      .eq("id", userId);
  }

  const { data: snapshots } = await supabase
    .from("impact_snapshots")
    .select("recorded_date, score")
    .eq("user_id", userId)
    .order("recorded_date", { ascending: true })
    .limit(14);

  const ripple: RippleRing[] = [
    {
      label: "Network",
      value: stats.connections,
      max: Math.max(stats.connections, 10),
      color: "var(--brand-primary)",
    },
    {
      label: "Build",
      value: stats.projects,
      max: Math.max(stats.projects, 5),
      color: "#8b5cf6",
    },
    {
      label: "Community",
      value: stats.communities,
      max: Math.max(stats.communities, 5),
      color: "#06b6d4",
    },
    {
      label: "Contribution",
      value: extended.communityContributionPoints,
      max: Math.max(extended.communityContributionPoints, 20),
      color: "#10b981",
    },
  ];

  const nextLevelAt = nextLevelThreshold(score.score);
  const prevThreshold =
    LEVEL_THRESHOLDS.filter((t) => t <= score.score).pop() ?? 0;
  const progressToNext = Math.min(
    100,
    Math.round(((score.score - prevThreshold) / (nextLevelAt - prevThreshold)) * 100)
  );

  const founderReputation: FounderReputation = {
    score: extended.founderReputation,
    label:
      extended.founderReputation >= 100
        ? "Established Founder"
        : extended.founderReputation >= 50
          ? "Rising Founder"
          : extended.founderReputation >= 20
            ? "Community Builder"
            : "Emerging Founder",
    communitiesOwned: extended.founderMeta.communitiesOwned,
    totalMembers: extended.founderMeta.totalMembers,
    contributionsLogged: extended.founderMeta.contributionsLogged,
  };

  return {
    score,
    weeklyImpact,
    ripple,
    history: (snapshots ?? []).map((s) => ({
      date: s.recorded_date,
      score: s.score,
    })),
    founderReputation,
    communityContributionPoints: extended.communityContributionPoints,
    nextLevelAt,
    progressToNext,
  };
}
