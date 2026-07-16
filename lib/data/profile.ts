import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { fetchUserStats, calculateImpactScore } from "@/lib/core";

export async function getProfileData() {
  const supabase = await createClient();
  const profile = await requireProfile();

  const [
    stats,
    { data: missions },
    { count: eventsAttended },
    { count: messagesSent },
    { data: ownedProjects },
    { data: paymentsReceived },
  ] = await Promise.all([
    fetchUserStats(supabase, profile.id),
    supabase
      .from("missions")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", profile.id),
    supabase
      .from("projects")
      .select("funding_raised_cents")
      .eq("owner_id", profile.id),
    supabase
      .from("payments")
      .select("amount_cents, platform_fee_cents")
      .eq("recipient_id", profile.id)
      .eq("status", "succeeded"),
  ]);

  const fundingRaisedCents =
    ownedProjects?.reduce((sum, p) => sum + (p.funding_raised_cents ?? 0), 0) ?? 0;

  const earningsCents =
    paymentsReceived?.reduce(
      (sum, p) => sum + p.amount_cents - (p.platform_fee_cents ?? 0),
      0
    ) ?? 0;

  const primaryMission = missions?.find((m) => m.is_primary) ?? missions?.[0];
  const hasMission = Boolean(primaryMission?.description?.trim());
  const profileComplete = Boolean(
    profile.full_name && profile.bio && profile.build_goal && profile.onboarding_completed
  );

  const impact = calculateImpactScore({
    connections: stats.connections,
    projects: stats.projects,
    communities: stats.communities,
    eventsAttended: eventsAttended ?? 0,
    messagesSent: messagesSent ?? 0,
    hasMission,
    profileComplete,
    fundingRaisedCents,
    earningsCents,
    subscriptionTier: profile.subscription_tier ?? "free",
    communityContributionPoints: profile.community_contribution_points ?? 0,
    founderReputation: profile.founder_reputation ?? 0,
  });

  return {
    profile,
    stats,
    missions: missions ?? [],
    impact,
  };
}
