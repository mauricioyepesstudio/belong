"use client";

import type { ReputationProfile } from "@/engines/identity/reputation";
import { Badge, ProgressBar } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import { MODULE_LABELS } from "@/engines/identity/reputation";
import {
  Award,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/engines/belong/components/dashboard/primitives";

export function ReputationSummary({ reputation }: { reputation: ReputationProfile }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard
        icon={TrendingUp}
        label="Total Impact"
        value={String(reputation.totalImpact)}
        detail={reputation.reputationLevel}
        href="/profile"
      />
      <SummaryCard
        icon={Sparkles}
        label="Reputation Level"
        value={reputation.reputationLevel}
        detail={`${reputation.progressToNext}% to next`}
        href="/profile"
      />
      <SummaryCard
        icon={Flame}
        label="Current Streak"
        value={`${reputation.currentStreak}d`}
        detail={`Best: ${reputation.longestStreak}d`}
        href="/profile"
      />
      <SummaryCard
        icon={Trophy}
        label="Founder Rank"
        value={`#${reputation.ranks.founderRank}`}
        detail={`of ${Math.max(reputation.ranks.totalFounders, 1)} founders`}
        href="/profile"
      />
      <SummaryCard
        icon={Users}
        label="Community Rank"
        value={`#${reputation.ranks.communityRank}`}
        detail={`of ${Math.max(reputation.ranks.totalContributors, 1)} contributors`}
        href="/profile"
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <GlassCard hover className="p-4">
        <div className="flex items-center gap-2 text-fg-muted">
          <Icon className="h-4 w-4" aria-hidden />
          <span className="text-caption">{label}</span>
        </div>
        <p className="mt-2 text-xl font-semibold tabular-nums text-fg-primary group-hover:text-brand">
          {value}
        </p>
        <p className="mt-0.5 text-micro text-fg-muted">{detail}</p>
      </GlassCard>
    </Link>
  );
}

export function ReputationDashboard({ reputation }: { reputation: ReputationProfile }) {
  const { scores } = reputation;

  return (
    <div className="space-y-6">
      <ReputationSummary reputation={reputation} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreTile label="Reputation score" value={scores.reputationScore} icon={Sparkles} />
        <ScoreTile label="Founder score" value={scores.founderScore} icon={Trophy} />
        <ScoreTile label="Collaboration" value={scores.collaborationScore} icon={Users} />
        <ScoreTile label="Community contributions" value={scores.communityContributionScore} icon={Award} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-fg-muted">
              <Target className="h-4 w-4" aria-hidden />
              <span className="text-caption">Mission completion rate</span>
            </div>
            <Badge variant="brand">{scores.missionCompletionRate}%</Badge>
          </div>
          <ProgressBar value={scores.missionCompletionRate} className="mt-4 h-2" />
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-fg-muted">
              <Award className="h-4 w-4" aria-hidden />
              <span className="text-caption">Project completion score</span>
            </div>
            <Badge variant="brand">{scores.projectCompletionScore}%</Badge>
          </div>
          <ProgressBar value={scores.projectCompletionScore} className="mt-4 h-2" />
        </GlassCard>
      </div>

      {reputation.eventTotals.length > 0 && (
        <GlassCard className="divide-y divide-white/[0.06]">
          <div className="p-5">
            <h3 className="text-sm font-medium text-fg-primary">Impact by module</h3>
          </div>
          {reputation.eventTotals.map((item) => (
            <div key={item.module} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-fg-secondary">{MODULE_LABELS[item.module]}</span>
              <span className="text-sm font-medium tabular-nums text-brand">
                +{item.points} ({item.count} events)
              </span>
            </div>
          ))}
        </GlassCard>
      )}

      {reputation.recentEvents.length > 0 && (
        <GlassCard className="divide-y divide-white/[0.06]">
          <div className="p-5">
            <h3 className="text-sm font-medium text-fg-primary">Recent impact events</h3>
          </div>
          {reputation.recentEvents.slice(0, 12).map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize text-fg-primary">
                  {event.eventType.replace(/_/g, " ")}
                </p>
                <p className="text-micro text-fg-muted">
                  {MODULE_LABELS[event.module]} · {formatDistanceToNow(event.createdAt)}
                </p>
              </div>
              <Badge variant="outline">+{event.points}</Badge>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

function ScoreTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Sparkles;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 text-fg-muted">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-caption">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">{value}</p>
    </GlassCard>
  );
}
