import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { fetchUserStats } from "@/lib/core";
import { fetchReputationProfile } from "@/engines/identity/reputation";

export async function getProfileData() {
  const supabase = await createClient();
  const profile = await requireProfile();

  const [stats, { data: missions }] = await Promise.all([
    fetchUserStats(supabase, profile.id),
    supabase
      .from("missions")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false }),
  ]);

  const primaryMission = missions?.find((m) => m.is_primary) ?? missions?.[0];
  const hasMission = Boolean(primaryMission?.description?.trim());
  const missionProgressPercent =
    primaryMission?.state === "completed"
      ? 100
      : primaryMission?.state === "active"
        ? 50
        : 0;

  const reputation = await fetchReputationProfile(
    supabase,
    profile.id,
    profile,
    stats,
    hasMission,
    missionProgressPercent
  );

  return {
    profile,
    stats,
    missions: missions ?? [],
    reputation,
  };
}
