import { NotificationsView } from "@/components/features/notifications/notifications-view";
import { getNotifications } from "@/lib/data/notifications";
import { requireProfile } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const notifications = await getNotifications();
  return <NotificationsView notifications={notifications} userId={profile.id} />;
}
