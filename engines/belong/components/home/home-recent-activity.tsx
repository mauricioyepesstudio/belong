"use client";

import type { UserActivityItem } from "@/engines/belong/global-feed";
import { formatDistanceToNow } from "@/lib/format";
import Link from "next/link";
import { GlassCard } from "../dashboard/primitives";
import { SectionHeading } from "./home-continue";

export function HomeRecentActivity({
  activities,
}: {
  activities: UserActivityItem[];
}) {
  const items = activities.slice(0, 5);

  return (
    <section aria-labelledby="home-activity-heading">
      <SectionHeading
        id="home-activity-heading"
        label="Activity"
        title="Recent activity"
      />

      {items.length === 0 ? (
        <GlassCard className="px-5 py-6 text-center">
          <p className="text-sm text-fg-muted">Your contributions and updates will appear here.</p>
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-white/[0.06]">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg-primary line-clamp-1">{item.title}</p>
                {item.subtitle && (
                  <p className="mt-0.5 text-caption text-fg-muted line-clamp-1">{item.subtitle}</p>
                )}
              </div>
              <span className="shrink-0 text-micro text-fg-faint">
                {formatDistanceToNow(item.createdAt)}
              </span>
            </Link>
          ))}
        </GlassCard>
      )}
    </section>
  );
}
