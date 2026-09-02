"use client";

import type { SocialFeedPage, SocialPost, SocialPublishingContext } from "@/engines/social";
import { Button } from "@/systems/design-system";
import { Compass, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SocialComposer } from "./social-composer";
import { SocialPostCard } from "./social-post-card";
import styles from "./social-feed.module.css";

type FetchNextPageResult = { error?: string; page?: SocialFeedPage };

export function SocialFeed({
  page,
  viewer,
  contexts,
  showComposer = true,
  emptyTitle = "Your world is just getting started.",
  loadMoreHref = "/feed",
  highlightPostId = null,
  fetchNextPage,
}: {
  page: SocialFeedPage;
  viewer: { id: string; fullName: string | null; avatarUrl: string | null };
  contexts: SocialPublishingContext[];
  showComposer?: boolean;
  emptyTitle?: string;
  loadMoreHref?: string;
  /** Deep-linked post id (?post=<id>) to scroll to and briefly highlight on mount. */
  highlightPostId?: string | null;
  /**
   * Optional client-side page fetcher for append-style pagination with
   * auto-load. When omitted, falls back to the original full-navigation
   * "Load more" link (used by callers like the profile posts tab that
   * paginate a different feed than the global one).
   */
  fetchNextPage?: (cursor: string) => Promise<FetchNextPageResult>;
}) {
  const [prevPage, setPrevPage] = useState(page);
  const [posts, setPosts] = useState<SocialPost[]>(page.posts);
  const [nextCursor, setNextCursor] = useState(page.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scrolledForId, setScrolledForId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Re-sync local pagination state when the server hands us a fresh first
  // page (e.g. after router.refresh()). Adjusting state during render
  // (rather than in an effect) avoids an extra render pass.
  if (page !== prevPage) {
    setPrevPage(page);
    setPosts(page.posts);
    setNextCursor(page.nextCursor);
  }

  if (highlightPostId && highlightPostId !== scrolledForId) {
    setScrolledForId(highlightPostId);
    setHighlightId(highlightPostId);
  }

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`post-${highlightId}`);
    if (el) {
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
    const timer = setTimeout(() => setHighlightId(null), 2400);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const loadMore = useCallback(() => {
    if (!fetchNextPage || !nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setLoadError(null);
    fetchNextPage(nextCursor)
      .then((result) => {
        const nextPage = result.page;
        if (result.error || !nextPage) {
          setLoadError(result.error ?? "Could not load more posts.");
          return;
        }
        setPosts((value) => {
          const seen = new Set(value.map((item) => item.id));
          const fresh = nextPage.posts.filter((item) => !seen.has(item.id));
          return [...value, ...fresh];
        });
        setNextCursor(nextPage.nextCursor);
      })
      .catch(() => setLoadError("Could not load more posts."))
      .finally(() => {
        loadingRef.current = false;
        setLoadingMore(false);
      });
  }, [fetchNextPage, nextCursor]);

  useEffect(() => {
    if (!fetchNextPage || !nextCursor) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, nextCursor, loadMore]);

  return (
    <div className={`${styles.shell} mx-auto w-full max-w-3xl space-y-4`}>
      {showComposer && <SocialComposer viewer={viewer} contexts={contexts} />}

      {posts.length === 0 ? (
        <div className="rounded-[22px] border border-white/8 bg-white/[0.025] px-5 py-12 text-center">
          <p className="text-lg font-semibold text-fg-primary">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Connect with purposeful people and join communities to shape what appears here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/people/discover">
              <Button variant="brand">
                <Users className="h-4 w-4" aria-hidden />
                Discover people
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="secondary">
                <Compass className="h-4 w-4" aria-hidden />
                Join a community
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            currentUserId={viewer.id}
            highlighted={post.id === highlightId}
          />
        ))
      )}

      {loadingMore && (
        <div className={styles.loadingRow} aria-hidden>
          <div className={styles.loadingPulse} />
        </div>
      )}

      {nextCursor && fetchNextPage && (
        <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
      )}

      {nextCursor && (
        <div className="flex flex-col items-center gap-2 pt-2">
          {loadError && (
            <div className="flex items-center gap-2 text-xs text-error">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadMore}
                className="underline underline-offset-2 focus-ring"
              >
                Retry
              </button>
            </div>
          )}
          {fetchNextPage ? (
            <Button
              type="button"
              variant="secondary"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          ) : (
            <Link
              href={`${loadMoreHref}${loadMoreHref.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}`}
            >
              <Button variant="secondary">Load more</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
