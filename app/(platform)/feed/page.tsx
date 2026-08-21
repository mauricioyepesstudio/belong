import { SocialFeed } from "@/components/features/social/social-feed";
import { fetchSocialFeedPage } from "@/lib/actions/social";
import { getGlobalSocialFeed, getSocialPostById } from "@/engines/social";
import { FeatureScreen } from "@/systems/design-system";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Social feed" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; post?: string }>;
}) {
  const { cursor, post } = await searchParams;
  const data = await getGlobalSocialFeed({ cursor: cursor ?? null, limit: 15 });

  let posts = data.page.posts;
  if (post && !posts.some((item) => item.id === post)) {
    const pinned = await getSocialPostById(post);
    if (pinned) posts = [pinned, ...posts];
  }

  return (
    <FeatureScreen
      label="Your world"
      title="BELONG feed"
      description="Ideas, asks, progress, and impact from people building with purpose."
    >
      <SocialFeed
        page={{ ...data.page, posts }}
        viewer={data.viewer}
        contexts={data.publishingContexts}
        highlightPostId={post ?? null}
        fetchNextPage={fetchSocialFeedPage}
      />
    </FeatureScreen>
  );
}
