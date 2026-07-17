import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createMissionEngineService } from "./service";
import { MissionRepository } from "./repository";
import { toMilestoneDomain } from "./mapper";
import type { DailyMission, DailyMissionDetailData, Mission, MissionMilestone, MissionParticipant } from "./types";

export async function getPrimaryMission(): Promise<Mission | null> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const service = createMissionEngineService(supabase);
  return service.getMission({ userId: profile.id });
}

export async function getUserMissions(): Promise<Mission[]> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const service = createMissionEngineService(supabase);

  const { data, error } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", profile.id)
    .neq("state", "archived")
    .order("is_primary", { ascending: false });

  if (error) throw new Error(error.message);

  const missions = await Promise.all(
    (data ?? []).map((row) => service.getMission({ userId: profile.id }, row.id))
  );

  return missions.filter((m): m is Mission => m !== null);
}

export async function getDailyMissionDetail(
  missionId: string
): Promise<DailyMissionDetailData | null> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: missionRow, error } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!missionRow) return null;

  const mission: DailyMission = {
    id: missionRow.id,
    user_id: missionRow.user_id,
    title: missionRow.title,
    description: missionRow.description,
    action_href: missionRow.action_href,
    impact_points: missionRow.impact_points,
    status: missionRow.status,
    mission_date: missionRow.mission_date,
    completed_at: missionRow.completed_at,
    sort_order: missionRow.sort_order,
    mission_id: missionRow.mission_id,
    weekly_goal_id: missionRow.weekly_goal_id,
  };

  const repository = new MissionRepository(supabase);

  const [{ data: participantRows }, { data: ownerUser }, primaryMission] = await Promise.all([
    supabase
      .from("daily_mission_participants")
      .select("user_id, joined_at")
      .eq("daily_mission_id", missionId)
      .order("joined_at"),
    supabase
      .from("users")
      .select("id, full_name, avatar_url, created_at")
      .eq("id", missionRow.user_id)
      .single(),
    repository.findPrimary(missionRow.user_id),
  ]);

  const participantUserIds = [...new Set((participantRows ?? []).map((p) => p.user_id))];
  let participantUsers: { id: string; full_name: string | null; avatar_url: string | null }[] =
    [];

  if (participantUserIds.length) {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", participantUserIds);
    participantUsers = data ?? [];
  }

  const userMap = new Map(participantUsers.map((u) => [u.id, u]));

  const owner: MissionParticipant = {
    id: ownerUser?.id ?? missionRow.user_id,
    fullName: ownerUser?.full_name ?? null,
    avatarUrl: ownerUser?.avatar_url ?? null,
    role: "owner",
    joinedAt: ownerUser?.created_at ?? missionRow.created_at,
  };

  const participants: MissionParticipant[] = [
    owner,
    ...(participantRows ?? [])
      .filter((p) => p.user_id !== missionRow.user_id)
      .map((p) => {
        const user = userMap.get(p.user_id);
        return {
          id: p.user_id,
          fullName: user?.full_name ?? null,
          avatarUrl: user?.avatar_url ?? null,
          role: "participant" as const,
          joinedAt: p.joined_at,
        };
      }),
  ];

  let objectives: MissionMilestone[] = [];
  if (primaryMission) {
    const milestones = await repository.findMilestones(primaryMission.id);
    objectives = milestones.map(toMilestoneDomain);
  }

  const milestonesCompleted = objectives.filter((o) => o.completedAt).length;
  const milestonesTotal = objectives.length;

  const progressPercent =
    mission.status === "completed"
      ? 100
      : milestonesTotal > 0
        ? Math.round((milestonesCompleted / milestonesTotal) * 100)
        : 0;

  const isOwner = profile.id === missionRow.user_id;
  const isParticipant =
    isOwner ||
    (participantRows ?? []).some((p) => p.user_id === profile.id);

  return {
    mission,
    owner,
    participants,
    objectives,
    progress: {
      percent: progressPercent,
      milestonesCompleted,
      milestonesTotal,
    },
    rewards: {
      impactPoints: mission.impact_points,
    },
    isOwner,
    isParticipant,
    currentUserId: profile.id,
  };
}
