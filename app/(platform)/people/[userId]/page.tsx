import { SocialProfileView } from "@/components/features/social/social-profile-view";
import { getSocialProfilePage } from "@/engines/social";
import { notFound } from "next/navigation";

const validTabs = new Set(["posts", "about", "projects", "communities", "impact"]);
const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; cursor?: string }>;
}) {
  const [{ userId }, { tab, cursor }] = await Promise.all([params, searchParams]);
  if (!userIdPattern.test(userId)) notFound();
  const page = await getSocialProfilePage({ userId, cursor: cursor ?? null, limit: 12 });
  if (!page) notFound();

  return (
    <SocialProfileView
      page={page}
      initialTab={tab && validTabs.has(tab) ? (tab as "posts" | "about" | "projects" | "communities" | "impact") : "posts"}
      profileHref={`/people/${userId}`}
    />
  );
}
