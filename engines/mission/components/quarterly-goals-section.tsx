"use client";

import type { QuarterlyGoal } from "@/engines/mission/types";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, EmptyState, ProgressBar } from "@/systems/design-system";
import { CalendarRange, Target } from "lucide-react";
import { CircularProgress } from "@/engines/belong/components/dashboard/circular-progress";
import { GlassCard, SectionHeader } from "@/engines/belong/components/dashboard/primitives";

type QuarterlyGoalsSectionProps = {
  goals: QuarterlyGoal[];
  quarterlyProgress: number;
  hasLifeMission: boolean;
  onDefineMission: () => void;
};

export function QuarterlyGoalsSection({
  goals,
  quarterlyProgress,
  hasLifeMission,
  onDefineMission,
}: QuarterlyGoalsSectionProps) {
  if (!hasLifeMission) {
    return (
      <ScrollReveal delay={0.06}>
        <section>
          <SectionHeader label="Goals" title="Quarterly goals" />
          <GlassCard>
            <EmptyState
              icon={CalendarRange}
              title="Set your life mission first"
              description="Quarterly goals connect to your life mission and break the year into achievable outcomes."
              action={{ label: "Define life mission", onClick: onDefineMission }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        </section>
      </ScrollReveal>
    );
  }

  if (goals.length === 0) {
    return (
      <ScrollReveal delay={0.06}>
        <section>
          <SectionHeader label="Goals" title="Quarterly goals" />
          <GlassCard>
            <EmptyState
              icon={CalendarRange}
              title="Quarterly goals loading"
              description="Visit your dashboard to generate this quarter's goals from your life mission."
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        </section>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal delay={0.06}>
      <section>
        <SectionHeader
          label="Goals"
          title="Quarterly goals"
          action={
            <span className="text-sm tabular-nums text-fg-muted">{quarterlyProgress}% overall</span>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GlassCard key={goal.id} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <Target className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <Badge
                  variant={goal.status === "completed" ? "success" : "outline"}
                  className="capitalize"
                >
                  {goal.status}
                </Badge>
              </div>
              <h3 className="mt-4 font-semibold text-fg-primary">{goal.title}</h3>
              {goal.description && (
                <p className="mt-2 flex-1 text-caption text-fg-muted line-clamp-3">
                  {goal.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-4">
                <CircularProgress value={goal.progress_percent} size={72} strokeWidth={4}>
                  <span className="text-sm font-semibold tabular-nums">{goal.progress_percent}%</span>
                </CircularProgress>
                <div className="min-w-0 flex-1 space-y-2">
                  <ProgressBar value={goal.progress_percent} animate={false} />
                  <p className="text-micro text-fg-faint">
                    Due {new Date(goal.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
