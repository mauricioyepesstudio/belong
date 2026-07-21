"use client";

import {
  createPostComment,
  deleteCommunityPost,
  togglePostLike,
  updateCommunityPost,
} from "@/lib/actions/communities";
import { PostCard } from "@/components/shared/post-card";
import type { PostWithMeta } from "@/components/shared/post-card-types";
import type { CommunityPostWithMeta } from "@/lib/core";
import { memo, useMemo } from "react";

const COMMUNITY_LABELS = {
  joinToLike: "Join the community to like posts",
  joinToComment: "Join the community to comment",
} as const;

const COMMUNITY_ACTIONS = {
  toggleLike: togglePostLike,
  createComment: createPostComment,
  updatePost: updateCommunityPost,
  deletePost: deleteCommunityPost,
};

type CommunityPostCardProps = {
  post: CommunityPostWithMeta;
  isMember: boolean;
  currentUserId: string;
  canModerate?: boolean;
  onPostUpdate?: (post: CommunityPostWithMeta) => void;
  onPostDelete?: (postId: string) => void;
};

function CommunityPostCardComponent({
  post,
  isMember,
  currentUserId,
  canModerate = false,
  onPostUpdate,
  onPostDelete,
}: CommunityPostCardProps) {
  const normalizedPost = useMemo<PostWithMeta>(
    () => ({
      ...post,
      image_url: (post as CommunityPostWithMeta & { image_url?: string | null }).image_url,
    }),
    [post]
  );

  return (
    <PostCard
      post={normalizedPost}
      isMember={isMember}
      currentUserId={currentUserId}
      canModerate={canModerate}
      actions={COMMUNITY_ACTIONS}
      labels={COMMUNITY_LABELS}
      onPostUpdate={onPostUpdate as ((post: PostWithMeta) => void) | undefined}
      onPostDelete={onPostDelete}
    />
  );
}

export const CommunityPostCard = memo(CommunityPostCardComponent);
