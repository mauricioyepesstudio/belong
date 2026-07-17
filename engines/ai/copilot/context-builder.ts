import type { SupabaseServerClient } from "@/lib/core/types";
import { fetchCommunityDetail } from "@/lib/core/communities";
import { fetchOrganizationDetail } from "@/lib/core/organizations";
import { fetchProjectDetail } from "@/lib/core/projects";
import { fetchImpactEngineData } from "@/engines/impact/data";
import { fetchUserStats } from "@/lib/core/stats";
import { createMissionEngineService } from "@/engines/mission/service";
import type { AICopilotContextType } from "@/types/database.types";
import type { CopilotContextPayload } from "./types";

export async function buildCopilotContext(
  supabase: SupabaseServerClient,
  params: {
    contextType: AICopilotContextType;
    contextId: string;
    userId: string;
    slug?: string;
  }
): Promise<CopilotContextPayload | null> {
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, build_goal, build_vision")
    .eq("id", params.userId)
    .single();

  if (!profile) return null;

  const stats = await fetchUserStats(supabase, params.userId);
  const missionService = createMissionEngineService(supabase);
  const lifeMission = await missionService.getMission({ userId: params.userId });

  let impactLevel: string | null = null;
  try {
    const impact = await fetchImpactEngineData(
      supabase,
      params.userId,
      profile as Parameters<typeof fetchImpactEngineData>[2],
      stats,
      Boolean(lifeMission),
      0
    );
    impactLevel = impact.score.level;
  } catch {
    impactLevel = null;
  }

  const baseUser = {
    userId: params.userId,
    userName: profile.full_name,
    userBuildGoal: profile.build_goal,
    userMissionTitle: lifeMission?.title ?? null,
    userImpactLevel: impactLevel,
  };

  if (params.contextType === "community") {
    if (!params.slug) return null;
    const detail = await fetchCommunityDetail(supabase, params.slug, params.userId);
    if (!detail || detail.community.id !== params.contextId) return null;

    const discussions = detail.posts.map((post) => ({
      author: post.author.fullName ?? "Member",
      content: post.content,
      createdAt: post.created_at,
      comments: post.comments.map((c) => c.content),
    }));

    return {
      type: "community",
      id: detail.community.id,
      slug: detail.community.slug,
      name: detail.community.name,
      description: detail.community.description,
      ...baseUser,
      discussions,
      tasks: [],
      milestones: [],
      stats: {
        memberCount: detail.memberCount,
        postCount: detail.posts.length,
        projectsInCommunity: 0,
      },
    };
  }

  if (params.contextType === "project") {
    const detail = await fetchProjectDetail(supabase, params.contextId, params.userId);
    if (!detail) return null;

    const workspace = detail.workspace;

    const discussions = [
      ...detail.posts.map((post) => ({
        author: post.author.fullName ?? "Member",
        content: post.content,
        createdAt: post.created_at,
        comments: post.comments.map((c) => c.content),
      })),
      ...workspace.discussions.map((d) => ({
        author: d.authorName ?? "Member",
        content: `${d.title}\n${d.content}`,
        createdAt: d.createdAt,
        comments: d.replies.map((r) => r.content),
      })),
    ];

    return {
      type: "project",
      id: detail.project.id,
      name: detail.project.name,
      description: detail.project.description,
      ...baseUser,
      discussions,
      tasks: workspace.tasks.map((t) => ({
        title: t.title,
        description: t.description ?? undefined,
        priority: t.priority,
      })),
      milestones: workspace.milestones.map((m) => ({
        title: m.title,
        completed: Boolean(m.completedAt),
        targetDate: m.targetDate,
      })),
      stats: {
        status: detail.project.status,
        progress: detail.project.progress,
        memberCount: detail.members.length,
        taskCount: workspace.tasks.length,
        completedTasks: workspace.analytics.completedTasks,
        healthScore: workspace.analytics.healthScore,
      },
    };
  }

  if (params.contextType === "organization") {
    if (!params.slug) return null;
    const detail = await fetchOrganizationDetail(supabase, params.slug, params.userId);
    if (!detail || detail.organization.id !== params.contextId) return null;

    const communityIds = detail.communities.map((c) => c.id);
    let discussions: CopilotContextPayload["discussions"] = [];

    if (communityIds.length > 0) {
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id, content, created_at, author_id, community_id")
        .in("community_id", communityIds)
        .order("created_at", { ascending: false })
        .limit(20);

      const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
      const { data: authors } = authorIds.length
        ? await supabase.from("users").select("id, full_name").in("id", authorIds)
        : { data: [] as { id: string; full_name: string | null }[] };

      const authorMap = new Map((authors ?? []).map((a) => [a.id, a.full_name ?? "Member"]));

      discussions = (posts ?? []).map((post) => ({
        author: authorMap.get(post.author_id) ?? "Member",
        content: post.content,
        createdAt: post.created_at,
        comments: [],
      }));
    }

    return {
      type: "organization",
      id: detail.organization.id,
      slug: detail.organization.slug,
      name: detail.organization.name,
      description: detail.organization.description,
      ...baseUser,
      discussions,
      tasks: [],
      milestones: [],
      stats: {
        memberCount: detail.memberCount,
        projectCount: detail.projects.length,
        communityCount: detail.communities.length,
        missionCount: detail.missions.length,
        impactScore: detail.reputation.impactScore,
        healthScore: detail.analytics.healthScore,
      },
    };
  }

  return null;
}
