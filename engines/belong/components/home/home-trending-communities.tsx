"use client";

import type { DiscoverCommunity } from "@/engines/core/types";
import { Badge } from "@/systems/design-system";
import Link from "next/link";
import { GlassCard } from "../dashboard/primitives";
import { SectionHeading } from "./home-continue";

export function HomeTrendingCommunities({
  communities,
  joinedCount,
}: {
  communities: DiscoverCommunity[];
  joinedCount: number;
}) {
  const trending = [...communities]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 4);

  if (trending.length === 0) {
    return (
      <section aria-labelledby="home-trending-heading">
        <SectionHeading
          id="home-trending-heading"
          label="Discover"
          title="Trending communities"
        />
        <GlassCard className="px-5 py-6 text-center">
          <p className="text-sm font-medium text-fg-primary">
            {joinedCount > 0
              ? "You’re connected to every available community."
              : "Communities are taking shape."}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {joinedCount > 0
              ? "Keep contributing, or start a new space around a shared purpose."
              : "Explore again soon to meet builders working on what matters to you."}
          </p>
          <Link href="/community" className="mt-3 inline-flex text-sm font-medium text-brand hover:underline">
            {joinedCount > 0 ? "Open your communities" : "Browse communities"}
          </Link>
        </GlassCard>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-trending-heading">
      <SectionHeading
        id="home-trending-heading"
        label="Discover"
        title="Trending communities"
      />
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
        {trending.map((community) => (
          <Link
            key={community.id}
            href={`/community/${community.slug}`}
            className="min-w-[72%] shrink-0 snap-start sm:min-w-[240px]"
          >
            <GlassCard className="h-full p-4 transition-colors hover:border-brand/30">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-fg-primary line-clamp-2">{community.name}</p>
                {community.tag && (
                  <Badge variant="outline" className="shrink-0 text-micro">
                    {community.tag}
                  </Badge>
                )}
              </div>
              {community.description && (
                <p className="mt-2 text-caption text-fg-muted line-clamp-2">
                  {community.description}
                </p>
              )}
              <p className="mt-3 text-micro text-fg-faint">{community.memberCount} members</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
