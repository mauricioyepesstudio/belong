"use client";

import type { OpportunityRecommendations, ScoredRecommendation } from "@/engines/opportunity";
import { Avatar, Badge } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import {
  Building2,
  FolderKanban,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "../dashboard/primitives";

const SECTIONS: Array<{
  key: keyof OpportunityRecommendations;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  empty: string;
}> = [
  {
    key: "people",
    title: "People you should meet",
    icon: UserPlus,
    empty: "Add skills and interests in Settings to discover compatible builders.",
  },
  {
    key: "projects",
    title: "Projects you could join",
    icon: FolderKanban,
    empty: "Join a community first — then we'll match you with relevant projects.",
  },
  {
    key: "communities",
    title: "Communities you may like",
    icon: Users,
    empty: "Complete your compatibility profile to find communities that fit.",
  },
  {
    key: "organizations",
    title: "Organizations looking for your skills",
    icon: Building2,
    empty: "Add skills in Settings so we can match you with organizations.",
  },
  {
    key: "missions",
    title: "Missions matching your interests",
    icon: Target,
    empty: "Your pending missions will appear here when they align with your profile.",
  },
];

function RecommendationCard({ item }: { item: ScoredRecommendation }) {
  const primaryReason = item.reasons[0];
  const avatarUrl = item.meta?.avatarUrl ?? undefined;

  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-border-subtle bg-white/[0.02] p-4 transition-colors hover:border-brand/30 hover:bg-brand/5"
    >
      <div className="flex items-start gap-3">
        {item.category === "people" && (
          <Avatar
            src={avatarUrl}
            fallback={formatInitials(item.title)}
            size="sm"
            className="mt-0.5 shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-fg-primary">{item.title}</p>
            <Badge variant="outline" className="text-micro">
              {item.score}% match
            </Badge>
          </div>
          {item.subtitle && (
            <p className="mt-0.5 text-caption capitalize text-fg-muted">{item.subtitle}</p>
          )}
          {primaryReason && (
            <p className="mt-2 text-sm leading-relaxed text-brand">{primaryReason}</p>
          )}
          {item.reasons[1] && (
            <p className="mt-1 text-caption text-fg-muted">{item.reasons[1]}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function HomeRecommendations({
  recommendations,
}: {
  recommendations: OpportunityRecommendations;
}) {
  const total =
    recommendations.people.length +
    recommendations.projects.length +
    recommendations.communities.length +
    recommendations.organizations.length +
    recommendations.missions.length;

  if (total === 0) {
    return (
      <section aria-labelledby="home-recommendations-heading">
        <div className="mb-3">
          <p className="text-label">Opportunity graph</p>
          <h2 id="home-recommendations-heading" className="text-heading mt-1 text-fg-primary">
            Recommended for You
          </h2>
        </div>
        <GlassCard className="px-6 py-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-brand" aria-hidden />
          <p className="mt-3 text-body text-fg-secondary">
            Add skills and interests in Settings to unlock compatibility-based recommendations.
          </p>
          <Link
            href="/settings?tab=profile"
            className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Complete compatibility profile
          </Link>
        </GlassCard>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-recommendations-heading">
      <div className="mb-4">
        <p className="text-label">Opportunity graph</p>
        <h2 id="home-recommendations-heading" className="text-heading mt-1 text-fg-primary">
          Recommended for You
        </h2>
        <p className="mt-1 text-caption text-fg-muted">
          Compatibility matches based on your skills, interests, communities, and activity — not
          engagement tricks.
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map(({ key, title, icon: Icon, empty }) => {
          const items = recommendations[key];
          if (items.length === 0) return null;

          return (
            <div key={key}>
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand" aria-hidden />
                <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
                <Badge variant="outline" className="text-micro">
                  {items.length}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <RecommendationCard key={`${item.category}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
