"use client";

import { createClient } from "@/lib/supabase/client";

export async function fetchAuthorMeta(authorId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("id", authorId)
    .single();

  return {
    id: authorId,
    fullName: data?.full_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
  };
}

export function mapCommunityPostRow(
  row: Record<string, unknown>,
  author: { id: string; fullName: string | null; avatarUrl: string | null }
) {
  return {
    id: String(row.id),
    community_id: String(row.community_id),
    author_id: String(row.author_id),
    content: String(row.content),
    image_url: row.image_url ? String(row.image_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author,
    likeCount: 0,
    commentCount: 0,
    likedByCurrentUser: false,
    comments: [],
  };
}

export function mapProjectPostRow(
  row: Record<string, unknown>,
  author: { id: string; fullName: string | null; avatarUrl: string | null }
) {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    author_id: String(row.author_id),
    content: String(row.content),
    image_url: row.image_url ? String(row.image_url) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author: {
      id: author.id,
      fullName: author.fullName,
      avatarUrl: author.avatarUrl,
    },
    likeCount: 0,
    commentCount: 0,
    likedByCurrentUser: false,
    comments: [],
  };
}

export function dedupeById<T extends { id: string }>(items: T[], item: T): T[] {
  if (items.some((existing) => existing.id === item.id)) return items;
  return [item, ...items];
}

export function mapProjectTaskRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    creatorId: String(row.creator_id),
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    status: row.status as "todo" | "in_progress" | "review" | "done",
    priority: row.priority as "low" | "medium" | "high" | "urgent",
    deadline: row.deadline ? String(row.deadline) : null,
    sortOrder: Number(row.sort_order ?? 0),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
    assigneeName: null,
    assigneeAvatar: null,
  };
}

export function mapProjectActivityRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    activityType: String(row.activity_type),
    title: String(row.title),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    actorName: null,
  };
}

export function mapProjectDiscussionRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    authorId: String(row.author_id),
    title: String(row.title),
    content: String(row.content),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    authorName: null,
    authorAvatar: null,
    replyCount: 0,
    replies: [],
  };
}
