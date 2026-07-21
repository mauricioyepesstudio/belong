import type { ActionResult } from "@/lib/actions/types";

export type PostAuthor = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type PostCommentWithAuthor = {
  id: string;
  content: string;
  created_at: string;
  author: PostAuthor;
};

export type PostWithMeta = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  comments: PostCommentWithAuthor[];
  image_url?: string | null;
};

export type PostCardActions = {
  toggleLike: (postId: string) => Promise<ActionResult>;
  createComment: (
    postId: string,
    body: string
  ) => Promise<ActionResult & { comment?: PostCommentWithAuthor }>;
  updatePost: (postId: string, content: string) => Promise<ActionResult>;
  deletePost: (postId: string) => Promise<ActionResult>;
};

export type PostCardLabels = {
  joinToLike: string;
  joinToComment: string;
};
