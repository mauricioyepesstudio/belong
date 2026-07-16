"use client";

import { Logo } from "@/components/ui";
import { Bell, Search } from "lucide-react";
import Link from "next/link";

export function PlatformHeader({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-border-subtle bg-bg-base/80 px-4 backdrop-blur-2xl lg:hidden">
      <Logo href="/" size="sm" />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-primary focus-ring"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>
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
      </div>
    </header>
  );
}
