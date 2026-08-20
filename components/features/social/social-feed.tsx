import type { SocialFeedPage, SocialPublishingContext } from "@/engines/social";
import { Button } from "@/systems/design-system";
import { Compass, Users } from "lucide-react";
import Link from "next/link";
import { SocialComposer } from "./social-composer";
import { SocialPostCard } from "./social-post-card";
import styles from "./social-feed.module.css";

export function SocialFeed({
  page,
  viewer,
  contexts,
  showComposer = true,
  emptyTitle = "Your world is just getting started.",
  loadMoreHref = "/feed",
}: {
  page: SocialFeedPage;
  viewer: { id: string; fullName: string | null; avatarUrl: string | null };
  contexts: SocialPublishingContext[];
  showComposer?: boolean;
  emptyTitle?: string;
  loadMoreHref?: string;
}) {
  return (
    <div className={`${styles.shell} mx-auto w-full max-w-3xl space-y-4`}>
      {showComposer && <SocialComposer viewer={viewer} contexts={contexts} />}

      {page.posts.length === 0 ? (
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
        page.posts.map((post) => (
          <SocialPostCard key={post.id} post={post} currentUserId={viewer.id} />
        ))
      )}

      {page.nextCursor && (
        <div className="flex justify-center pt-2">
          <Link
            href={`${loadMoreHref}${loadMoreHref.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(page.nextCursor)}`}
          >
            <Button variant="secondary">Load more</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
