"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, Button, EmptyState } from "@/systems/design-system";
import { ArrowRight, CheckCircle2, Flame, Target } from "lucide-react";
import Link from "next/link";
import { CircularProgress } from "./circular-progress";
import { GlassCard, SectionHeader } from "./primitives";

export function WeeklyGoal({
  weeklyGoals,
  weeklyProgress,
  momentum,
  onViewMissions,
}: {
  weeklyGoals: HomeEngineData["weeklyGoals"];
  weeklyProgress: number;
  momentum: HomeEngineData["momentum"];
  onViewMissions: () => void;
}) {
  const activeGoals = weeklyGoals.filter((g) => g.status === "active");
  const completedGoals = weeklyGoals.filter((g) => g.status === "completed");

  if (activeGoals.length === 0 && completedGoals.length === 0) {
    return (
      <ScrollReveal delay={0.08}>
        <section>
          <SectionHeader label="Goals" title="Weekly goals" />
          <GlassCard>
            <EmptyState
              icon={Target}
              title="No weekly goals yet"
              description="Weekly goals are created when you visit your dashboard. Complete daily missions to make progress."
              action={{ label: "View missions", onClick: onViewMissions }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        </section>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal delay={0.08}>
      <section>
        <SectionHeader
          label="Goals"
          title="Weekly goals"
          action={
            <div className="flex items-center gap-3 text-sm text-fg-muted">
              {momentum.current_streak > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-400" aria-hidden />
                  {momentum.current_streak} day streak
                </span>
              )}
              <span className="tabular-nums">{weeklyProgress}% overall</span>
            </div>
          }
        />

        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const completionPct = Math.round((goal.current_count / goal.target_count) * 100);
            const estimatedImpact = Math.round((goal.impact_points * completionPct) / 100);
            const remainingImpact = goal.impact_points - estimatedImpact;

            return (
              <GlassCard key={goal.id} className="p-8 md:p-10 lg:p-12">
                <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
                  <div className="flex justify-center lg:justify-start">
                    <CircularProgress value={completionPct} size={180} strokeWidth={5}>
                      <span className="text-4xl font-semibold tabular-nums tracking-tight text-fg-primary">
                        {completionPct}%
                      </span>
                      <span className="mt-1 text-micro text-fg-muted">complete</span>
                    </CircularProgress>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Target className="h-4 w-4 text-brand" aria-hidden />
                      <p className="text-label">Weekly Goal</p>
                      <Badge variant="outline" className="capitalize">
                        {goal.status}
                      </Badge>
                    </div>

                    <h2 className="text-heading-lg mt-4 text-fg-primary">{goal.title}</h2>
                    {goal.description && (
                      <p className="text-body mt-3 max-w-lg">{goal.description}</p>
                    )}

                    <div className="mt-8 grid gap-6 sm:grid-cols-3">
                      <div>
                        <p className="text-3xl font-semibold tabular-nums text-fg-primary">
                          {goal.current_count}
                          <span className="text-lg text-fg-muted">/{goal.target_count}</span>
                        </p>
                        <p className="mt-1 text-caption">Steps completed</p>
                      </div>
                      <div>
                        <p className="text-3xl font-semibold tabular-nums text-brand">
                          +{estimatedImpact}
                        </p>
                        <p className="mt-1 text-caption">Impact earned</p>
                      </div>
                      <div>
                        <p className="text-3xl font-semibold tabular-nums text-fg-primary">
                          +{remainingImpact}
                        </p>
                        <p className="mt-1 text-caption">Impact remaining</p>
                      </div>
                    </div>

                    <Link href={goal.action_href} className="mt-8 inline-block">
                      <Button variant="outline" className="h-11 rounded-2xl px-6">
                        Continue this week
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {completedGoals.length > 0 && (
            <GlassCard className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-medium text-fg-primary">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                Completed this week ({completedGoals.length})
              </p>
              <ul className="space-y-2">
                {completedGoals.map((goal) => (
                  <li
                    key={goal.id}
                    className="flex items-center justify-between rounded-xl border border-success/15 bg-success/5 px-4 py-3"
                  >
                    <span className="text-sm text-fg-secondary">{goal.title}</span>
                    <Badge variant="outline">+{goal.impact_points} impact</Badge>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
}
