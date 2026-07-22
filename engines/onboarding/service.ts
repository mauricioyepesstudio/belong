import { BUILD_GOALS } from "@/engines/mission/config";
import { MISSION_STATES } from "@/engines/mission/constants";
import { createMissionEngineService } from "@/engines/mission/service";
import { fetchMissionEngineData } from "@/engines/mission/engine";
import { fetchUserStats } from "@/lib/core";
import { ensureDefaultOrganization } from "@/lib/core/organizations";
import { getWeekStartUtc } from "@/lib/engine/mission-progress";
import { syncUserSkill } from "@/lib/engine/mission-progress";
import { recordImpactAction } from "@/engines/impact/record-action.server";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";
import { slugify } from "@/lib/supabase/notify";
import type { SupabaseServerClient } from "@/lib/core/types";
import type { BuildGoal, UserProfile } from "@/types/database.types";
import {
  FIRST_ONBOARDING_STEP,
  ONBOARDING_SESSION_STATUS,
  ONBOARDING_STEP_ORDER,
  DEFAULT_WEEKLY_GOAL_IMPACT,
  DEFAULT_WEEKLY_GOAL_TARGET,
} from "./constants";
import type { OnboardingEngineService } from "./onboarding-engine";
import {
  getNextStep,
  getPreviousStep,
  isOnboardingStep,
  mergeDraft,
} from "./utils";
import type {
  OnboardingAIProvider,
  OnboardingCompleteInput,
  OnboardingCompleteResult,
  OnboardingDraft,
  OnboardingEngineContext,
  OnboardingEngineResult,
  OnboardingSession,
  OnboardingSessionStatus,
  OnboardingStep,
  OnboardingStepInput,
} from "./types";

type SessionRow = {
  user_id: string;
  current_step: string;
  draft: OnboardingDraft;
  status: OnboardingSessionStatus;
  created_at: string;
  updated_at: string;
};

class OnboardingSessionRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async find(userId: string): Promise<SessionRow | null> {
    const { data, error } = await this.supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as SessionRow | null;
  }

  async upsert(
    userId: string,
    patch: {
      current_step: OnboardingStep;
      draft: OnboardingDraft;
      status?: OnboardingSessionStatus;
    }
  ): Promise<SessionRow> {
    const { data, error } = await this.supabase
      .from("onboarding_sessions")
      .upsert(
        {
          user_id: userId,
          current_step: patch.current_step,
          draft: patch.draft,
          status: patch.status ?? ONBOARDING_SESSION_STATUS.inProgress,
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as SessionRow;
  }

  async markCompleted(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("onboarding_sessions")
      .update({ status: ONBOARDING_SESSION_STATUS.completed })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }
}

function toSession(
  row: SessionRow,
  recommendations?: OnboardingSession["recommendations"]
): OnboardingSession {
  const step = isOnboardingStep(row.current_step)
    ? row.current_step
    : FIRST_ONBOARDING_STEP;

  return {
    userId: row.user_id,
    currentStep: step,
    draft: row.draft ?? {},
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recommendations,
  };
}

function weekEndFromStart(start: string): string {
  const d = new Date(`${start}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

export class OnboardingEngineServiceImpl implements OnboardingEngineService {
  private readonly repository: OnboardingSessionRepository;
  private readonly missionEngine: ReturnType<typeof createMissionEngineService>;

  constructor(
    private readonly supabase: SupabaseServerClient,
    private readonly aiProvider?: OnboardingAIProvider
  ) {
    this.repository = new OnboardingSessionRepository(supabase);
    this.missionEngine = createMissionEngineService(supabase);
  }

  async start(
    context: OnboardingEngineContext
  ): Promise<OnboardingEngineResult<OnboardingSession>> {
    try {
      const existing = await this.repository.find(context.userId);
      if (existing?.status === ONBOARDING_SESSION_STATUS.inProgress) {
        return { data: await this.attachRecommendations(toSession(existing)) };
      }

      const row = await this.repository.upsert(context.userId, {
        current_step: FIRST_ONBOARDING_STEP,
        draft: {},
        status: ONBOARDING_SESSION_STATUS.inProgress,
      });

      return { data: await this.attachRecommendations(toSession(row)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to start onboarding" };
    }
  }

  async nextStep(
    context: OnboardingEngineContext,
    input?: OnboardingStepInput
  ): Promise<OnboardingEngineResult<OnboardingSession>> {
    try {
      const session = await this.requireActiveSession(context.userId);
      const draft = mergeDraft(session.draft, input ?? {});
      const next = getNextStep(session.currentStep);

      if (!next) {
        return { error: "Already at final onboarding step" };
      }

      const row = await this.repository.upsert(context.userId, {
        current_step: next,
        draft,
      });

      return { data: await this.attachRecommendations(toSession(row)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to advance step" };
    }
  }

  async previousStep(
    context: OnboardingEngineContext
  ): Promise<OnboardingEngineResult<OnboardingSession>> {
    try {
      const session = await this.requireActiveSession(context.userId);
      const previous = getPreviousStep(session.currentStep);

      if (!previous) {
        return { error: "Already at first onboarding step" };
      }

      const row = await this.repository.upsert(context.userId, {
        current_step: previous,
        draft: session.draft,
      });

      return { data: await this.attachRecommendations(toSession(row)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to go back" };
    }
  }

  async saveDraft(
    context: OnboardingEngineContext,
    draft: OnboardingStepInput
  ): Promise<OnboardingEngineResult<OnboardingSession>> {
    try {
      const session = await this.requireActiveSession(context.userId);
      const merged = mergeDraft(session.draft, draft);

      const row = await this.repository.upsert(context.userId, {
        current_step: session.currentStep,
        draft: merged,
      });

      return { data: await this.attachRecommendations(toSession(row)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to save draft" };
    }
  }

  async resume(
    context: OnboardingEngineContext
  ): Promise<OnboardingEngineResult<OnboardingSession | null>> {
    try {
      const row = await this.repository.find(context.userId);
      if (!row || row.status !== ONBOARDING_SESSION_STATUS.inProgress) {
        return { data: null };
      }

      return { data: await this.attachRecommendations(toSession(row)) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to resume onboarding" };
    }
  }

  async complete(
    context: OnboardingEngineContext,
    input: OnboardingCompleteInput
  ): Promise<OnboardingEngineResult<OnboardingCompleteResult>> {
    try {
      const goalLabel =
        BUILD_GOALS.find((g) => g.id === input.buildGoal)?.label ?? input.buildGoal;

      const draft = mergeDraft(input, {});

      const { data: profile, error: profileFetchError } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", context.userId)
        .single();

      if (profileFetchError || !profile) {
        return { error: profileFetchError?.message ?? "Profile not found" };
      }

      const mission = await this.missionEngine.createMission(
        { userId: context.userId },
        {
          title: draft.missionTitle?.trim() || `Build: ${goalLabel}`,
          description:
            draft.buildVision?.trim() ||
            `Building toward ${goalLabel.toLowerCase()}.`,
          vision: draft.buildVision?.trim() || null,
          category: input.buildGoal,
          state: MISSION_STATES.active,
          isPrimary: true,
        }
      );

      let projectId: string | undefined;
      if (draft.project?.name?.trim()) {
        let communityId: string | null = null;
        const { data: membership } = await this.supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", context.userId)
          .order("joined_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (membership) {
          communityId = membership.community_id;
        } else {
          const communityName = `${draft.fullName?.trim() || profile.full_name || "My"} Community`;
          const organizationId = await ensureDefaultOrganization(
            this.supabase,
            context.userId,
            profile.full_name
          );
          const { data: community, error: communityError } = await this.supabase
            .from("communities")
            .insert({
              name: communityName,
              slug: slugify(communityName),
              description: "Created during onboarding",
              owner_id: context.userId,
              organization_id: organizationId,
            })
            .select("id")
            .single();

          if (communityError) return { error: communityError.message };

          const { error: memberError } = await this.supabase.from("community_members").insert({
            community_id: community.id,
            user_id: context.userId,
            role: "owner",
          });

          if (memberError) return { error: memberError.message };
          communityId = community.id;
        }

        const { data: communityOrg } = await this.supabase
          .from("communities")
          .select("organization_id")
          .eq("id", communityId!)
          .single();

        const organizationId =
          communityOrg?.organization_id ??
          (await ensureDefaultOrganization(this.supabase, context.userId, profile.full_name));

        const { data: project, error: projectError } = await this.supabase
          .from("projects")
          .insert({
            name: draft.project.name.trim(),
            description: draft.project.description?.trim() || null,
            deadline: draft.project.deadline || null,
            owner_id: context.userId,
            community_id: communityId,
            organization_id: organizationId,
            status: "planning",
            progress: 0,
          })
          .select("id")
          .single();

        if (projectError) return { error: projectError.message };

        projectId = project.id;

        await this.supabase.from("project_members").insert({
          project_id: project.id,
          user_id: context.userId,
          role: "owner",
        });
      }

      let weeklyGoalId: string | undefined;
      const weekStart = getWeekStartUtc();
      const weekEnd = weekEndFromStart(weekStart);

      if (draft.weeklyGoal?.title?.trim()) {
        const { data: weeklyGoal, error: weeklyError } = await this.supabase
          .from("weekly_goals")
          .insert({
            user_id: context.userId,
            title: draft.weeklyGoal.title.trim(),
            description: draft.weeklyGoal.description?.trim() || null,
            target_count: draft.weeklyGoal.targetCount ?? DEFAULT_WEEKLY_GOAL_TARGET,
            action_href: "/dashboard",
            impact_points: DEFAULT_WEEKLY_GOAL_IMPACT,
            week_start: weekStart,
            week_end: weekEnd,
          })
          .select("id")
          .single();

        if (weeklyError) return { error: weeklyError.message };
        weeklyGoalId = weeklyGoal.id;
      } else {
        const stats = await fetchUserStats(this.supabase, context.userId);
        await fetchMissionEngineData(
          this.supabase,
          context.userId,
          profile as UserProfile,
          stats
        );
      }

      await syncUserSkill(this.supabase, context.userId, goalLabel);

      const { error: profileError } = await this.supabase
        .from("users")
        .update({
          build_goal: input.buildGoal,
          build_vision: draft.buildVision?.trim() || null,
          onboarding_completed: true,
          role: goalLabel,
          ...(draft.fullName?.trim() ? { full_name: draft.fullName.trim() } : {}),
        })
        .eq("id", context.userId);

      if (profileError) return { error: profileError.message };

      await recordImpactAction(this.supabase, {
        userId: context.userId,
        module: "system",
        eventType: "profile_completed",
        sourceId: context.userId,
      });

      await trackServerEvent({
        name: "profile_completed",
        userId: context.userId,
        screen: AnalyticsScreen.ONBOARDING,
        source: AnalyticsSource.ONBOARDING,
        entityId: context.userId,
      });

      const completedSession = await this.repository.upsert(context.userId, {
        current_step: ONBOARDING_STEP_ORDER[ONBOARDING_STEP_ORDER.length - 1],
        draft,
        status: ONBOARDING_SESSION_STATUS.completed,
      });

      await this.repository.markCompleted(context.userId);

      return {
        data: {
          session: toSession(completedSession),
          missionId: mission.id,
          projectId,
          weeklyGoalId,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to complete onboarding",
      };
    }
  }

  private async requireActiveSession(userId: string): Promise<OnboardingSession> {
    const row = await this.repository.find(userId);
    if (!row || row.status !== ONBOARDING_SESSION_STATUS.inProgress) {
      throw new Error("No active onboarding session. Call start() first.");
    }
    return toSession(row);
  }

  private async attachRecommendations(
    session: OnboardingSession
  ): Promise<OnboardingSession> {
    if (!this.aiProvider) return session;

    const recommendations = await this.aiProvider.getRecommendations(session);
    return { ...session, recommendations };
  }
}

export function createOnboardingEngineService(
  supabase: SupabaseServerClient,
  aiProvider?: OnboardingAIProvider
): OnboardingEngineService {
  return new OnboardingEngineServiceImpl(supabase, aiProvider);
}

export class OnboardingEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingEngineError";
  }
}
