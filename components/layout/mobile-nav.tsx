"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav, isNavActive, withNotificationBadge } from "@/systems/navigation";

function isActive(pathname: string, href: string) {
  return isNavActive(pathname, href);
}

export function MobileNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  unreadNotifications?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();

  let nav = withNotificationBadge(mobileNav, "/notifications", unreadNotifications);
  nav = withNotificationBadge(nav, "/messages", unreadMessages);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-bg-elevated/90 backdrop-blur-2xl lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-[var(--mobile-nav-height)] items-stretch justify-around px-1">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-brand" : "text-fg-faint"
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" aria-hidden />
              )}
              <div className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {item.badge && (
                  <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
