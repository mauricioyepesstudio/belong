"use client";

import type { HomeDiscoveryData } from "@/engines/belong/home/types";
import { Avatar, Badge } from "@/systems/design-system";
import { formatEventDate, formatInitials } from "@/lib/format";
import {
  CalendarDays,
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
    <Link
      href={href}
      className="block px-4 py-3 transition-colors hover:bg-white/[0.02]"
    >
      <p className="text-sm font-medium text-fg-primary line-clamp-2">{title}</p>
      {subtitle && <p className="mt-0.5 text-caption text-fg-muted line-clamp-2">{subtitle}</p>}
      {meta && <p className="mt-1 text-micro text-fg-faint">{meta}</p>}
    </Link>
  );
}

export function DiscoveryPanel({ discovery }: { discovery: HomeDiscoveryData }) {
  return (
    <div className="space-y-5">
      {discovery.trendingConversations.length > 0 && (
        <PanelSection title="Trending Conversations" icon={MessageSquare}>
          {discovery.trendingConversations.map((item) => (
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
        <PanelSection title="Upcoming Events" icon={CalendarDays}>
          {discovery.upcomingEvents.map((event) => (
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
              <p className="mt-1 text-micro text-fg-faint">{event.attendeeCount} attending</p>
            </Link>
          ))}
        </PanelSection>
      )}

      {discovery.suggestedCommunities.length > 0 && (
        <PanelSection title="Suggested Communities" icon={Users}>
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

      {discovery.suggestedCollaborators.length > 0 && (
        <PanelSection title="Suggested Collaborators" icon={UserPlus}>
          {discovery.suggestedCollaborators.map((person) => (
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

      {discovery.aiOpportunities.length > 0 && (
        <PanelSection title="AI Opportunities" icon={Sparkles}>
          {discovery.aiOpportunities.map((opp) => (
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

      {discovery.topContributors.length > 0 && (
        <PanelSection title="Top Contributors" icon={Trophy}>
          {discovery.topContributors.map((contributor, index) => (
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
  );
}
