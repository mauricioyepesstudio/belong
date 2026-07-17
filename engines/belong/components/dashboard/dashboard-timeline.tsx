"use client";

import type { ReactNode } from "react";
import type { DashboardTimeline } from "@/engines/belong/creator-os";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, ProgressBar } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import {
  FolderKanban,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "./primitives";

function ImpactSparkline({ history }: { history: { date: string; score: number }[] }) {
  if (history.length < 2) return null;
  const scores = history.map((h) => h.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const points = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * width;
      const y = height - ((s - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="text-brand" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function DashboardTimeline({ timeline }: { timeline: DashboardTimeline }) {
  return (
    <ScrollReveal>
      <section>
        <SectionHeader label="Timeline" title="Your day at a glance" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TimelineCard
            icon={Target}
            label="Today's mission"
            href={timeline.todayMission?.href ?? "#missions"}
            empty={!timeline.todayMission}
            emptyLabel="No pending mission"
          >
            {timeline.todayMission && (
              <>
                <p className="line-clamp-2 text-sm font-medium text-fg-primary">
                  {timeline.todayMission.title}
                </p>
                <Badge variant="brand" className="mt-2 text-micro">
                  +{timeline.todayMission.impactPoints} impact
                </Badge>
              </>
            )}
          </TimelineCard>

          <TimelineCard
            icon={FolderKanban}
            label="Active project"
            href={timeline.activeProject?.href ?? "/projects"}
            empty={!timeline.activeProject}
            emptyLabel="Start a project"
          >
            {timeline.activeProject && (
              <>
                <p className="line-clamp-2 text-sm font-medium text-fg-primary">
                  {timeline.activeProject.name}
                </p>
                <p className="mt-1 text-micro capitalize text-fg-muted">
                  {timeline.activeProject.status} · {timeline.activeProject.memberCount} members
                </p>
              </>
            )}
          </TimelineCard>

          <TimelineCard
            icon={Users}
            label="Community pulse"
            href={timeline.communityPulse?.href ?? "/community"}
            empty={!timeline.communityPulse}
            emptyLabel="Join a community"
          >
            {timeline.communityPulse && (
              <>
                <p className="line-clamp-2 text-sm font-medium text-fg-primary">
                  {timeline.communityPulse.title}
                </p>
                <p className="mt-1 text-micro text-fg-muted">
                  {timeline.communityPulse.communityName} ·{" "}
                  {formatDistanceToNow(timeline.communityPulse.createdAt)}
                </p>
              </>
            )}
          </TimelineCard>

          <TimelineCard
            icon={Target}
            label="Weekly goals"
            href="#weekly-goals"
            empty={timeline.weeklyGoalProgress === 0 && !timeline.weeklyGoalTitle}
            emptyLabel="Set weekly goals"
          >
            <p className="text-sm font-medium text-fg-primary">
              {timeline.weeklyGoalTitle ?? "Weekly progress"}
            </p>
            <ProgressBar value={timeline.weeklyGoalProgress} className="mt-3 h-1.5" />
            <p className="mt-1 text-micro tabular-nums text-fg-muted">
              {timeline.weeklyGoalProgress}% complete
            </p>
          </TimelineCard>

          <TimelineCard
            icon={TrendingUp}
            label="Impact score"
            href="/profile"
            empty={false}
          >
            <p className="text-2xl font-semibold tabular-nums text-fg-primary">
              {timeline.impactScore}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-micro text-brand">+{timeline.weeklyImpactDelta} this week</p>
              <ImpactSparkline history={timeline.impactHistory} />
            </div>
          </TimelineCard>
        </div>
      </section>
    </ScrollReveal>
  );
}

function TimelineCard({
  icon: Icon,
  label,
  href,
  empty,
  emptyLabel,
  children,
}: {
  icon: typeof Target;
  label: string;
  href: string;
  empty: boolean;
  emptyLabel?: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className="group block h-full">
      <GlassCard hover className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2 text-fg-muted">
          <Icon className="h-4 w-4" aria-hidden />
          <span className="text-caption">{label}</span>
        </div>
        <div className="mt-3 flex-1">
          {empty ? (
            <p className="text-sm text-fg-muted group-hover:text-brand">{emptyLabel ?? "View →"}</p>
          ) : (
            children
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
