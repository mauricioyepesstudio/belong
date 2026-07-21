import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { fetchUserStats, joinMembershipsWithCommunities } from "@/lib/core";
import { fetchReputationProfile } from "@/engines/identity/reputation";
import { fetchImpactScoreProfile, type ImpactScoreProfile } from "@/engines/impact";
import { createIdentityEngineService } from "@/engines/identity/services/identity-service";
import type { IdentityCompleteness } from "@/engines/identity/types";
import type { ProjectStatus } from "@/types/database.types";

export type ProfileCompatibility = {
  skills: string[];
  interests: string[];
  strengths: string[];
  values: string[];
  completeness: IdentityCompleteness;
};

export type ProfileProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
};

export async function getProfileData() {
  const supabase = await createClient();
  const profile = await requireProfile();

  const [{ data: memberRows }, stats, { data: missions }, communities] = await Promise.all([
    supabase.from("project_members").select("project_id").eq("user_id", profile.id),
    fetchUserStats(supabase, profile.id),
    supabase
      .from("missions")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false }),
    joinMembershipsWithCommunities(supabase, profile.id),
  ]);

  const memberProjectIds = (memberRows ?? []).map((m) => m.project_id);
  let projectsQuery = supabase
    .from("projects")
    .select("id, name, status, progress")
    .order("updated_at", { ascending: false })
    .limit(12);

  if (memberProjectIds.length > 0) {
    projectsQuery = projectsQuery.or(
      `owner_id.eq.${profile.id},id.in.(${memberProjectIds.join(",")})`
    );
  } else {
    projectsQuery = projectsQuery.eq("owner_id", profile.id);
  }

  const { data: projects } = await projectsQuery;

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

  const impactScore = await fetchImpactScoreProfile(supabase, profile.id);

  const identityService = createIdentityEngineService(supabase);
  const identityData = await identityService.getIdentityData({ userId: profile.id });
  const compatibility: ProfileCompatibility = {
    skills: identityData?.identity.skillValues ?? [],
    interests: identityData?.identity.interestValues ?? [],
    strengths: identityData?.identity.strengthValues ?? [],
    values: identityData?.identity.valueItems ?? [],
    completeness: identityData?.completeness ?? { score: 0, filledFields: [], missingFields: [] },
  };

  return {
    profile,
    stats,
    missions: missions ?? [],
    communities,
    projects: (projects ?? []) as ProfileProject[],
    reputation,
    impactScore,
    compatibility,
  };
}

export type { ImpactScoreProfile };
