"use client";

import type { UserActivityItem } from "@/engines/belong/global-feed";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, EmptyState } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import {
  Activity,
  Award,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard, SectionHeader } from "./primitives";

const activityConfig: Record<UserActivityItem["type"], { icon: LucideIcon; label: string }> = {
  contribution: { icon: Users, label: "Contribution" },
  mission: { icon: CheckCircle2, label: "Mission" },
  goal: { icon: Target, label: "Weekly goal" },
  project: { icon: FolderKanban, label: "Project" },
  community: { icon: Users, label: "Community" },
  connection: { icon: UserPlus, label: "Connection" },
  event: { icon: CalendarDays, label: "Event" },
  post: { icon: Activity, label: "Post" },
  comment: { icon: MessageSquare, label: "Comment" },
  member: { icon: UserPlus, label: "New member" },
  achievement: { icon: Award, label: "Achievement" },
};

export function UnifiedFeed({
  activity,
  onExploreCommunities,
}: {
  activity: UserActivityItem[];
  onExploreCommunities: () => void;
}) {
  return (
    <ScrollReveal delay={0.1}>
      <section id="unified-feed">
        <SectionHeader
          label="Unified feed"
          title="Everything in one stream"
          action={
            <Link
              href="/notifications"
              className="text-sm text-fg-muted transition-colors hover:text-brand"
            >
              All notifications →
            </Link>
          }
        />

        {activity.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={Activity}
              title="Your feed is warming up"
              description="Complete a mission, post in a community, or join a project — activity from every module appears here."
              action={{ label: "Explore communities", onClick: onExploreCommunities }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-white/[0.06]">
            {activity.map((item) => {
              const config = activityConfig[item.type];
              const Icon = config.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 p-5 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-fg-muted" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-micro">
                        {config.label}
                      </Badge>
                      {item.points != null && item.points > 0 && (
                        <span className="text-micro text-brand">+{item.points} impact</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-fg-primary">{item.title}</p>
                    {item.subtitle && (
                      <p className="mt-0.5 text-caption capitalize">{item.subtitle}</p>
                    )}
                    <p className="mt-1 text-micro text-fg-faint">
                      {formatDistanceToNow(item.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </GlassCard>
        )}
      </section>
    </ScrollReveal>
  );
}
