"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, ThumbsUp, Video } from "lucide-react";
import { Avatar } from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { getHomeSocialPreview } from "@/lib/actions/social";
import type { SocialPost } from "@/engines/social";
import { GlassCard, SectionHeader } from "../dashboard/primitives";

const PREVIEW_LIMIT = 3;

/**
 * Compact preview of a few real posts from the global social feed (see
 * getHomeSocialPreview — a thin Server Action wrapper around the same
 * fetchGlobalSocialFeed pipeline behind /feed). Intentionally minimal: no
 * composer, no comment threads, no pagination — just enough to invite a
 * visit to the full feed. Distinct from HomeLiveBuilders, which surfaces a
 * broader mix of platform activity (projects, events, community pulses),
 * not specifically authored social posts.
 */
export function HomeSocialPreview() {
  const [posts, setPosts] = useState<SocialPost[] | null>(null);

  useEffect(() => {
    let active = true;
    getHomeSocialPreview(PREVIEW_LIMIT)
      .then((result) => {
        if (active) setPosts(result);
      })
      .catch(() => {
        if (active) setPosts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (posts !== null && posts.length === 0) return null;

  return (
    <section aria-label="Recent posts from the BELONG feed">
      <div className="hidden sm:block">
        <SectionHeader
          label="Social feed"
          title="Real posts from the BELONG community."
          icon={MessageCircle}
          action={
            <Link href="/feed" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View Feed <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        />
      </div>
      <div className="mb-3 flex items-end justify-between gap-3 sm:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-primary">Social feed</p>
          <p className="mt-1 text-[11px] leading-4 text-fg-muted">Recent posts from the community.</p>
        </div>
        <Link href="/feed" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
          View feed <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {posts === null ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <GlassCard key={i} className="h-[152px] animate-pulse">
              <span className="sr-only">Loading recent posts…</span>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {posts.map((post) => {
            const contextLabel = post.context.communityName ?? post.context.projectName ?? null;
            return (
              <GlassCard key={post.id} hover className="flex flex-col overflow-hidden p-3">
                <Link href="/feed" className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={post.author.avatarUrl ?? undefined}
                      fallback={formatInitials(post.author.fullName)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-fg-primary">{post.author.fullName}</p>
                      <p className="text-[10px] text-fg-muted">{formatDistanceToNow(post.createdAt)}</p>
                    </div>
                  </div>

                  {contextLabel && (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-fg-secondary">
                      {contextLabel}
                    </span>
                  )}

                  {post.body && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-fg-secondary">{post.body}</p>
                  )}

                  {post.mediaUrl && post.mediaType === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.mediaUrl} alt="" className="mt-2 h-24 w-full rounded-xl object-cover" loading="lazy" />
                  )}
                  {post.mediaUrl && post.mediaType === "video" && (
                    <div className="mt-2 flex h-24 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] text-fg-muted">
                      <Video className="h-3.5 w-3.5" aria-hidden />
                      Video
                    </div>
                  )}
                </Link>

                <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-fg-muted">
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" aria-hidden />
                    {post.supportCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" aria-hidden />
                    {post.commentCount}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </section>
  );
}
