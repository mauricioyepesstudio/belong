"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, getCurrentProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import type { ActionResult } from "@/lib/actions/types";
import type {
  ProjectCommentWithAuthor,
  ProjectDetail,
  ProjectPostWithMeta,
} from "@/lib/core";
import { fetchProjectDetail } from "@/lib/core/projects";
import { recordImpactAction } from "@/engines/impact/record-action.server";
import { logProjectActivity } from "@/lib/actions/project-workspace";
import { ensureDefaultOrganization } from "@/lib/core/organizations";
import {
  authorFromProfile,
  revalidateProject,
  requireCommunityMembership,
  requireProjectMembership,
} from "@/lib/actions/_shared";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";

export async function refreshProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchProjectDetail(supabase, projectId, profile?.id ?? null);
}

function validateDeadline(deadline?: string | null): ActionResult | null {
  if (!deadline) return null;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return { error: "Invalid deadline" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) return { error: "Deadline cannot be in the past" };
  return null;
}

export async function createProject(data: {
  name: string;
  communityId: string;
  description?: string;
  deadline?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.name.trim()) return { error: "Name is required" };
  if (!data.communityId) return { error: "Community is required" };

  const membershipError = await requireCommunityMembership(
    supabase,
    data.communityId,
    profile.id
  );
  if (membershipError) return membershipError;

  const deadlineError = validateDeadline(data.deadline);
  if (deadlineError) return deadlineError;

  const { data: community } = await supabase
    .from("communities")
    .select("organization_id")
    .eq("id", data.communityId)
    .single();

  if (!community) return { error: "Community not found" };

  const organizationId =
    community.organization_id ??
    (await ensureDefaultOrganization(supabase, profile.id, profile.full_name));

  const { data: lifeMission } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .neq("state", "archived")
    .maybeSingle();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      deadline: data.deadline || null,
      owner_id: profile.id,
      community_id: data.communityId,
      organization_id: organizationId,
      status: "planning",
      progress: 0,
      mission_id: lifeMission?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: profile.id,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return { error: memberError.message };
  }

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_created",
    sourceId: project.id,
    metadata: { name: data.name.trim() },
  });

  revalidateProject(project.id);

  await trackServerEvent({
    name: "project_created",
    userId: profile.id,
    screen: AnalyticsScreen.PROJECTS,
    source: AnalyticsSource.PROJECT_CREATE,
    entityId: project.id,
    properties: { community_id: data.communityId },
  });

  return { id: project.id };
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    status?: "planning" | "active" | "completed" | "archived";
    progress?: number;
    deadline?: string | null;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== profile.id) {
    return { error: "Not authorized" };
  }

  const updates: {
    name?: string;
    description?: string | null;
    status?: "planning" | "active" | "completed" | "archived";
    progress?: number;
    deadline?: string | null;
  } = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) return { error: "Name cannot be empty" };
    updates.name = trimmed;
  }
  if (data.description !== undefined) {
    updates.description = data.description?.trim() || null;
  }
  if (data.status !== undefined) {
    updates.status = data.status;
  }
  if (data.progress !== undefined) {
    if (data.progress < 0 || data.progress > 100) {
      return { error: "Progress must be between 0 and 100" };
    }
    updates.progress = data.progress;
  }
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline);
    if (deadlineError) return deadlineError;
    updates.deadline = data.deadline || null;
  }

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase.from("projects").update(updates).eq("id", projectId);

  if (error) return { error: error.message };

  if (data.status === "completed") {
    await recordImpactAction(supabase, {
      userId: profile.id,
      module: "project",
      eventType: "project_completed",
      sourceId: projectId,
    });
  }

  revalidateProject(projectId);
  return {};
}

export async function joinProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("name, owner_id, community_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const communityError = await requireCommunityMembership(
    supabase,
    project.community_id,
    profile.id
  );
  if (communityError) return communityError;

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  if (project.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: project.owner_id,
      title: "New project member",
      body: `${profile.full_name ?? "Someone"} joined ${project.name}`,
      type: "project",
      metadata: { project_id: projectId },
    });
  }

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_join",
    sourceId: projectId,
    metadata: { project_name: project.name },
  });

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "member_joined",
    title: `${profile.full_name ?? "Someone"} joined the project`,
    metadata: { user_id: profile.id },
  });

  revalidateProject(projectId);
  return {};
}

export async function leaveProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === profile.id) {
    return { error: "Project owners cannot leave their own project." };
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };

  revalidateProject(projectId);
  return {};
}

export async function createProjectPost(
  projectId: string,
  content: string,
  imageUrl?: string | null
): Promise<ActionResult & { post?: ProjectPostWithMeta }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Post content is required" };

  const membershipError = await requireProjectMembership(supabase, projectId, profile.id);
  if (membershipError) return membershipError;

  const { data: project } = await supabase
    .from("projects")
    .select("name, owner_id")
    .eq("id", projectId)
    .single();

  const { data: post, error } = await supabase
    .from("project_posts")
    .insert({
      project_id: projectId,
      author_id: profile.id,
      content: trimmed,
      image_url: imageUrl?.trim() || null,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_post",
    sourceId: post.id,
    metadata: { project_id: projectId, post_id: post.id },
  });

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "post_created",
    title: `${profile.full_name ?? "Someone"} shared an update`,
    metadata: { post_id: post.id },
  });

  if (project && project.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: project.owner_id,
      title: "New project update",
      body: `${profile.full_name ?? "Someone"} posted in ${project.name}`,
      type: "project",
      metadata: { project_id: projectId, post_id: post.id },
    });
  }

  revalidateProject(projectId);

  await trackServerEvent({
    name: "post_created",
    userId: profile.id,
    screen: AnalyticsScreen.PROJECT_DETAIL,
    source: AnalyticsSource.PROJECT_POST,
    entityId: post.id,
    properties: { project_id: projectId },
  });

  return {
    post: {
      ...post,
      author: authorFromProfile(profile),
      likeCount: 0,
      commentCount: 0,
      likedByCurrentUser: false,
      comments: [],
    } satisfies ProjectPostWithMeta,
  };
}

export async function toggleProjectPostLike(
  postId: string
): Promise<ActionResult & { liked?: boolean }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: post } = await supabase
    .from("project_posts")
    .select("project_id, author_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const membershipError = await requireProjectMembership(supabase, post.project_id, profile.id);
  if (membershipError) return membershipError;

  const { data: existing } = await supabase
    .from("project_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("project_post_likes").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidateProject(post.project_id);
    return { liked: false };
  }

  const { error } = await supabase.from("project_post_likes").insert({
    post_id: postId,
    user_id: profile.id,
  });

  if (error) return { error: error.message };

  if (post.author_id !== profile.id) {
    await createNotification(supabase, {
      userId: post.author_id,
      title: "Post liked",
      body: `${profile.full_name ?? "Someone"} liked your post`,
      type: "project",
      metadata: { post_id: postId, project_id: post.project_id },
    });
  }

  revalidateProject(post.project_id);
  return { liked: true };
}

export async function createProjectPostComment(
  postId: string,
  content: string
): Promise<ActionResult & { comment?: ProjectCommentWithAuthor }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment is required" };

  const { data: post } = await supabase
    .from("project_posts")
    .select("project_id, author_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const membershipError = await requireProjectMembership(supabase, post.project_id, profile.id);
  if (membershipError) return membershipError;

  const { data: comment, error } = await supabase
    .from("project_post_comments")
    .insert({
      post_id: postId,
      author_id: profile.id,
      content: trimmed,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "project",
    eventType: "project_comment",
    sourceId: comment.id,
    metadata: { project_id: post.project_id, post_id: postId, comment_id: comment.id },
  });

  if (post.author_id !== profile.id) {
    await createNotification(supabase, {
      userId: post.author_id,
      title: "New comment",
      body: `${profile.full_name ?? "Someone"} commented on your post`,
      type: "project",
      metadata: { post_id: postId, project_id: post.project_id },
    });
  }

  revalidateProject(post.project_id);
  return {
    comment: {
      ...comment,
      author: authorFromProfile(profile),
    } satisfies ProjectCommentWithAuthor,
  };
}

export async function inviteToProject(
  projectId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: project } = await supabase
    .from("projects")
    .select("name, owner_id, community_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const isOwner = project.owner_id === profile.id;
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (membership?.role !== "admin") {
      return { error: "Not authorized" };
    }
  }

  const inviteeCommunityError = await requireCommunityMembership(
    supabase,
    project.community_id,
    userId
  );
  if (inviteeCommunityError) {
    return { error: "User must be a member of the project's community" };
  }

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  await createNotification(supabase, {
    userId,
    title: "Project invitation",
    body: `You were added to ${project.name}`,
    type: "project",
    metadata: { project_id: projectId },
  });

  const { data: invitee } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  await logProjectActivity(supabase, {
    projectId,
    actorId: profile.id,
    activityType: "member_joined",
    title: `${invitee?.full_name ?? "A member"} was invited to the project`,
    metadata: { user_id: userId },
  });

  revalidateProject(projectId);
  return {};
}

export async function updateProjectPost(postId: string, content: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Post content is required" };

  const { data: post } = await supabase
    .from("project_posts")
    .select("author_id, project_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };
  if (post.author_id !== profile.id) return { error: "Not authorized" };

  const { error } = await supabase
    .from("project_posts")
    .update({ content: trimmed })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidateProject(post.project_id);
  return {};
}

export async function deleteProjectPost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: post } = await supabase
    .from("project_posts")
    .select("author_id, project_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", post.project_id)
    .single();

  const isAuthor = post.author_id === profile.id;
  const isOwner = project?.owner_id === profile.id;

  if (!isAuthor && !isOwner) return { error: "Not authorized" };

  const { error } = await supabase.from("project_posts").delete().eq("id", postId);

  if (error) return { error: error.message };

  revalidateProject(post.project_id);
  return {};
}
