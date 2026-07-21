"use client";

import {
  createProjectPostComment,
  deleteProjectPost,
  toggleProjectPostLike,
  updateProjectPost,
} from "@/lib/actions/projects";
import { PostCard } from "@/components/shared/post-card";
import type { PostWithMeta } from "@/components/shared/post-card-types";
import type { ProjectPostWithMeta } from "@/lib/core";
import { memo } from "react";

const PROJECT_LABELS = {
  joinToLike: "Join the project to like posts",
  joinToComment: "Join the project to comment",
} as const;

const PROJECT_ACTIONS = {
  toggleLike: toggleProjectPostLike,
  createComment: createProjectPostComment,
  updatePost: updateProjectPost,
  deletePost: deleteProjectPost,
};

type ProjectPostCardProps = {
  post: ProjectPostWithMeta;
  isMember: boolean;
  currentUserId: string;
  canModerate?: boolean;
  onPostUpdate?: (post: ProjectPostWithMeta) => void;
  onPostDelete?: (postId: string) => void;
};

function ProjectPostCardComponent({
  post,
  isMember,
  currentUserId,
  canModerate = false,
  onPostUpdate,
  onPostDelete,
}: ProjectPostCardProps) {
  return (
    <PostCard
      post={post as PostWithMeta}
      isMember={isMember}
      currentUserId={currentUserId}
      canModerate={canModerate}
      actions={PROJECT_ACTIONS}
      labels={PROJECT_LABELS}
      onPostUpdate={onPostUpdate as ((post: PostWithMeta) => void) | undefined}
      onPostDelete={onPostDelete}
    />
  );
}

export const ProjectPostCard = memo(ProjectPostCardComponent);
