"use client";

import type { SocialPost } from "@/engines/social";
import {
  createSocialPostComment,
  deleteSocialPost,
  deleteSocialPostComment,
  toggleSocialPostSupport,
} from "@/lib/actions/social";
import { startConversation } from "@/lib/actions/connections";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar, Button, Input, useToast } from "@/systems/design-system";
import {
  ExternalLink,
  HeartHandshake,
  Link2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./social-feed.module.css";

export function SocialPostCard({
  post,
  currentUserId,
}: {
  post: SocialPost;
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [local, setLocal] = useState(post);
  const [comments, setComments] = useState(post.comments);
  const [comment, setComment] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(post.comments.length > 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isAuthor = local.author.id === currentUserId;

  const support = () => {
    const previous = local;
    setLocal((value) => ({
      ...value,
      supportedByViewer: !value.supportedByViewer,
      supportCount: value.supportCount + (value.supportedByViewer ? -1 : 1),
    }));

    startTransition(async () => {
      const result = await toggleSocialPostSupport(local.id);
      if (result.error) {
        setLocal(previous);
        toast(result.error, "error");
      }
    });
  };

  const submitComment = () => {
    const body = comment.trim();
    if (!body) return;

    startTransition(async () => {
      const result = await createSocialPostComment(local.id, body);
      if (result.error || !result.comment) {
        toast(result.error ?? "Could not add comment", "error");
        return;
      }

      setComments((value) => [...value, result.comment!]);
      setLocal((value) => ({ ...value, commentCount: value.commentCount + 1 }));
      setComment("");
      setCommentsOpen(true);
    });
  };

  const removeComment = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteSocialPostComment(commentId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }

      setComments((value) => value.filter((item) => item.id !== commentId));
      setLocal((value) => ({
        ...value,
        commentCount: Math.max(0, value.commentCount - 1),
      }));
    });
  };

  const share = async () => {
    const url = `${window.location.origin}/feed?post=${local.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Post link copied", "success");
    } catch {
      toast("Could not copy the post link", "error");
    }
  };

  const messageAuthor = () => {
    startTransition(async () => {
      const result = await startConversation(local.author.id);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      router.push(`/messages?conversation=${result.id}`);
    });
  };

  const removePost = () => {
    if (!window.confirm("Delete this post?")) return;
    startTransition(async () => {
      const result = await deleteSocialPost(local.id);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Post deleted", "success");
      router.refresh();
    });
  };

  return (
    <article id={`post-${local.id}`} className={styles.post}>
      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <Link
            href={`/people/${local.author.id}`}
            className="shrink-0 rounded-full focus-ring"
            aria-label={`View ${local.author.fullName}'s profile`}
          >
            <Avatar
              src={local.author.avatarUrl ?? undefined}
              fallback={formatInitials(local.author.fullName)}
              size="md"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/people/${local.author.id}`}
                  className="block truncate font-semibold text-fg-primary transition-colors hover:text-brand focus-ring"
                >
                  {local.author.fullName || "BELONG builder"}
                </Link>
                <p className="truncate text-xs text-fg-muted">
                  {local.author.role || "Building with purpose"} ·{" "}
                  {formatDistanceToNow(local.createdAt)}
                </p>
              </div>

              {isAuthor && (
                <div className="relative">
                  <button
                    type="button"
                    className="rounded-xl p-2 text-fg-muted transition-colors hover:bg-white/5 hover:text-fg-primary focus-ring"
                    aria-label="Post options"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden />
                  </button>
                  {menuOpen && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setMenuOpen(false);
                        removePost();
                      }}
                      className="absolute right-0 top-10 z-10 flex min-h-10 min-w-32 items-center gap-2 rounded-xl border border-white/10 bg-bg-elevated px-3 py-2 text-sm text-error shadow-xl transition-colors hover:bg-bg-hover focus-ring"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            {(local.context.communityId || local.context.projectId) && (
              <Link
                href={
                  local.context.communityId
                    ? `/community/${local.context.communitySlug}`
                    : `/projects/${local.context.projectId}`
                }
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-[11px] font-medium text-brand transition-colors hover:bg-brand/15 focus-ring"
              >
                {local.context.communityName ?? local.context.projectName}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            )}
          </div>
        </header>

        {local.body && (
          <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-6 text-fg-secondary">
            {local.body}
          </p>
        )}
      </div>

      {local.mediaUrl && local.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={local.mediaUrl}
          alt=""
          className={styles.media}
          loading="lazy"
        />
      )}

      {local.mediaUrl && local.mediaType === "video" && (
        <video
          src={local.mediaUrl}
          className={styles.media}
          controls
          preload="metadata"
        />
      )}

      <div className="p-3 sm:p-4">
        <div className={styles.actionRow}>
          <Button
            type="button"
            variant={local.supportedByViewer ? "brand" : "ghost"}
            size="sm"
            disabled={pending}
            aria-pressed={local.supportedByViewer}
            onClick={support}
            className={cn(
              local.supportedByViewer &&
                "shadow-[0_0_18px_rgba(139,92,246,.2)]"
            )}
          >
            <HeartHandshake className="h-4 w-4" aria-hidden />
            {local.supportCount > 0 ? local.supportCount : "Support"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen((value) => !value)}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {local.commentCount > 0 ? local.commentCount : "Comment"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={share}>
            <Link2 className="h-4 w-4" aria-hidden />
            Share
          </Button>
        </div>

        {!isAuthor && local.author.connectionState.state === "connected" && (
          <button
            type="button"
            disabled={pending}
            onClick={messageAuthor}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-fg-muted transition-colors hover:bg-white/5 hover:text-fg-primary focus-ring disabled:opacity-60"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Message author
          </button>
        )}

        {commentsOpen && (
          <div className="mt-3 space-y-3 border-t border-white/8 pt-3">
            {comments.length === 0 ? (
              <p className="py-1 text-xs text-fg-muted">
                No comments yet. Start a constructive conversation.
              </p>
            ) : (
              <ul className="space-y-3">
                {comments.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <Link
                      href={`/people/${item.author.id}`}
                      className="h-8 shrink-0 rounded-full focus-ring"
                      aria-label={`View ${item.author.fullName}'s profile`}
                    >
                      <Avatar
                        src={item.author.avatarUrl ?? undefined}
                        fallback={formatInitials(item.author.fullName)}
                        size="sm"
                        className="h-8 w-8"
                      />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-xl bg-white/[0.035] px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <Link
                              href={`/people/${item.author.id}`}
                              className="truncate text-xs font-semibold text-fg-primary hover:text-brand"
                            >
                              {item.author.fullName || "Builder"}
                            </Link>
                            <span className="text-[10px] text-fg-faint">
                              {formatDistanceToNow(item.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 break-words text-sm text-fg-secondary">
                            {item.content}
                          </p>
                        </div>
                        {item.author.id === currentUserId && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => removeComment(item.id)}
                            className="shrink-0 rounded-lg p-1.5 text-fg-faint transition-colors hover:bg-error/10 hover:text-error focus-ring"
                            aria-label="Delete your comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex min-w-0 gap-2">
              <Input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitComment();
                  }
                }}
                placeholder="Add a thoughtful comment..."
                aria-label="Comment"
                disabled={pending}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                size="sm"
                disabled={pending || !comment.trim()}
                onClick={submitComment}
                className="shrink-0"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
