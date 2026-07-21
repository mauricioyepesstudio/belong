"use client";

import type { ImpactScoreProfile } from "@/engines/impact";
import { Badge, Button } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import { GlassCard } from "@/engines/belong/components/dashboard/primitives";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export function ImpactSection({ impact }: { impact: ImpactScoreProfile }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ImpactStatCard label="Total score" value={impact.totalScore} />
        <ImpactStatCard label="This week" value={impact.weeklyScore} />
        <ImpactStatCard label="This month" value={impact.monthlyScore} />
      </div>

      <GlassCard className="divide-y divide-border-subtle">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" aria-hidden />
            <h3 className="text-sm font-medium text-fg-primary">Recent impact events</h3>
          </div>
          <p className="mt-1 text-caption text-fg-muted">
            Points earned from meaningful participation across BELONG.
          </p>
        </div>

        {impact.recentEvents.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-fg-muted">
              Join a community, complete a mission, or publish a post to start building impact.
            </p>
            <div className="mt-4">
              <Link href="/community">
                <Button size="sm" variant="brand">
                  Browse communities
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          impact.recentEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg-primary">{event.label}</p>
                <p className="text-micro text-fg-muted">
                  {formatDistanceToNow(event.createdAt)}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 tabular-nums">
                +{event.points}
              </Badge>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}

function ImpactStatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard className="p-5">
      <p className="text-caption text-fg-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">{value}</p>
    </GlassCard>
  );
}
