import { ProfileView } from "@/components/features/profile/profile-view";
import { getProfileData } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

type ProfilePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const VALID_TABS = new Set(["reputation", "about", "missions"]);

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { tab } = await searchParams;
  const data = await getProfileData();
  const initialTab = tab && VALID_TABS.has(tab) ? tab : "reputation";

  return (
    <ProfileView
      profile={data.profile}
      stats={data.stats}
      missions={data.missions}
      reputation={data.reputation}
      initialTab={initialTab}
    />
  );
}
