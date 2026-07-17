"use client";

import {
  createPostComment,
  togglePostLike,
} from "@/lib/actions/communities";
import type { CommunityPostWithMeta } from "@/lib/core";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  useToast,
} from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";

type CommunityPostCardProps = {
  post: CommunityPostWithMeta;
  isMember: boolean;
  onUpdate?: () => void;
};

export function CommunityPostCard({ post, isMember, onUpdate }: CommunityPostCardProps) {
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [commentBody, setCommentBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    if (!isMember) {
      toast("Join the community to like posts", "error");
      return;
    }
    startTransition(async () => {
      const result = await togglePostLike(post.id);
      if (result.error) toast(result.error, "error");
      else onUpdate?.();
    });
  };

  const handleComment = () => {
    if (!commentBody.trim()) return;
    if (!isMember) {
      toast("Join the community to comment", "error");
      return;
    }
    startTransition(async () => {
      const result = await createPostComment(post.id, commentBody.trim());
      if (result.error) toast(result.error, "error");
      else {
        setCommentBody("");
        setShowComments(true);
        onUpdate?.();
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={post.author.avatarUrl ?? undefined}
            fallback={formatInitials(post.author.fullName)}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-fg-primary">
                {post.author.fullName ?? "Builder"}
              </span>
              <span className="text-caption text-fg-muted">
                {formatDistanceToNow(post.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-fg-secondary">
              {post.content}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={post.likedByCurrentUser ? "brand" : "ghost"}
                disabled={isPending}
                onClick={handleLike}
                className="gap-1.5"
              >
                <Heart
                  className={cn("h-4 w-4", post.likedByCurrentUser && "fill-current")}
                  aria-hidden
                />
                {post.likeCount > 0 ? post.likeCount : "Like"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments((v) => !v)}
                className="gap-1.5"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {post.commentCount > 0 ? post.commentCount : "Comment"}
              </Button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
                {post.comments.length === 0 ? (
                  <p className="text-caption text-fg-muted">No comments yet. Start the conversation.</p>
                ) : (
                  <ul className="space-y-3">
                    {post.comments.map((comment) => (
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
                  <div className="flex gap-2 pt-1">
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
                    />
                    <Button
                      size="sm"
                      disabled={isPending || !commentBody.trim()}
                      onClick={handleComment}
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
