"use client";

import { Avatar, Logo } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { mainNav, isNavActive } from "@/systems/navigation";
import type { UserProfile } from "@/types/database.types";
import { Bell, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppTopNavProps = {
  profile: UserProfile | null;
  unreadNotifications?: number;
  unreadMessages?: number;
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Home";
  const match = mainNav.find((item) => isNavActive(pathname, item.href) && item.href !== "/dashboard");
  if (match) return match.label;
  if (pathname.startsWith("/creator")) return "Creator";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/pricing")) return "Pricing";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/search")) return "Search";
  return "BELONG";
}

export function AppTopNav({
  profile,
  unreadNotifications = 0,
  unreadMessages = 0,
}: AppTopNavProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/80 backdrop-blur-2xl">
      <div className="flex h-[var(--header-height)] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/dashboard" size="sm" className="lg:hidden" />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold text-fg-primary">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-primary focus-ring"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <Link
            href="/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-primary focus-ring"
            aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
          >
            <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
            {unreadMessages > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" aria-hidden />
            )}
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-primary focus-ring"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" aria-hidden />
            )}
          </Link>
          <Link
            href="/profile"
            className="ml-1 flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-bg-hover"
            aria-label="Your profile"
          >
            <Avatar
              fallback={formatInitials(profile?.full_name)}
              size="sm"
              className="rounded-lg"
              src={profile?.avatar_url ?? undefined}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
