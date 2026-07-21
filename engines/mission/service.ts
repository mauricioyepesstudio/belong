import { DEFAULT_INSIGHTS_LIMIT, DEFAULT_RECOMMENDATIONS_LIMIT, MISSION_STATES } from "./constants";
import { appLinks } from "@/systems/navigation/app-links";
import { toInsertRecord, toMissionDomain, toUpdatePatch } from "./mapper";
import type { MissionEngineService } from "./mission-engine";
import { MissionRepository } from "./repository";
import { ensureDefaultOrganization } from "@/lib/core/organizations";
import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  CreateMissionInput,
  GenerateInsightsOptions,
  GenerateRecommendationsOptions,
  Mission,
  MissionEngineContext,
  MissionInsight,
  MissionProgress,
  MissionRecommendation,
  UpdateMissionInput,
} from "./types";

export class MissionEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionEngineError";
  }
}

export class MissionEngineServiceImpl implements MissionEngineService {
  constructor(private readonly repository: MissionRepository) {}

  async getMission(
    context: MissionEngineContext,
    missionId?: string
  ): Promise<Mission | null> {
    const record = missionId
      ? await this.repository.findById(context.userId, missionId)
      : await this.repository.findPrimary(context.userId);

    if (!record) return null;

    const milestones = await this.repository.findMilestones(record.id);
    return toMissionDomain(record, milestones);
  }

  async createMission(
    context: MissionEngineContext,
    input: CreateMissionInput
  ): Promise<Mission> {
    const title = input.title.trim();
    if (!title) throw new MissionEngineError("Title is required");

    const { mission, milestones } = toInsertRecord(context.userId, input);

    if (mission.is_primary) {
      await this.repository.clearPrimary(context.userId);
    }

    const organizationId = await ensureDefaultOrganization(
      this.repository.getClient(),
      context.userId,
      null
    );

    const created = await this.repository.insert({
      ...mission,
      organization_id: organizationId,
    });

    if (milestones.length) {
      await this.repository.insertMilestones(
        milestones.map((m) => ({
          mission_id: created.id,
          title: m.title,
          description: m.description,
          target_date: m.target_date,
          sort_order: m.sort_order,
        }))
      );
    }

    const storedMilestones = await this.repository.findMilestones(created.id);
    return toMissionDomain(created, storedMilestones);
  }

  async updateMission(
    context: MissionEngineContext,
    missionId: string,
    input: UpdateMissionInput
  ): Promise<Mission> {
    const existing = await this.repository.findById(context.userId, missionId);
    if (!existing) throw new MissionEngineError("Mission not found");

    if (input.isPrimary) {
      await this.repository.clearPrimary(context.userId, missionId);
    }

    const patch = toUpdatePatch(input);
    const updated = await this.repository.update(context.userId, missionId, patch);
    const milestones = await this.repository.findMilestones(missionId);
    return toMissionDomain(updated, milestones);
  }

  async archiveMission(
    context: MissionEngineContext,
    missionId: string
  ): Promise<Mission> {
    return this.updateMission(context, missionId, {
      state: MISSION_STATES.archived,
      isPrimary: false,
    });
  }

  async calculateMissionProgress(
    context: MissionEngineContext,
    missionId: string
  ): Promise<MissionProgress> {
    const mission = await this.getMission(context, missionId);
    if (!mission) throw new MissionEngineError("Mission not found");

    const [dailyCompleted, weeklyCompleted, momentum] = await Promise.all([
      this.repository.countCompletedDailyMissions(context.userId),
      this.repository.countCompletedWeeklyGoals(context.userId),
      this.repository.findMomentum(context.userId),
    ]);

    const milestonesTotal = mission.milestones.length;
    const milestonesCompleted = mission.milestones.filter((m) => m.completedAt).length;

    const milestonePercent =
      milestonesTotal > 0 ? Math.round((milestonesCompleted / milestonesTotal) * 100) : 0;

    const activityPercent = Math.min(
      100,
      Math.round(dailyCompleted * 10 + weeklyCompleted * 15)
    );

    const completionPercent =
      milestonesTotal > 0
        ? Math.round(milestonePercent * 0.6 + activityPercent * 0.4)
        : activityPercent;

    return {
      missionId: mission.id,
      state: mission.state,
      completionPercent: Math.min(100, completionPercent),
      milestonesCompleted,
      milestonesTotal,
      dailyMissionsCompleted: dailyCompleted,
      weeklyGoalsCompleted: weeklyCompleted,
      currentStreak: momentum?.current_streak ?? 0,
      lastActiveAt: momentum?.last_active_date ?? null,
    };
  }

  async generateRecommendations(
    context: MissionEngineContext,
    missionId: string,
    options?: GenerateRecommendationsOptions
  ): Promise<MissionRecommendation[]> {
    const mission = await this.getMission(context, missionId);
    if (!mission) throw new MissionEngineError("Mission not found");

    if (
      !options?.includePaused &&
      (mission.state === MISSION_STATES.paused || mission.state === MISSION_STATES.archived)
    ) {
      return [];
    }

    const limit = options?.limit ?? DEFAULT_RECOMMENDATIONS_LIMIT;
    const recommendations: MissionRecommendation[] = [];

    if (mission.state === MISSION_STATES.draft || mission.state === MISSION_STATES.discovering) {
      recommendations.push({
        id: `${mission.id}-activate`,
        missionId: mission.id,
        title: "Activate your mission",
        description: "Move from discovery into action by setting your mission to active.",
        actionLabel: "Go to settings",
        actionHref: "/settings",
        priority: "high",
        category: mission.category,
      });
    }

    if (!mission.vision?.trim()) {
      recommendations.push({
        id: `${mission.id}-vision`,
        missionId: mission.id,
        title: "Clarify your vision",
        description: "A clear vision helps BELONG personalize missions and recommendations.",
        actionLabel: "Edit profile",
        actionHref: "/settings",
        priority: "high",
        category: mission.category,
      });
    }

    if (mission.milestones.length === 0) {
      recommendations.push({
        id: `${mission.id}-milestones`,
        missionId: mission.id,
        title: "Define milestones",
        description: "Break your mission into milestones to track meaningful progress.",
        actionLabel: "View dashboard",
        actionHref: "/dashboard",
        priority: "medium",
        category: mission.category,
      });
    }

    recommendations.push({
      id: `${mission.id}-daily`,
      missionId: mission.id,
      title: "Complete today's missions",
      description: "Daily missions build momentum toward your life mission.",
      actionLabel: "View missions",
      actionHref: appLinks.dashboardMissions,
      priority: "medium",
      category: mission.category,
    });

    recommendations.push({
      id: `${mission.id}-community`,
      missionId: mission.id,
      title: "Join a purpose-aligned community",
      description: "Builders move faster together. Find people aligned with your mission.",
      actionLabel: "Explore communities",
      actionHref: "/community",
      priority: "low",
      category: mission.category,
    });

    return recommendations.slice(0, limit);
  }

  async generateInsights(
    context: MissionEngineContext,
    missionId: string,
    options?: GenerateInsightsOptions
  ): Promise<MissionInsight[]> {
    const mission = await this.getMission(context, missionId);
    if (!mission) throw new MissionEngineError("Mission not found");

    const progress = await this.calculateMissionProgress(context, missionId);
    const limit = options?.limit ?? DEFAULT_INSIGHTS_LIMIT;
    const allowedTypes = options?.types;
    const now = new Date().toISOString();

    const insights: MissionInsight[] = [];

    insights.push({
      id: `${mission.id}-progress`,
      missionId: mission.id,
      title: `${progress.completionPercent}% mission progress`,
      description: `${progress.milestonesCompleted} of ${progress.milestonesTotal || "no"} milestones complete. ${progress.dailyMissionsCompleted} daily missions and ${progress.weeklyGoalsCompleted} weekly goals finished.`,
      type: "progress",
      createdAt: now,
    });

    if (progress.currentStreak > 0) {
      insights.push({
        id: `${mission.id}-momentum`,
        missionId: mission.id,
        title: `${progress.currentStreak} day streak`,
        description: "Consistent daily action compounds into long-term mission progress.",
        type: "momentum",
        createdAt: now,
      });
    }

    if (mission.category) {
      insights.push({
        id: `${mission.id}-alignment`,
        missionId: mission.id,
        title: `Mission aligned with ${mission.category}`,
        description: "Your mission category guides daily missions and weekly goals.",
        type: "alignment",
        createdAt: now,
      });
    }

    if (mission.state === MISSION_STATES.draft || mission.state === MISSION_STATES.discovering) {
      insights.push({
        id: `${mission.id}-opportunity`,
        missionId: mission.id,
        title: "Ready to activate",
        description: "Activating your mission unlocks personalized recommendations across BELONG.",
        type: "opportunity",
        createdAt: now,
      });
    }

    const filtered = allowedTypes?.length
      ? insights.filter((i) => allowedTypes.includes(i.type))
      : insights;

    return filtered.slice(0, limit);
  }
}

export function createMissionEngineService(
  supabase: SupabaseServerClient
): MissionEngineService {
  return new MissionEngineServiceImpl(new MissionRepository(supabase));
}
