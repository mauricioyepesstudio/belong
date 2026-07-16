import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { PlatformHeader } from "./platform-header";
import { PageTransition } from "./page-transition";
import type { UserProfile } from "@/types/database.types";

type PlatformShellProps = {
  children: React.ReactNode;
  profile: UserProfile | null;
  unreadNotifications?: number;
};

export function PlatformShell({
  children,
  profile,
  unreadNotifications = 0,
}: PlatformShellProps) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar profile={profile} unreadNotifications={unreadNotifications} />
      <PlatformHeader unreadNotifications={unreadNotifications} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <main
          id="main-content"
          className="min-h-screen pb-[calc(var(--mobile-nav-height)+1rem)] lg:pb-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <MobileNav unreadNotifications={unreadNotifications} />
    </div>
  );
}
