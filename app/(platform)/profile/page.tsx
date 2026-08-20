import { SocialProfileView } from "@/components/features/social/social-profile-view";
import { getOwnSocialProfilePage } from "@/engines/social";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string; cursor?: string }>;
};

const VALID_TABS = new Set(["posts", "about", "projects", "communities", "impact"]);

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { tab, cursor } = await searchParams;
  const page = await getOwnSocialProfilePage({ cursor: cursor ?? null, limit: 12 });
  const initialTab =
    tab && VALID_TABS.has(tab)
      ? (tab as "posts" | "about" | "projects" | "communities" | "impact")
      : "posts";

  return (
    <SocialProfileView
      page={page}
      initialTab={initialTab}
      profileHref="/profile"
    />
  );
}
