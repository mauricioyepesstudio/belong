"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, EmptyState, ProgressBar } from "@/systems/design-system";
import { CalendarDays, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "./primitives";

export function ImpactScore({
  impactEngine,
}: {
  impactEngine: HomeEngineData["impactEngine"];
}) {
  const lifetimeScore = impactEngine.score.score ?? 0;
  const { weeklyImpact } = impactEngine;
  const breakdown = impactEngine.score.breakdown.filter((item) => item.points > 0);
  const hasWeeklyActivity =
    weeklyImpact.points > 0 ||
    weeklyImpact.missionsCompleted > 0 ||
    weeklyImpact.goalsCompleted > 0 ||
    weeklyImpact.contributionsLogged > 0;

  return (
    <ScrollReveal>
      <section>
        <SectionHeader
          label="Impact"
          title="Impact Score"
          action={
            <Link
              href="/profile"
              className="text-sm text-fg-muted transition-colors hover:text-brand"
            >
              View details →
            </Link>
          }
        />

        <GlassCard glow className="p-8 md:p-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/15">
                <TrendingUp className="h-9 w-9 text-brand" aria-hidden />
              </div>
              <div>
                <p className="text-display-xl tabular-nums text-fg-primary">{lifetimeScore}</p>
                <p className="mt-1 text-caption">Lifetime impact score</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Badge variant="brand">{impactEngine.score.level}</Badge>
              <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                <CalendarDays className="h-4 w-4" aria-hidden />
                +{weeklyImpact.points} this week
              </p>
            </div>
          </div>

          {breakdown.length > 0 ? (
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {breakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <span className="text-sm text-fg-secondary">{item.label}</span>
                  <span className="text-sm font-medium tabular-nums text-brand">+{item.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 border-t border-white/[0.06] pt-8">
              <EmptyState
                icon={Target}
                title="Build your impact score"
                description="Complete your profile, join communities, and finish missions to start earning points."
                action={{ label: "View missions", href: "#missions" }}
                className="border-0 bg-transparent py-6"
              />
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl font-semibold tabular-nums text-fg-primary">
                {weeklyImpact.missionsCompleted}
              </p>
              <p className="mt-1 text-caption">Missions completed this week</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl font-semibold tabular-nums text-fg-primary">
                {weeklyImpact.goalsCompleted}
              </p>
              <p className="mt-1 text-caption">Weekly goals done</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl font-semibold tabular-nums text-fg-primary">
                {weeklyImpact.contributionsLogged}
              </p>
              <p className="mt-1 text-caption">Community contributions</p>
            </div>
          </div>

          {!hasWeeklyActivity && breakdown.length > 0 && (
            <p className="mt-6 text-center text-micro text-fg-faint">
              No impact earned yet this week — complete a mission to get started.
            </p>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-muted">Progress to {impactEngine.nextLevelAt} pts</span>
              <span className="font-medium tabular-nums text-fg-primary">
                {impactEngine.progressToNext}%
              </span>
            </div>
            <ProgressBar value={impactEngine.progressToNext} className="mt-3 h-1.5" />
          </div>

          {impactEngine.history.length > 1 && (
            <div className="mt-8 flex items-end gap-1 border-t border-white/[0.06] pt-6">
              {impactEngine.history.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 rounded-t bg-brand/25 transition-colors hover:bg-brand/40"
                  style={{
                    height: `${Math.max(8, (point.score / Math.max(...impactEngine.history.map((h) => h.score), 1)) * 48)}px`,
                  }}
                  title={`${point.date}: ${point.score}`}
                />
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </ScrollReveal>
  );
}
