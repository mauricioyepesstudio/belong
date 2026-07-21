"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import type { ProjectTaskPriority, ProjectTaskStatus } from "@/lib/core/project-workspace";
import type { Json } from "@/types/database.types";
import type { Database } from "@/types/database.types";
import { recordImpactAction } from "@/engines/impact";
import { revalidateProject, requireProjectMember } from "@/lib/actions/_shared";

async function requireProjectAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string
): Promise<ActionResult | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === userId) return null;

  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member?.role === "admin") return null;
  return { error: "Not authorized" };
}

export async function logProjectActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    projectId: string;
    actorId: string;
    activityType: string;
    title: string;
    metadata?: Json;
  }
) {
  await supabase.from("project_activity").insert({
    project_id: params.projectId,
    actor_id: params.actorId,
    activity_type: params.activityType,
    title: params.title,
    metadata: params.metadata ?? {},
  });
}

export async function createProjectTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority?: ProjectTaskPriority;
    deadline?: string;
    assigneeId?: string;
  }
): Promise<ActionResult & { taskId?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const title = data.title.trim();
  if (!title) return { error: "Title is required" };

  const { count } = await supabase
    .from("project_tasks")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "todo");

  const { data: task, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: projectId,
      creator_id: profile.id,
      title,
      description: data.description?.trim() || null,
      priority: data.priority ?? "medium",
      deadline: data.deadline || null,
      assignee_id: data.assigneeId || null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "task_created",
    title: `Created task "${title}"`,
    metadata: { task_id: task.id },
  });

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_task_created",
    sourceId: projectId,
    metadata: { task_id: task.id, project_id: projectId },
  });

  revalidateProject(projectId);
  return { taskId: task.id };
}

export async function updateProjectTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: ProjectTaskStatus;
    priority?: ProjectTaskPriority;
    deadline?: string | null;
    assigneeId?: string | null;
    sortOrder?: number;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: task } = await supabase
    .from("project_tasks")
    .select("project_id, title, status")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found" };

  const err = await requireProjectMember(supabase, task.project_id, profile.id);
  if (err) return err;

  const updates: Database["public"]["Tables"]["project_tasks"]["Update"] = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.deadline !== undefined) updates.deadline = data.deadline || null;
  if (data.assigneeId !== undefined) updates.assignee_id = data.assigneeId;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;

  if (data.status !== undefined) {
    updates.status = data.status;
    updates.completed_at = data.status === "done" ? new Date().toISOString() : null;
  }

  const { error } = await supabase.from("project_tasks").update(updates).eq("id", taskId);
  if (error) return { error: error.message };

  if (data.status === "done" && task.status !== "done") {
    await logProjectActivity(supabase, {
      projectId: task.project_id,
      actorId: profile.id,
      activityType: "task_completed",
      title: `Completed task "${task.title}"`,
      metadata: { task_id: taskId },
    });

    await recordImpactAction(supabase, {
      userId: profile.id,
      module: "project",
      eventType: "project_task_completed",
      sourceId: task.project_id,
      metadata: { task_id: taskId, project_id: task.project_id },
    });
  }

  revalidateProject(task.project_id);
  return {};
}

export async function moveProjectTask(
  taskId: string,
  status: ProjectTaskStatus,
  sortOrder: number
): Promise<ActionResult> {
  return updateProjectTask(taskId, { status, sortOrder });
}

export async function createProjectMilestone(
  projectId: string,
  data: { title: string; description?: string; targetDate?: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const title = data.title.trim();
  if (!title) return { error: "Title is required" };

  const { count } = await supabase
    .from("project_milestones")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    title,
    description: data.description?.trim() || null,
    target_date: data.targetDate || null,
    sort_order: count ?? 0,
  });

  if (error) return { error: error.message };
  revalidateProject(projectId);
  return {};
}

export async function completeProjectMilestone(milestoneId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: milestone } = await supabase
    .from("project_milestones")
    .select("project_id, title")
    .eq("id", milestoneId)
    .single();

  if (!milestone) return { error: "Milestone not found" };

  const err = await requireProjectMember(supabase, milestone.project_id, profile.id);
  if (err) return err;

  await supabase
    .from("project_milestones")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", milestoneId);

  await logProjectActivity(supabase, {
    projectId: milestone.project_id,
    actorId: profile.id,
    activityType: "milestone_completed",
    title: `Completed milestone "${milestone.title}"`,
    metadata: { milestone_id: milestoneId },
  });

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_milestone_completed",
    sourceId: milestone.project_id,
    metadata: { milestone_id: milestoneId },
  });

  revalidateProject(milestone.project_id);
  return {};
}

export async function registerProjectFile(
  projectId: string,
  data: {
    fileName: string;
    storagePath: string;
    fileSize: number;
    mimeType?: string;
    parentFileId?: string;
    version?: number;
  }
): Promise<ActionResult & { fileId?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const { data: file, error } = await supabase
    .from("project_files")
    .insert({
      project_id: projectId,
      uploader_id: profile.id,
      file_name: data.fileName,
      storage_path: data.storagePath,
      file_size: data.fileSize,
      mime_type: data.mimeType || null,
      parent_file_id: data.parentFileId || null,
      version: data.version ?? 1,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "file_uploaded",
    title: `Uploaded ${data.fileName}`,
    metadata: { file_id: file.id },
  });

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_file_uploaded",
    sourceId: projectId,
    metadata: { file_id: file.id, project_id: projectId },
  });

  revalidateProject(projectId);
  return { fileId: file.id };
}

export async function getProjectFileUrl(
  fileId: string
): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: file } = await supabase
    .from("project_files")
    .select("project_id, storage_path")
    .eq("id", fileId)
    .single();

  if (!file) return { error: "File not found" };

  const err = await requireProjectMember(supabase, file.project_id, profile.id);
  if (err) return err;

  const { data: signed } = await supabase.storage
    .from("project-files")
    .createSignedUrl(file.storage_path, 3600);

  if (!signed?.signedUrl) return { error: "Could not generate download URL" };
  return { url: signed.signedUrl };
}

export async function createProjectDiscussion(
  projectId: string,
  data: { title: string; content: string }
): Promise<ActionResult & { discussionId?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const title = data.title.trim();
  const content = data.content.trim();
  if (!title || !content) return { error: "Title and content are required" };

  const { data: discussion, error } = await supabase
    .from("project_discussions")
    .insert({
      project_id: projectId,
      author_id: profile.id,
      title,
      content,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "discussion_started",
    title: `Started discussion "${title}"`,
    metadata: { discussion_id: discussion.id },
  });

  revalidateProject(projectId);
  return { discussionId: discussion.id };
}

export async function replyToProjectDiscussion(
  discussionId: string,
  content: string,
  parentReplyId?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Reply is required" };

  const { data: discussion } = await supabase
    .from("project_discussions")
    .select("project_id, title")
    .eq("id", discussionId)
    .single();

  if (!discussion) return { error: "Discussion not found" };

  const err = await requireProjectMember(supabase, discussion.project_id, profile.id);
  if (err) return err;

  const { error } = await supabase.from("project_discussion_replies").insert({
    discussion_id: discussionId,
    author_id: profile.id,
    content: trimmed,
    parent_reply_id: parentReplyId || null,
  });

  if (error) return { error: error.message };
  revalidateProject(discussion.project_id);
  return {};
}

export async function createProjectGoal(
  projectId: string,
  data: {
    title: string;
    description?: string;
    goalType?: "weekly" | "quarterly";
    dueDate?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const title = data.title.trim();
  if (!title) return { error: "Title is required" };

  const { error } = await supabase.from("project_goals").insert({
    project_id: projectId,
    creator_id: profile.id,
    title,
    description: data.description?.trim() || null,
    goal_type: data.goalType ?? "weekly",
    due_date: data.dueDate || null,
  });

  if (error) return { error: error.message };
  revalidateProject(projectId);
  return {};
}

export async function updateProjectGoalProgress(
  goalId: string,
  progressPercent: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: goal } = await supabase
    .from("project_goals")
    .select("project_id, title, progress_percent")
    .eq("id", goalId)
    .single();

  if (!goal) return { error: "Goal not found" };

  const err = await requireProjectMember(supabase, goal.project_id, profile.id);
  if (err) return err;

  const next = Math.min(100, Math.max(0, progressPercent));
  const completed = next >= 100;

  await supabase
    .from("project_goals")
    .update({
      progress_percent: next,
      status: completed ? "completed" : "active",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", goalId);

  if (completed && goal.progress_percent < 100) {
    await logProjectActivity(supabase, {
      projectId: goal.project_id,
      actorId: profile.id,
      activityType: "goal_completed",
      title: `Completed goal "${goal.title}"`,
      metadata: { goal_id: goalId },
    });

    await recordImpactAction(supabase, {
      userId: profile.id,
      module: "project",
      eventType: "project_goal_completed",
      sourceId: goal.project_id,
      metadata: { goal_id: goalId, project_id: goal.project_id },
    });
  }

  revalidateProject(goal.project_id);
  return {};
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: "admin" | "collaborator" | "member"
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectAdmin(supabase, projectId, profile.id);
  if (err) return err;

  if (userId === profile.id) return { error: "Cannot change your own role" };

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === userId) return { error: "Cannot change owner role" };

  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidateProject(projectId);
  return {};
}

export async function uploadProjectFile(
  projectId: string,
  formData: FormData
): Promise<ActionResult & { fileId?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const err = await requireProjectMember(supabase, projectId, profile.id);
  if (err) return err;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "File is required" };
  if (file.size > 10 * 1024 * 1024) return { error: "File must be under 10MB" };

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${projectId}/${profile.id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  return registerProjectFile(projectId, {
    fileName: file.name,
    storagePath,
    fileSize: file.size,
    mimeType: file.type,
  });
}
