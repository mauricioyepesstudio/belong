"use client";

import type { HomeDiscoveryData } from "@/engines/belong/home/types";
import { Avatar, Badge } from "@/systems/design-system";
import { formatEventDate, formatInitials } from "@/lib/format";
import {
  CalendarDays,
  Compass,
  MapPin,
  MessageSquare,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "../dashboard/primitives";

function PanelSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand" aria-hidden />
          <h3 className="text-sm font-semibold text-fg-primary">{title}</h3>
        </div>
      </div>
      <div className="divide-y divide-white/[0.06]">{children}</div>
    </GlassCard>
  );
}

function PanelRow({
  href,
  title,
  subtitle,
  meta,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="block px-4 py-3 transition-colors hover:bg-white/[0.02]">
      <p className="text-sm font-medium text-fg-primary line-clamp-2">{title}</p>
      {subtitle && <p className="mt-0.5 text-caption text-fg-muted line-clamp-2">{subtitle}</p>}
      {meta && <p className="mt-1 text-micro text-fg-faint">{meta}</p>}
    </Link>
  );
}

function hasDiscoveryContent(discovery: HomeDiscoveryData): boolean {
  return (
    discovery.trendingConversations.length > 0 ||
    discovery.upcomingEvents.length > 0 ||
    discovery.suggestedCommunities.length > 0 ||
    discovery.suggestedCollaborators.length > 0 ||
    discovery.aiOpportunities.length > 0 ||
    discovery.topContributors.length > 0
  );
}

export function DiscoveryPanel({ discovery }: { discovery: HomeDiscoveryData }) {
  const hasContent = hasDiscoveryContent(discovery);

  return (
    <aside aria-labelledby="home-discover-heading" className="space-y-4">
      <div>
        <p className="text-label">Discover</p>
        <h2 id="home-discover-heading" className="text-heading mt-1 text-fg-primary">
          Opportunities around you
        </h2>
        <p className="mt-2 text-caption text-fg-muted">
          Conversations, events, and people to explore.
        </p>
      </div>

      {!hasContent ? (
        <GlassCard className="px-5 py-8 text-center">
          <Compass className="mx-auto h-8 w-8 text-fg-faint" aria-hidden />
          <p className="mt-3 text-sm font-medium text-fg-primary">Discovery opens up as you go</p>
          <p className="mt-2 text-caption text-fg-muted">
            Join communities and connect with builders — suggestions will appear here.
          </p>
          <Link
            href="/community"
            className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Explore communities →
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {discovery.suggestedCommunities.length > 0 && (
            <PanelSection title="Suggested communities" icon={Users}>
              {discovery.suggestedCommunities.map((community) => (
                <PanelRow
                  key={community.id}
                  href={community.href}
                  title={community.name}
                  subtitle={community.tag ?? undefined}
                  meta={`${community.memberCount} members`}
                />
              ))}
            </PanelSection>
          )}

          {discovery.aiOpportunities.length > 0 && (
            <PanelSection title="Suggested next steps" icon={Sparkles}>
              {discovery.aiOpportunities.slice(0, 3).map((opp) => (
                <div key={opp.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-fg-primary">{opp.title}</p>
                  <p className="mt-1 text-caption text-fg-muted line-clamp-2">{opp.description}</p>
                  <Link
                    href={opp.href}
                    className="mt-2 inline-flex text-micro font-medium text-brand hover:underline"
                  >
                    {opp.actionLabel} →
                  </Link>
                </div>
              ))}
            </PanelSection>
          )}

          {discovery.trendingConversations.length > 0 && (
            <PanelSection title="Trending conversations" icon={MessageSquare}>
              {discovery.trendingConversations.slice(0, 4).map((item) => (
                <PanelRow
                  key={item.id}
                  href={item.href}
                  title={item.title}
                  subtitle={item.communityName}
                  meta={`${item.replyCount} responses`}
                />
              ))}
            </PanelSection>
          )}

          {discovery.upcomingEvents.length > 0 && (
            <PanelSection title="Upcoming events" icon={CalendarDays}>
              {discovery.upcomingEvents.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="block px-4 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-fg-primary">{event.title}</p>
                    {event.registered && (
                      <Badge variant="brand" className="shrink-0 text-micro">
                        Registered
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-caption text-fg-muted">{formatEventDate(event.startsAt)}</p>
                  {event.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-micro text-fg-faint">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {event.location}
                    </p>
                  )}
                </Link>
              ))}
            </PanelSection>
          )}

          {discovery.suggestedCollaborators.length > 0 && (
            <PanelSection title="Suggested collaborators" icon={UserPlus}>
              {discovery.suggestedCollaborators.slice(0, 3).map((person) => (
                <Link
                  key={person.id}
                  href={person.href}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <Avatar
                    src={person.avatarUrl ?? undefined}
                    fallback={formatInitials(person.name)}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg-primary">{person.name}</p>
                    <p className="mt-0.5 text-caption text-fg-muted line-clamp-2">{person.reason}</p>
                  </div>
                </Link>
              ))}
            </PanelSection>
          )}

          {discovery.topContributors.length > 0 && (
            <PanelSection title="Top contributors" icon={Trophy}>
              {discovery.topContributors.slice(0, 5).map((contributor, index) => (
                <Link
                  key={contributor.id}
                  href={contributor.href}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-micro font-bold text-brand">
                    {index + 1}
                  </span>
                  <Avatar
                    src={contributor.avatarUrl ?? undefined}
                    fallback={formatInitials(contributor.name)}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg-primary">{contributor.name}</p>
                    <p className="text-micro text-brand">{contributor.points} impact this week</p>
                  </div>
                </Link>
              ))}
            </PanelSection>
          )}
        </div>
      )}
    </aside>
  );
}
