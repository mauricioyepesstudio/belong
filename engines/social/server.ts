import type { SupabaseServerClient } from "@/lib/core/types";
import type { SocialPostType as DatabaseSocialPostType, UserProfile } from "@/types/database.types";
import { createNotification } from "@/lib/supabase/notify";
import {
  SOCIAL_IMAGE_MAX_BYTES,
  SOCIAL_VIDEO_MAX_BYTES,
  isOwnedSocialMediaPath,
} from "./media";
import type { CreateSocialPostInput, SocialComment } from "./types";

function databasePostType(type: CreateSocialPostInput["type"]): DatabaseSocialPostType {
  return type.toLowerCase() as DatabaseSocialPostType;
}

export function validateSocialPostInput(
  input: CreateSocialPostInput,
  userId: string
): string | null {
  const body = input.body?.trim() ?? "";
  if (!body && !input.media) return "Post content or media is required";
  if (input.communityId && input.projectId) return "Choose either a community or a project";
  if (input.type === "PHOTO" && !input.media?.mimeType.startsWith("image/")) return "Photo posts require an image";
  if (input.type === "VIDEO" && !input.media?.mimeType.startsWith("video/")) return "Video posts require a video";
  if (
    input.media &&
    ((input.media.type === "image" && !input.media.mimeType.startsWith("image/")) ||
      (input.media.type === "video" && !input.media.mimeType.startsWith("video/")))
  ) {
    return "Media type does not match the attachment";
  }
  const path = input.media?.path ?? null;
  if (input.media && (!path || !isOwnedSocialMediaPath(path, userId))) {
    return "Media must belong to the authenticated user";
  }
  return null;
}

export async function createSocialPostRecord(
  supabase: SupabaseServerClient,
  profile: UserProfile,
  input: CreateSocialPostInput
) {
  const validationError = validateSocialPostInput(input, profile.id);
  if (validationError) return { error: validationError };
  const mediaPath = input.media?.path ?? null;
  const mediaType = input.media?.type ??
    (input.media?.mimeType.startsWith("image/") ? "image"
      : input.media?.mimeType.startsWith("video/") ? "video"
      : null);
  if (input.media && (!mediaPath || !mediaType)) return { error: "Invalid social media" };
  const { data: mediaObject } = mediaPath
    ? await supabase.storage.from("post-media").list(profile.id, {
        search: mediaPath.slice(profile.id.length + 1),
        limit: 1,
      })
    : { data: null };
  const storedObject = mediaObject?.find(
    (object) => `${profile.id}/${object.name}` === mediaPath
  );
  if (input.media && !storedObject) return { error: "Uploaded media was not found" };
  const sizeBytes = storedObject?.metadata?.size;
  if (input.media && typeof sizeBytes !== "number") return { error: "Invalid media metadata" };
  if (input.media && input.media.sizeBytes !== sizeBytes) {
    return { error: "Stored media size does not match the attachment" };
  }
  const storedMimeType =
    typeof storedObject?.metadata?.mimetype === "string"
      ? storedObject.metadata.mimetype
      : null;
  if (
    input.media &&
    storedMimeType &&
    storedMimeType !== input.media.mimeType
  ) {
    return { error: "Stored media type does not match the attachment" };
  }
  if (
    (mediaType === "image" && sizeBytes! > SOCIAL_IMAGE_MAX_BYTES) ||
    (mediaType === "video" && sizeBytes! > SOCIAL_VIDEO_MAX_BYTES)
  ) return { error: "Media exceeds the allowed size" };

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      author_id: profile.id,
      post_type: databasePostType(input.type),
      body: input.body?.trim() ?? "",
      community_id: input.communityId ?? null,
      project_id: input.projectId ?? null,
      media_url: null,
      media_path: mediaPath,
      media_type: mediaType,
      media_mime_type: input.media?.mimeType ?? null,
      media_size_bytes: sizeBytes ?? null,
      media_metadata: input.media ? { original_name: input.media.name } : {},
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { post: data };
}

export async function notifySocialInteraction(
  supabase: SupabaseServerClient,
  params: {
    actor: UserProfile;
    recipientId: string;
    postId: string;
    kind: "comment" | "support";
    commentId?: string;
  }
) {
  if (params.actor.id === params.recipientId) return {};
  const actorName = params.actor.full_name ?? "Someone";
  return createNotification(supabase, {
    userId: params.recipientId,
    title: params.kind === "comment" ? "New comment" : "New support",
    body:
      params.kind === "comment"
        ? `${actorName} commented on your post`
        : `${actorName} supported your post`,
    type: "system",
    metadata: {
      actor_id: params.actor.id,
      target_type: "social_post",
      target_id: params.postId,
      post_id: params.postId,
      interaction_type: params.kind,
      actor_name: params.actor.full_name,
      actor_avatar_url: params.actor.avatar_url,
      ...(params.commentId ? { comment_id: params.commentId } : {}),
    },
  });
}

export function socialCommentFromRow(
  row: {
    id: string;
    post_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  },
  profile: UserProfile
): SocialComment {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: profile.id,
      fullName: profile.full_name ?? "Builder",
      avatarUrl: profile.avatar_url,
      role: profile.role,
      connectionState: { id: null, state: "none" },
    },
  };
}
