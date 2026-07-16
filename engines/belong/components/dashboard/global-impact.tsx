"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, EmptyState } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard, SectionHeader } from "./primitives";

const activityIcons: Record<string, LucideIcon> = {
  contribution: Users,
  mission: CheckCircle2,
  goal: Target,
  project: FolderKanban,
  community: Users,
  connection: UserPlus,
  event: CalendarDays,
};

export function RecentActivity({
  activity,
  onExploreCommunities,
}: {
  activity: HomeEngineData["recentActivity"];
  onExploreCommunities: () => void;
}) {
  return (
    <ScrollReveal delay={0.1}>
      <section>
        <SectionHeader label="Activity" title="Recent activity" />

        {activity.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Complete missions, join communities, or start a project — your impact story begins here."
              action={{ label: "Explore communities", onClick: onExploreCommunities }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-white/[0.06]">
            {activity.map((item) => {
              const Icon = activityIcons[item.type] ?? Activity;
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
                    <p className="text-sm font-medium capitalize text-fg-primary">{item.title}</p>
                    {item.subtitle && (
                      <p className="mt-0.5 text-caption capitalize">{item.subtitle}</p>
                    )}
                    <p className="mt-1 text-micro text-fg-faint">
                      {formatDistanceToNow(item.createdAt)}
                    </p>
                  </div>
                  {item.points != null && item.points > 0 && (
                    <Badge variant="outline" className="shrink-0">
                      +{item.points}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </GlassCard>
        )}
      </section>
    </ScrollReveal>
  );
}
