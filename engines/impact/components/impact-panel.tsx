"use client";

import type { ImpactEngineData } from "@/engines/impact/types";
import { RippleChart } from "@/engines/impact/components/ripple-chart";
import { Badge, Card, CardContent, ProgressBar } from "@/systems/design-system";
import { Award, TrendingUp } from "lucide-react";
import Link from "next/link";

export function ImpactPanel({ data }: { data: ImpactEngineData }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-sm font-semibold text-fg-primary">Impact Engine</h2>
          </div>
          <Link href="/profile">
            <Badge variant="brand">{data.score.level}</Badge>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <RippleChart rings={data.ripple} />
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-3xl font-bold text-fg-primary">{data.score.score}</p>
              <p className="text-xs text-fg-muted">Impact Score</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-fg-muted">
                <span>Next level</span>
                <span>{data.nextLevelAt} pts</span>
              </div>
              <ProgressBar value={data.progressToNext} className="mt-1" />
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-bg-surface/50 p-3">
              <Award className="mt-0.5 h-4 w-4 text-brand" aria-hidden />
              <div>
                <p className="text-xs font-medium text-fg-primary">
                  {data.founderReputation.label}
                </p>
                <p className="text-micro text-fg-muted">
                  {data.founderReputation.communitiesOwned} communities ·{" "}
                  {data.founderReputation.totalMembers} members ·{" "}
                  {data.communityContributionPoints} contribution pts
                </p>
              </div>
            </div>
          </div>
        </div>

        {data.history.length > 1 && (
          <div className="mt-4 flex items-end gap-1 border-t border-border-subtle pt-4">
            {data.history.map((point) => (
              <div
                key={point.date}
                className="flex-1 rounded-t bg-brand/20"
                style={{
                  height: `${Math.max(8, (point.score / Math.max(...data.history.map((h) => h.score), 1)) * 48)}px`,
                }}
                title={`${point.date}: ${point.score}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
