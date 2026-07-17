import type { SupabaseServerClient } from "./types";

export type ProjectTaskStatus = "todo" | "in_progress" | "review" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high" | "urgent";
export type ProjectGoalType = "weekly" | "quarterly";

export type ProjectTask = {
  id: string;
  projectId: string;
  creatorId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  deadline: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  assigneeName: string | null;
  assigneeAvatar: string | null;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: string | null;
  sortOrder: number;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  uploaderId: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string | null;
  version: number;
  parentFileId: string | null;
  createdAt: string;
  uploaderName: string | null;
  downloadUrl?: string;
};

export type ProjectDiscussionReply = {
  id: string;
  discussionId: string;
  authorId: string;
  parentReplyId: string | null;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
};

export type ProjectDiscussion = {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorAvatar: string | null;
  replyCount: number;
  replies: ProjectDiscussionReply[];
};

export type ProjectGoal = {
  id: string;
  projectId: string;
  creatorId: string;
  title: string;
  description: string | null;
  goalType: ProjectGoalType;
  progressPercent: number;
  dueDate: string | null;
  status: string;
  completedAt: string | null;
};

export type ProjectActivityItem = {
  id: string;
  projectId: string;
  actorId: string | null;
  activityType: string;
  title: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
};

export type ProjectAnalytics = {
  healthScore: number;
  completedTasks: number;
  totalTasks: number;
  missionScore: number;
  teamParticipation: number;
  impactGenerated: number;
  tasksByStatus: Record<ProjectTaskStatus, number>;
};

export type ProjectMissionSummary = {
  id: string;
  title: string;
  description: string | null;
  state: string;
} | null;

function mapTask(
  row: {
    id: string;
    project_id: string;
    creator_id: string;
    assignee_id: string | null;
    title: string;
    description: string | null;
    status: ProjectTaskStatus;
    priority: ProjectTaskPriority;
    deadline: string | null;
    sort_order: number;
    completed_at: string | null;
    created_at: string;
  },
  assignee?: { full_name: string | null; avatar_url: string | null } | null
): ProjectTask {
  return {
    id: row.id,
    projectId: row.project_id,
    creatorId: row.creator_id,
    assigneeId: row.assignee_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    deadline: row.deadline,
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    assigneeName: assignee?.full_name ?? null,
    assigneeAvatar: assignee?.avatar_url ?? null,
  };
}

export async function fetchProjectTasks(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<ProjectTask[]> {
  const { data: rows } = await supabase
    .from("project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!rows?.length) return [];

  const assigneeIds = [...new Set(rows.map((r) => r.assignee_id).filter(Boolean))] as string[];
  const { data: users } = assigneeIds.length
    ? await supabase.from("users").select("id, full_name, avatar_url").in("id", assigneeIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return rows.map((row) => mapTask(row, row.assignee_id ? userMap.get(row.assignee_id) : null));
}

export async function fetchProjectMilestones(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<ProjectMilestone[]> {
  const { data } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    projectId: m.project_id,
    title: m.title,
    description: m.description,
    targetDate: m.target_date,
    completedAt: m.completed_at,
    sortOrder: m.sort_order,
  }));
}

export async function fetchProjectFiles(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<ProjectFile[]> {
  const { data: rows } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!rows?.length) return [];

  const uploaderIds = [...new Set(rows.map((r) => r.uploader_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", uploaderIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return rows.map((f) => ({
    id: f.id,
    projectId: f.project_id,
    uploaderId: f.uploader_id,
    fileName: f.file_name,
    storagePath: f.storage_path,
    fileSize: f.file_size,
    mimeType: f.mime_type,
    version: f.version,
    parentFileId: f.parent_file_id,
    createdAt: f.created_at,
    uploaderName: userMap.get(f.uploader_id) ?? null,
  }));
}

export async function fetchProjectDiscussions(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<ProjectDiscussion[]> {
  const { data: discussions } = await supabase
    .from("project_discussions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!discussions?.length) return [];

  const discussionIds = discussions.map((d) => d.id);
  const authorIds = [...new Set(discussions.map((d) => d.author_id))];

  const [{ data: replies }, { data: authors }] = await Promise.all([
    supabase
      .from("project_discussion_replies")
      .select("*")
      .in("discussion_id", discussionIds)
      .order("created_at", { ascending: true }),
    supabase.from("users").select("id, full_name, avatar_url").in("id", authorIds),
  ]);

  const replyAuthorIds = [...new Set((replies ?? []).map((r) => r.author_id))];
  const missingIds = replyAuthorIds.filter((id) => !authorIds.includes(id));
  let allAuthors = authors ?? [];
  if (missingIds.length) {
    const { data: extra } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", missingIds);
    allAuthors = [...allAuthors, ...(extra ?? [])];
  }

  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));

  return discussions.map((d) => {
    const dReplies = (replies ?? []).filter((r) => r.discussion_id === d.id);
    const author = authorMap.get(d.author_id);
    return {
      id: d.id,
      projectId: d.project_id,
      authorId: d.author_id,
      title: d.title,
      content: d.content,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      authorName: author?.full_name ?? null,
      authorAvatar: author?.avatar_url ?? null,
      replyCount: dReplies.length,
      replies: dReplies.map((r) => {
        const ra = authorMap.get(r.author_id);
        return {
          id: r.id,
          discussionId: r.discussion_id,
          authorId: r.author_id,
          parentReplyId: r.parent_reply_id,
          content: r.content,
          createdAt: r.created_at,
          authorName: ra?.full_name ?? null,
          authorAvatar: ra?.avatar_url ?? null,
        };
      }),
    };
  });
}

export async function fetchProjectGoals(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<ProjectGoal[]> {
  const { data } = await supabase
    .from("project_goals")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true });

  return (data ?? []).map((g) => ({
    id: g.id,
    projectId: g.project_id,
    creatorId: g.creator_id,
    title: g.title,
    description: g.description,
    goalType: g.goal_type as ProjectGoalType,
    progressPercent: g.progress_percent,
    dueDate: g.due_date,
    status: g.status,
    completedAt: g.completed_at,
  }));
}

export async function fetchProjectActivity(
  supabase: SupabaseServerClient,
  projectId: string,
  limit = 40
): Promise<ProjectActivityItem[]> {
  const { data: rows } = await supabase
    .from("project_activity")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const { data: users } = actorIds.length
    ? await supabase.from("users").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    actorId: r.actor_id,
    activityType: r.activity_type,
    title: r.title,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
    actorName: r.actor_id ? (userMap.get(r.actor_id) ?? null) : null,
  }));
}

export async function fetchProjectMissionSummary(
  supabase: SupabaseServerClient,
  ownerId: string,
  missionId: string | null
): Promise<ProjectMissionSummary> {
  if (missionId) {
    const { data } = await supabase.from("missions").select("*").eq("id", missionId).maybeSingle();
    if (data) {
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        state: data.state,
      };
    }
  }

  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", ownerId)
    .eq("is_primary", true)
    .neq("state", "archived")
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    state: data.state,
  };
}

export async function fetchProjectImpactTotal(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<number> {
  const { data } = await supabase
    .from("impact_events")
    .select("points")
    .eq("module", "project")
    .or(`source_id.eq.${projectId},metadata->>project_id.eq.${projectId}`);

  return (data ?? []).reduce((sum, e) => sum + e.points, 0);
}

export function computeProjectAnalytics(input: {
  tasks: ProjectTask[];
  members: { userId: string }[];
  activity: ProjectActivityItem[];
  impactGenerated: number;
  missionScore: number;
  projectProgress: number;
}): ProjectAnalytics {
  const tasksByStatus: Record<ProjectTaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };

  for (const task of input.tasks) {
    tasksByStatus[task.status]++;
  }

  const totalTasks = input.tasks.length;
  const completedTasks = tasksByStatus.done;
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const activeMembers = new Set(input.activity.map((a) => a.actorId).filter(Boolean));
  const teamParticipation =
    input.members.length > 0
      ? Math.round((activeMembers.size / input.members.length) * 100)
      : 0;

  const healthScore = Math.min(
    100,
    Math.round(
      input.projectProgress * 0.3 +
        taskCompletionRate * 100 * 0.35 +
        teamParticipation * 0.2 +
        Math.min(input.impactGenerated, 100) * 0.15
    )
  );

  return {
    healthScore,
    completedTasks,
    totalTasks,
    missionScore: input.missionScore,
    teamParticipation,
    impactGenerated: input.impactGenerated,
    tasksByStatus,
  };
}

export async function fetchProjectWorkspaceBundle(
  supabase: SupabaseServerClient,
  projectId: string,
  ownerId: string,
  missionId: string | null,
  memberUserIds: string[],
  projectProgress: number
) {
  const [tasks, milestones, files, discussions, goals, activity, mission, impactGenerated] =
    await Promise.all([
      fetchProjectTasks(supabase, projectId),
      fetchProjectMilestones(supabase, projectId),
      fetchProjectFiles(supabase, projectId),
      fetchProjectDiscussions(supabase, projectId),
      fetchProjectGoals(supabase, projectId),
      fetchProjectActivity(supabase, projectId),
      fetchProjectMissionSummary(supabase, ownerId, missionId),
      fetchProjectImpactTotal(supabase, projectId),
    ]);

  const missionScore = mission?.state === "completed" ? 100 : mission?.state === "active" ? 60 : 20;

  const analytics = computeProjectAnalytics({
    tasks,
    members: memberUserIds.map((userId) => ({ userId })),
    activity,
    impactGenerated,
    missionScore,
    projectProgress,
  });

  return {
    tasks,
    milestones,
    files,
    discussions,
    goals,
    activity,
    mission,
    impactGenerated,
    analytics,
  };
}
