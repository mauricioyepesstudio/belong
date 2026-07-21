"use client";

import type { ImpactScoreProfile } from "@/engines/impact";
import { GlassCard } from "@/engines/belong/components/dashboard/primitives";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export function HomeWeeklyImpact({ impact }: { impact: ImpactScoreProfile }) {
  const topEvent = impact.recentEvents[0];

  return (
    <section aria-labelledby="home-weekly-impact-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-label">Participation</p>
          <h2 id="home-weekly-impact-heading" className="text-heading mt-1 text-fg-primary">
            Your Impact This Week
          </h2>
        </div>
        <Link href="/profile?tab=impact" className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-semibold tabular-nums text-fg-primary">
              {impact.weeklyScore}
            </p>
            <p className="mt-1 text-caption text-fg-muted">
              {impact.weeklyScore === 0
                ? "Take action today — create, join, or contribute."
                : `${impact.totalScore} total · ${impact.monthlyScore} this month`}
            </p>
            {topEvent && (
              <p className="mt-2 truncate text-sm text-fg-secondary">
                Latest: {topEvent.label} (+{topEvent.points})
              </p>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
