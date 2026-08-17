"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppTopNav } from "@/systems/layout/top-nav";
import { PageTransition } from "@/components/layout/page-transition";
import type { UserProfile } from "@/types/database.types";
import { usePathname } from "next/navigation";

type PlatformShellProps = {
  children: React.ReactNode;
  profile: UserProfile | null;
  unreadNotifications?: number;
  unreadMessages?: number;
};

export function PlatformShell({
  children,
  profile,
  unreadNotifications = 0,
  unreadMessages = 0,
}: PlatformShellProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-bg-base">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar
        profile={profile}
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />
      <div className={isDashboard ? "" : "lg:pl-[var(--sidebar-width)]"}>
        <AppTopNav
          profile={profile}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
        <main
          id="main-content"
          className="min-h-[calc(100vh-var(--header-height))] pb-[calc(var(--mobile-nav-height)+1rem)] lg:pb-0"
        >
          <div
            className={
              isDashboard
                ? "mx-auto max-w-[1680px] px-3 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6"
                : "mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10"
            }
          >
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <MobileNav
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />
    </div>
  );
}
