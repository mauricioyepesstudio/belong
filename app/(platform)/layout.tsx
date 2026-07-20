import { PlatformShell } from "@/systems/layout";
import { getCurrentProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";
import { fetchUserStats } from "@/lib/core/stats";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [unreadNotifications, stats] = await Promise.all([
    getUnreadNotificationCount().catch(() => 0),
    profile ? fetchUserStats(supabase, profile.id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <PlatformShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      unreadMessages={stats?.unreadMessages ?? 0}
    >
      {children}
    </PlatformShell>
  );
}
