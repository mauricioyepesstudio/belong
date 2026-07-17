"use client";

import type { ProjectAnalytics } from "@/lib/core/project-workspace";
import { Card, CardContent, ProgressBar } from "@/systems/design-system";
import { Activity, CheckCircle2, Target, TrendingUp, Users } from "lucide-react";

export function ProjectAnalyticsTab({ analytics }: { analytics: ProjectAnalytics }) {
  const stats = [
    {
      label: "Project health",
      value: `${analytics.healthScore}%`,
      icon: Activity,
      detail: "Composite score from progress, tasks, team, and impact",
    },
    {
      label: "Completed tasks",
      value: `${analytics.completedTasks}/${analytics.totalTasks}`,
      icon: CheckCircle2,
      detail: "Tasks moved to Done",
    },
    {
      label: "Mission score",
      value: `${analytics.missionScore}%`,
      icon: Target,
      detail: "Alignment with life mission",
    },
    {
      label: "Team participation",
      value: `${analytics.teamParticipation}%`,
      icon: Users,
      detail: "Members active in project activity",
    },
    {
      label: "Impact generated",
      value: String(analytics.impactGenerated),
      icon: TrendingUp,
      detail: "Total impact points from project events",
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-fg-muted">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="text-caption">{s.label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">{s.value}</p>
                <p className="mt-1 text-micro text-fg-faint">{s.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-fg-muted">Tasks by status</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["todo", "Todo"],
                ["in_progress", "In Progress"],
                ["review", "Review"],
                ["done", "Done"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="tabular-nums">{analytics.tasksByStatus[key]}</span>
                </div>
                <ProgressBar
                  value={
                    analytics.totalTasks > 0
                      ? Math.round((analytics.tasksByStatus[key] / analytics.totalTasks) * 100)
                      : 0
                  }
                  className="mt-2 h-1.5"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
