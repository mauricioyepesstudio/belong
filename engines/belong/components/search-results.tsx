"use client";

import type { SearchResult } from "@/lib/core/search";
import { Badge, EmptyState } from "@/systems/design-system";
import {
  FolderKanban,
  MessageSquare,
  Search,
  Target,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/engines/belong/components/dashboard/primitives";

const typeConfig: Record<
  SearchResult["type"],
  { icon: LucideIcon; label: string }
> = {
  person: { icon: User, label: "People" },
  community: { icon: Users, label: "Communities" },
  project: { icon: FolderKanban, label: "Projects" },
  post: { icon: MessageSquare, label: "Posts" },
  mission: { icon: Target, label: "Missions" },
};

export function SearchResultsView({
  query,
  results,
}: {
  query: string;
  results: SearchResult[];
}) {
  if (query.length < 2) {
    return (
      <GlassCard className="p-8">
        <EmptyState
          icon={Search}
          title="Search BELONG"
          description="Find people, communities, projects, posts, and missions across every module."
          className="border-0 bg-transparent py-8"
        />
      </GlassCard>
    );
  }

  if (results.length === 0) {
    return (
      <GlassCard className="p-8">
        <EmptyState
          icon={Search}
          title={`No results for "${query}"`}
          description="Try a different name, community, or keyword."
          className="border-0 bg-transparent py-8"
        />
      </GlassCard>
    );
  }

  const grouped = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResult["type"], SearchResult[]>
  );

  return (
    <div className="space-y-8">
      {(Object.keys(typeConfig) as SearchResult["type"][]).map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;
        const config = typeConfig[type];
        const Icon = config.icon;
        return (
          <section key={type}>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg-primary">
              <Icon className="h-4 w-4 text-fg-muted" aria-hidden />
              {config.label}
              <Badge variant="outline" className="text-micro">
                {items.length}
              </Badge>
            </h2>
            <GlassCard className="divide-y divide-white/[0.06]">
              {items.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  className="block p-5 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-white/[0.02]"
                >
                  <p className="text-sm font-medium text-fg-primary">{result.title}</p>
                  {result.subtitle && (
                    <p className="mt-0.5 text-caption capitalize">{result.subtitle}</p>
                  )}
                </Link>
              ))}
            </GlassCard>
          </section>
        );
      })}
    </div>
  );
}
