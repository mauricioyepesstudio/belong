import { PlatformShell } from "@/systems/layout";
import { getCurrentProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, unreadNotifications] = await Promise.all([
    getCurrentProfile(),
    getUnreadNotificationCount().catch(() => 0),
  ]);

  return (
    <PlatformShell profile={profile} unreadNotifications={unreadNotifications}>
      {children}
    </PlatformShell>
  );
}
