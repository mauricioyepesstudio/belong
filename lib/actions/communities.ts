"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, getCurrentProfile } from "@/lib/auth/session";
import { createNotification, slugify } from "@/lib/supabase/notify";
import { createCommunitySubscriptionCheckout } from "@/lib/actions/billing";
import { logCommunityContribution } from "@/lib/engine/mission-progress";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import type {
  CommunityCommentWithAuthor,
  CommunityDetail,
  CommunityPostWithMeta,
} from "@/lib/core";
import { fetchCommunityDetail } from "@/lib/core/communities";
import { ensureDefaultOrganization } from "@/lib/core/organizations";
import {
  authorFromProfile,
  revalidateCommunity,
  requireCommunityMembership,
} from "@/lib/actions/_shared";

export async function refreshCommunityDetail(slug: string): Promise<CommunityDetail | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchCommunityDetail(supabase, slug, profile?.id ?? null);
}

export async function createCommunity(data: {
  name: string;
  description?: string;
  tag?: string;
  organizationId?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.name.trim()) return { error: "Name is required" };

  const organizationId =
    data.organizationId ??
    (await ensureDefaultOrganization(supabase, profile.id, profile.full_name));

  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      name: data.name.trim(),
      slug: slugify(data.name),
      description: data.description?.trim() || null,
      tag: data.tag?.trim() || null,
      owner_id: profile.id,
      organization_id: organizationId,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  const { error: memberError } = await supabase.from("community_members").insert({
    community_id: community.id,
    user_id: profile.id,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("communities").delete().eq("id", community.id);
    return { error: memberError.message };
  }

  revalidateCommunity(community.slug);
  return { id: community.id, slug: community.slug };
}

export async function joinCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: community } = await supabase
    .from("communities")
    .select("is_paid, name, owner_id, slug")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };

  if (community.is_paid) {
    return createCommunitySubscriptionCheckout(communityId);
  }

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: profile.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  if (community.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: community.owner_id,
      title: "New community member",
      body: `${profile.full_name ?? "Someone"} joined ${community.name}`,
      type: "community",
      metadata: { community_id: communityId, slug: community.slug },
    });
  }

  await logCommunityContribution(supabase, profile.id, communityId, "join");

  revalidateCommunity(community.slug);
  return {};
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: community } = await supabase
    .from("communities")
    .select("slug, owner_id")
    .eq("id", communityId)
    .single();

  if (community?.owner_id === profile.id) {
    return { error: "Community owners cannot leave. Transfer ownership first." };
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };

  const { data: communityProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("community_id", communityId);

  if (communityProjects?.length) {
    const projectIds = communityProjects.map((p) => p.id);
    await supabase
      .from("project_members")
      .delete()
      .eq("user_id", profile.id)
      .in("project_id", projectIds);
  }

  revalidateCommunity(community?.slug);
  revalidatePath("/projects");
  return {};
}

export async function createCommunityPost(
  communityId: string,
  content: string,
  imageUrl?: string | null
): Promise<ActionResult & { post?: CommunityPostWithMeta }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Post content is required" };

  const membershipError = await requireCommunityMembership(supabase, communityId, profile.id);
  if (membershipError) return membershipError;

  const { data: community } = await supabase
    .from("communities")
    .select("slug, owner_id, name")
    .eq("id", communityId)
    .single();

  const { data: post, error } = await supabase
    .from("community_posts")
    .insert({
      community_id: communityId,
      author_id: profile.id,
      content: trimmed,
      image_url: imageUrl?.trim() || null,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logCommunityContribution(supabase, profile.id, communityId, "post", 10);

  if (community && community.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: community.owner_id,
      title: "New community post",
      body: `${profile.full_name ?? "Someone"} posted in ${community.name}`,
      type: "community",
      metadata: { community_id: communityId, post_id: post.id, slug: community.slug },
    });
  }

  revalidateCommunity(community?.slug);
  return {
    post: {
      ...post,
      author: authorFromProfile(profile),
      likeCount: 0,
      commentCount: 0,
      likedByCurrentUser: false,
      comments: [],
    } satisfies CommunityPostWithMeta,
  };
}

export async function togglePostLike(postId: string): Promise<ActionResult & { liked?: boolean }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: post } = await supabase
    .from("community_posts")
    .select("community_id, author_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const membershipError = await requireCommunityMembership(supabase, post.community_id, profile.id);
  if (membershipError) return membershipError;

  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("id", post.community_id)
    .single();

  const { data: existing } = await supabase
    .from("community_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("community_post_likes").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidateCommunity(community?.slug);
    return { liked: false };
  }

  const { error } = await supabase.from("community_post_likes").insert({
    post_id: postId,
    user_id: profile.id,
  });

  if (error) return { error: error.message };

  if (post.author_id !== profile.id) {
    await createNotification(supabase, {
      userId: post.author_id,
      title: "Post liked",
      body: `${profile.full_name ?? "Someone"} liked your post`,
      type: "community",
      metadata: { post_id: postId, community_id: post.community_id, slug: community?.slug },
    });
  }

  await logCommunityContribution(supabase, profile.id, post.community_id, "like", 2);

  revalidateCommunity(community?.slug);
  return { liked: true };
}

export async function createPostComment(
  postId: string,
  content: string
): Promise<ActionResult & { comment?: CommunityCommentWithAuthor }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment is required" };

  const { data: post } = await supabase
    .from("community_posts")
    .select("community_id, author_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const membershipError = await requireCommunityMembership(supabase, post.community_id, profile.id);
  if (membershipError) return membershipError;

  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("id", post.community_id)
    .single();

  const { data: comment, error } = await supabase
    .from("community_post_comments")
    .insert({
      post_id: postId,
      author_id: profile.id,
      content: trimmed,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  if (post.author_id !== profile.id) {
    await createNotification(supabase, {
      userId: post.author_id,
      title: "New comment",
      body: `${profile.full_name ?? "Someone"} commented on your post`,
      type: "community",
      metadata: { post_id: postId, community_id: post.community_id, slug: community?.slug },
    });
  }

  await logCommunityContribution(supabase, profile.id, post.community_id, "comment", 5);

  revalidateCommunity(community?.slug);
  return {
    comment: {
      ...comment,
      author: authorFromProfile(profile),
    } satisfies CommunityCommentWithAuthor,
  };
}

async function getCommunityManagerRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  communityId: string,
  userId: string
): Promise<"owner" | "admin" | null> {
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  if (data.role === "owner" || data.role === "admin") return data.role;
  return null;
}

export async function updateCommunityPost(
  postId: string,
  content: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const trimmed = content.trim();
  if (!trimmed) return { error: "Post content is required" };

  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id, community_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };
  if (post.author_id !== profile.id) return { error: "Not authorized" };

  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("id", post.community_id)
    .single();

  const { error } = await supabase
    .from("community_posts")
    .update({ content: trimmed })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidateCommunity(community?.slug);
  return {};
}

export async function deleteCommunityPost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id, community_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  const isAuthor = post.author_id === profile.id;
  const managerRole = await getCommunityManagerRole(supabase, post.community_id, profile.id);

  if (!isAuthor && !managerRole) return { error: "Not authorized" };

  const { data: community } = await supabase
    .from("communities")
    .select("slug")
    .eq("id", post.community_id)
    .single();

  const { error } = await supabase.from("community_posts").delete().eq("id", postId);

  if (error) return { error: error.message };

  revalidateCommunity(community?.slug);
  return {};
}

export async function addCommunityMember(
  communityId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const managerRole = await getCommunityManagerRole(supabase, communityId, profile.id);
  if (!managerRole) return { error: "Only community managers can add members" };

  const { data: community } = await supabase
    .from("communities")
    .select("slug, name")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: userId,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  await createNotification(supabase, {
    userId,
    title: "Added to community",
    body: `${profile.full_name ?? "Someone"} added you to ${community.name}`,
    type: "community",
    metadata: { community_id: communityId, slug: community.slug },
  });

  revalidateCommunity(community.slug);
  return {};
}

export async function removeCommunityMember(
  communityId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: community } = await supabase
    .from("communities")
    .select("slug, owner_id")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };

  const isSelf = userId === profile.id;
  const managerRole = await getCommunityManagerRole(supabase, communityId, profile.id);

  if (!isSelf && !managerRole) return { error: "Not authorized" };
  if (userId === community.owner_id) return { error: "Cannot remove the community owner" };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidateCommunity(community.slug);
  return {};
}
