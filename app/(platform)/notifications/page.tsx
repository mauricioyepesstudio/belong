import { NotificationsView } from "@/engines/notifications/components/notifications-view";
import { getNotifications } from "@/engines/notifications/data";
import { requireProfile } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const notifications = await getNotifications();
  return <NotificationsView notifications={notifications} userId={profile.id} />;
}
