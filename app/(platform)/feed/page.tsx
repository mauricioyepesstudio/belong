import { SocialFeed } from "@/components/features/social/social-feed";
import { getGlobalSocialFeed } from "@/engines/social";
import { FeatureScreen } from "@/systems/design-system";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Social feed" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const data = await getGlobalSocialFeed({ cursor: cursor ?? null, limit: 15 });

  return (
    <FeatureScreen
      label="Your world"
      title="BELONG feed"
      description="Ideas, asks, progress, and impact from people building with purpose."
    >
      <SocialFeed page={data.page} viewer={data.viewer} contexts={data.publishingContexts} />
    </FeatureScreen>
  );
}
