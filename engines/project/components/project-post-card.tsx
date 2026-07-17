"use client";

import {
  createProjectPostComment,
  toggleProjectPostLike,
} from "@/lib/actions/projects";
import type { ProjectPostWithMeta } from "@/lib/core";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Input,
  useToast,
} from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type ProjectPostCardProps = {
  post: ProjectPostWithMeta;
  isMember: boolean;
  onPostUpdate?: (post: ProjectPostWithMeta) => void;
};

export function ProjectPostCard({ post, isMember, onPostUpdate }: ProjectPostCardProps) {
  const { toast } = useToast();
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [commentBody, setCommentBody] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const updatePost = (next: ProjectPostWithMeta) => {
    setLocalPost(next);
    onPostUpdate?.(next);
  };

  const handleLike = () => {
    if (!isMember) {
      toast("Join the project to like posts", "error");
      return;
    }

    const optimistic: ProjectPostWithMeta = {
      ...localPost,
      likedByCurrentUser: !localPost.likedByCurrentUser,
      likeCount: localPost.likeCount + (localPost.likedByCurrentUser ? -1 : 1),
    };
    updatePost(optimistic);

    startTransition(async () => {
      const result = await toggleProjectPostLike(localPost.id);
      if (result.error) {
        toast(result.error, "error");
        updatePost(post);
      }
    });
  };

  const handleComment = () => {
    if (!commentBody.trim()) return;
    if (!isMember) {
      toast("Join the project to comment", "error");
      return;
    }

    const trimmed = commentBody.trim();
    setCommentBody("");

    startTransition(async () => {
      const result = await createProjectPostComment(localPost.id, trimmed);
      if (result.error) {
        toast(result.error, "error");
        setCommentBody(trimmed);
        return;
      }

      if (result.comment) {
        const next: ProjectPostWithMeta = {
          ...localPost,
          commentCount: localPost.commentCount + 1,
          comments: [...localPost.comments, result.comment],
        };
        updatePost(next);
        setShowComments(true);
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={localPost.author.avatarUrl ?? undefined}
            fallback={formatInitials(localPost.author.fullName)}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-fg-primary">
                {localPost.author.fullName ?? "Builder"}
              </span>
              <span className="text-caption text-fg-muted">
                {formatDistanceToNow(localPost.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-fg-secondary">
              {localPost.content}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={localPost.likedByCurrentUser ? "brand" : "ghost"}
                disabled={isPending}
                onClick={handleLike}
                className="gap-1.5"
              >
                <Heart
                  className={cn("h-4 w-4", localPost.likedByCurrentUser && "fill-current")}
                  aria-hidden
                />
                {localPost.likeCount > 0 ? localPost.likeCount : "Like"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments((v) => !v)}
                className="gap-1.5"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {localPost.commentCount > 0 ? localPost.commentCount : "Comment"}
              </Button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
                {localPost.comments.length === 0 ? (
                  <p className="text-caption text-fg-muted">No comments yet. Start the conversation.</p>
                ) : (
                  <ul className="space-y-3">
                    {localPost.comments.map((comment) => (
                      <li key={comment.id} className="flex gap-2">
                        <Avatar
                          src={comment.author.avatarUrl ?? undefined}
                          fallback={formatInitials(comment.author.fullName)}
                          size="sm"
                          className="h-8 w-8"
                        />
                        <div className="min-w-0 flex-1 rounded-xl bg-bg-hover px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-fg-primary">
                              {comment.author.fullName ?? "Builder"}
                            </span>
                            <span className="text-micro text-fg-muted">
                              {formatDistanceToNow(comment.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-fg-secondary">{comment.content}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {isMember && (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <Input
                      placeholder="Write a comment..."
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                      disabled={isPending}
                      aria-label="Comment"
                      className="min-w-0 flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={isPending || !commentBody.trim()}
                      onClick={handleComment}
                      className="shrink-0"
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
