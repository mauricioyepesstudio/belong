import { ProfileView } from "@/components/features/profile/profile-view";
import { getProfileData } from "@/lib/data/profile";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const data = await getProfileData();
  return (
    <ProfileView
      profile={data.profile}
      stats={data.stats}
      missions={data.missions}
      impact={data.impact}
    />
  );
}
