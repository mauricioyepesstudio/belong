"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  mobileNav,
  homeMobileNav,
  mobileMoreNav,
  isNavActive,
  withNotificationBadge,
} from "@/systems/navigation";
import { useState } from "react";

function isActive(pathname: string, href: string) {
  return isNavActive(pathname, href.split("?")[0]);
}

export function MobileNav({
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  unreadNotifications?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const [moreOpen, setMoreOpen] = useState(false);

  const baseNav = isDashboard ? homeMobileNav : mobileNav;
  const nav = withNotificationBadge(baseNav, "/messages", unreadMessages);
  const moreItems = withNotificationBadge(mobileMoreNav, "/notifications", unreadNotifications);
  const moreActive = !isDashboard && mobileMoreNav.some((item) => isActive(pathname, item.href));

  return (
    <>
      {!isDashboard && moreOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {!isDashboard && moreOpen && (
        <div
          className="fixed inset-x-0 z-50 border-t border-border-subtle bg-bg-elevated p-4 lg:hidden"
          style={{ bottom: "calc(var(--mobile-nav-height) + var(--mobile-nav-safe-bottom))" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">More</p>
          <ul className="grid grid-cols-2 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                      active ? "bg-brand/10 text-brand" : "text-fg-secondary hover:bg-bg-hover"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-bg-elevated/90 backdrop-blur-2xl lg:hidden"
        style={{ paddingBottom: "var(--mobile-nav-safe-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="relative flex h-[var(--mobile-nav-height)] items-stretch justify-around px-1">
          {nav.map((item) => {
            const isMore = item.href === "#more";
            const Icon = item.icon;

            if (item.label === "Build") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Build"
                  className="relative flex flex-1 flex-col items-center justify-center"
                >
                  <span className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_0_28px_rgba(139,92,246,.55)] transition-transform active:scale-95">
                    <Icon className="h-6 w-6 text-white" aria-hidden strokeWidth={2.25} />
                  </span>
                  <span className="mt-8 text-[10px] font-semibold text-fg-primary">Build</span>
                </Link>
              );
            }

            if (isMore) {
              return (
                <button
                  key={item.href}
                  type="button"
                  aria-expanded={moreOpen}
                  aria-label="More navigation"
                  onClick={() => setMoreOpen((open) => !open)}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                    moreActive || moreOpen ? "text-brand" : "text-fg-faint"
                  )}
                >
                  {(moreActive || moreOpen) && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" aria-hidden />
                  )}
                  <Icon className="h-[22px] w-[22px]" strokeWidth={moreActive || moreOpen ? 2.25 : 1.75} aria-hidden />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            const active = isActive(pathname, item.href);

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
    </>
  );
}
