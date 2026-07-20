"use client";

import { Avatar, Logo, Separator } from "@/components/ui";
import { mainNav, secondaryNav, isNavActive, withNotificationBadge } from "@/systems/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/database.types";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

function isActive(pathname: string, href: string) {
  return isNavActive(pathname, href);
}

type SidebarProps = {
  profile: UserProfile | null;
  unreadNotifications?: number;
  unreadMessages?: number;
};

export function Sidebar({ profile, unreadNotifications = 0, unreadMessages = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  let navWithBadges = withNotificationBadge(mainNav, "/notifications", unreadNotifications);
  navWithBadges = withNotificationBadge(navWithBadges, "/messages", unreadMessages);

  return (
    <aside
      className="hidden lg:flex lg:w-[var(--sidebar-width)] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 border-r border-border-subtle bg-bg-elevated/80 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="flex h-[var(--header-height)] items-center px-6">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Platform">
        <p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wider">Platform</p>
        {navWithBadges.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
              <span className="relative flex items-center">
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-bg-active border border-border-subtle"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active ? "text-fg-primary" : "text-fg-muted hover:text-fg-secondary"
                  )}
                >
                  <Icon className={cn("h-[17px] w-[17px]", active ? "text-brand" : "text-fg-faint")} aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-brand-subtle px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                      {item.badge}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          );
        })}

        <Separator className="my-4" />
        <p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wider">Account</p>
        {secondaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
              <span
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active ? "bg-bg-active text-fg-primary" : "text-fg-muted hover:bg-bg-hover hover:text-fg-secondary"
                )}
              >
                <Icon className={cn("h-[17px] w-[17px]", active ? "text-brand" : "text-fg-faint")} aria-hidden />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3 space-y-1">
        <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-bg-hover">
          <Avatar fallback={initials} size="sm" className="rounded-lg" src={profile?.avatar_url ?? undefined} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-fg-primary">{profile?.full_name ?? "Your profile"}</p>
            <p className="truncate text-[11px] text-fg-faint">{profile?.role ?? profile?.email}</p>
          </div>
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => signOut())}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg-secondary"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  );
}
