"use client";

import type { PostCardActions, PostCardLabels, PostWithMeta } from "./post-card-types";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { memo, useEffect, useRef, useState, useTransition } from "react";

type PostCardProps = {
  post: PostWithMeta;
  isMember: boolean;
  currentUserId: string;
  canModerate?: boolean;
  actions: PostCardActions;
  labels: PostCardLabels;
  onPostUpdate?: (post: PostWithMeta) => void;
  onPostDelete?: (postId: string) => void;
};

function PostCardComponent({
  post,
  isMember,
  currentUserId,
  canModerate = false,
  actions,
  labels,
  onPostUpdate,
  onPostDelete,
}: PostCardProps) {
  const { toast } = useToast();
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [commentBody, setCommentBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = localPost.author_id === currentUserId;
  const canManage = isAuthor || canModerate;
  const imageUrl = localPost.image_url;

  useEffect(() => {
    setLocalPost(post);
    setEditBody(post.content);
  }, [post]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const updatePost = (next: PostWithMeta) => {
    setLocalPost(next);
    onPostUpdate?.(next);
  };

  const handleLike = () => {
    if (!isMember) {
      toast(labels.joinToLike, "error");
      return;
    }

    const optimistic: PostWithMeta = {
      ...localPost,
      likedByCurrentUser: !localPost.likedByCurrentUser,
      likeCount: localPost.likeCount + (localPost.likedByCurrentUser ? -1 : 1),
    };
    updatePost(optimistic);

    startTransition(async () => {
      const result = await actions.toggleLike(localPost.id);
      if (result.error) {
        toast(result.error, "error");
        updatePost(post);
      }
    });
  };

  const handleComment = () => {
    if (!commentBody.trim()) return;
    if (!isMember) {
      toast(labels.joinToComment, "error");
      return;
    }

    const trimmed = commentBody.trim();
    setCommentBody("");

    startTransition(async () => {
      const result = await actions.createComment(localPost.id, trimmed);
      if (result.error) {
        toast(result.error, "error");
        setCommentBody(trimmed);
        return;
      }

      if (result.comment) {
        const next: PostWithMeta = {
          ...localPost,
          commentCount: localPost.commentCount + 1,
          comments: [...localPost.comments, result.comment],
        };
        updatePost(next);
        setShowComments(true);
      }
    });
  };

  const handleSaveEdit = () => {
    const trimmed = editBody.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await actions.updatePost(localPost.id, trimmed);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      updatePost({ ...localPost, content: trimmed });
      setEditing(false);
      toast("Post updated", "success");
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this post?")) return;
    startTransition(async () => {
      const result = await actions.deletePost(localPost.id);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      onPostDelete?.(localPost.id);
      toast("Post deleted", "success");
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
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-fg-primary">
                  {localPost.author.fullName ?? "Builder"}
                </span>
                <span className="text-caption text-fg-muted">
                  {formatDistanceToNow(localPost.created_at)}
                </span>
              </div>
              {canManage && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-hover"
                    aria-label="Post options"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 z-10 mt-1 min-w-[8rem] rounded-xl border border-border-subtle bg-bg-elevated py-1 shadow-lg">
                      {isAuthor && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover"
                          onClick={() => {
                            setEditing(true);
                            setMenuOpen(false);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-bg-hover"
                        onClick={() => {
                          setMenuOpen(false);
                          handleDelete();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  aria-label="Edit post"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="brand" disabled={isPending} onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setEditBody(localPost.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-fg-secondary">
                  {localPost.content}
                </p>
                {imageUrl && (
                  <div className="relative mt-3 overflow-hidden rounded-2xl border border-border-subtle">
                    <Image
                      src={imageUrl}
                      alt="Post attachment"
                      width={800}
                      height={450}
                      className="h-auto max-h-96 w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </>
            )}

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

export const PostCard = memo(PostCardComponent);
