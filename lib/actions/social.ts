"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import type { Json, SocialPostType as DatabaseSocialPostType } from "@/types/database.types";
import {
  classifySocialMedia,
  createSocialPostRecord,
  fetchGlobalSocialFeed,
  isOwnedSocialMediaPath,
  notifySocialInteraction,
  socialCommentFromRow,
  socialMediaExtension,
  type CreateSocialPostInput,
  type SocialFeedPage,
  type SocialPost,
  type SocialPostType,
  type SocialComment,
} from "@/engines/social";
import { toUserErrorMessage } from "@/lib/errors/user-message";

function revalidateSocialSurfaces(authorId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/explore");
  revalidatePath("/profile");
  if (authorId) revalidatePath(`/people/${authorId}`);
}

export async function uploadSocialPostMedia(
  formData: FormData
): Promise<ActionResult & {
  media?: {
    url: string;
    path: string;
    type: "image" | "video";
    mimeType: string;
    sizeBytes: number;
    name: string;
  };
}> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const file = formData.get("media") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const classification = classifySocialMedia(file);
  if (!classification) return { error: "Unsupported image or video type" };
  if (file.size > classification.maxBytes) {
    return {
      error: classification.type === "image"
        ? "Image must be under 5MB"
        : "Video must be under 50MB",
    };
  }

  const extension = socialMediaExtension(file.name, file.type);
  const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) {
    return { error: toUserErrorMessage(error, "Could not upload media. Please try again.") };
  }
  const { data, error: signedUrlError } = await supabase.storage
    .from("post-media")
    .createSignedUrl(path, 15 * 60);
  if (signedUrlError || !data?.signedUrl) {
    await supabase.storage.from("post-media").remove([path]);
    return {
      error: toUserErrorMessage(
        signedUrlError,
        "Could not prepare the uploaded media. Please try again."
      ),
    };
  }
  return {
    url: data.signedUrl,
    media: {
      url: data.signedUrl,
      path,
      type: classification.type,
      mimeType: file.type,
      sizeBytes: file.size,
      name: file.name,
    },
  };
}

export async function deleteSocialPostMedia(path: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  if (!isOwnedSocialMediaPath(path, profile.id)) {
    return { error: "Not authorized" };
  }
  const { error } = await supabase.storage.from("post-media").remove([path]);
  if (error) {
    return {
      error: toUserErrorMessage(error, "Could not remove media. Please try again."),
    };
  }
  return {};
}

export async function createSocialPost(
  input: CreateSocialPostInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const result = await createSocialPostRecord(supabase, profile, input);
  if ("error" in result) return { error: result.error };
  revalidateSocialSurfaces(profile.id);
  return { id: result.post.id };
}

export async function fetchSocialFeedPage(
  cursor: string
): Promise<ActionResult & { page?: SocialFeedPage }> {
  const supabase = await createClient();
  const viewer = await requireProfile();
  try {
    const page = await fetchGlobalSocialFeed(supabase, viewer.id, { cursor, limit: 15 });
    return { page };
  } catch (error) {
    return { error: toUserErrorMessage(error, "Could not load more posts. Please try again.") };
  }
}

/**
 * Compact home-page preview of the global social feed — a thin Server
 * Action wrapper around fetchGlobalSocialFeed so the (client) HomeScreen
 * component tree can fetch a few real posts (see
 * engines/belong/components/home/home-social-preview.tsx) without
 * duplicating feed-fetching logic or needing its own Server Component.
 */
export async function getHomeSocialPreview(limit = 3): Promise<SocialPost[]> {
  const supabase = await createClient();
  const viewer = await requireProfile();
  const { posts } = await fetchGlobalSocialFeed(supabase, viewer.id, { limit });
  return posts;
}

export async function updateSocialPost(
  postId: string,
  input: { body: string; type?: SocialPostType }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const body = input.body.trim();
  const { data: post } = await supabase
    .from("social_posts")
    .select("author_id, media_path")
    .eq("id", postId)
    .single();
  if (!post) return { error: "Post not found" };
  if (post.author_id !== profile.id) return { error: "Not authorized" };
  if (!body && !post.media_path) return { error: "Post content or media is required" };

  const { error } = await supabase
    .from("social_posts")
    .update({
      body,
      ...(input.type
        ? { post_type: input.type.toLowerCase() as DatabaseSocialPostType }
        : {}),
    })
    .eq("id", postId);
  if (error) return { error: error.message };
  revalidateSocialSurfaces(profile.id);
  return {};
}

export async function deleteSocialPost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: post } = await supabase
    .from("social_posts")
    .select("author_id, media_path")
    .eq("id", postId)
    .single();
  if (!post) return { error: "Post not found" };
  if (post.author_id !== profile.id) return { error: "Not authorized" };

  const { error } = await supabase.from("social_posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  if (post.media_path && isOwnedSocialMediaPath(post.media_path, profile.id)) {
    const { error: storageError } = await supabase.storage
      .from("post-media")
      .remove([post.media_path]);
    if (storageError) console.error("Could not remove social post media:", storageError.message);
  }
  revalidateSocialSurfaces(profile.id);
  return {};
}

export async function toggleSocialPostSupport(
  postId: string
): Promise<ActionResult & { supported?: boolean }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: post } = await supabase
    .from("social_posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  if (!post) return { error: "Post not found" };

  const { data: existing } = await supabase
    .from("social_post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .eq("reaction", "support")
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("social_post_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidateSocialSurfaces(post.author_id);
    return { supported: false };
  }

  const { error } = await supabase.from("social_post_reactions").insert({
    post_id: postId,
    user_id: profile.id,
    reaction: "support",
  });
  if (error) {
    if (error.code === "23505") return { supported: true };
    return { error: error.message };
  }
  const notification = await notifySocialInteraction(supabase, {
    actor: profile,
    recipientId: post.author_id,
    postId,
    kind: "support",
  });
  if (notification.error) {
    await supabase
      .from("social_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .eq("reaction", "support");
    return { error: "Support could not be saved. Please try again." };
  }
  revalidateSocialSurfaces(post.author_id);
  return { supported: true };
}

export async function createSocialPostComment(
  postId: string,
  content: string
): Promise<ActionResult & { comment?: SocialComment }> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment is required" };
  const { data: post } = await supabase
    .from("social_posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  if (!post) return { error: "Post not found" };

  const { data, error } = await supabase
    .from("social_post_comments")
    .insert({ post_id: postId, author_id: profile.id, content: trimmed })
    .select("*")
    .single();
  if (error) return { error: error.message };
  const notification = await notifySocialInteraction(supabase, {
    actor: profile,
    recipientId: post.author_id,
    postId,
    commentId: data.id,
    kind: "comment",
  });
  if (notification.error) {
    await supabase.from("social_post_comments").delete().eq("id", data.id);
    return { error: "Comment could not be saved. Please try again." };
  }
  revalidateSocialSurfaces(post.author_id);
  return { comment: socialCommentFromRow(data, profile) };
}

export async function deleteSocialPostComment(commentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { data: comment } = await supabase
    .from("social_post_comments")
    .select("author_id, post_id")
    .eq("id", commentId)
    .single();
  if (!comment) return { error: "Comment not found" };
  if (comment.author_id !== profile.id) return { error: "Not authorized" };
  const { error } = await supabase
    .from("social_post_comments")
    .delete()
    .eq("id", commentId);
  if (error) return { error: error.message };
  revalidateSocialSurfaces();
  return {};
}

export const createSocialComment = createSocialPostComment;
export const deleteSocialComment = deleteSocialPostComment;

export type SocialMediaUploadMetadata = {
  url: string;
  path: string;
  type: "image" | "video";
  mimeType: string;
  sizeBytes: number;
  metadata?: Json;
};
