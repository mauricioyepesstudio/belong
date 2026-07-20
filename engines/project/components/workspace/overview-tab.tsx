"use client";

import type { ProjectDetail } from "@/lib/core";
import { Badge, Card, CardContent, ProgressBar } from "@/systems/design-system";
import { Target, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";

export function ProjectOverviewTab({ data }: { data: ProjectDetail }) {
  const { project, owner, workspace } = data;
  const { mission, milestones, impactGenerated } = workspace;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-medium text-fg-muted">Description</h3>
          <p className="text-body text-fg-secondary">
            {project.description ?? "No description yet."}
          </p>
          <div className="border-t border-border-subtle pt-4">
            <p className="text-caption text-fg-muted">Owner</p>
            <p className="mt-1 font-medium text-fg-primary">{owner.full_name ?? "Builder"}</p>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-fg-muted">Progress</span>
              <span>{project.progress}%</span>
            </div>
            <ProgressBar value={project.progress} className="mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" aria-hidden />
            <span className="text-sm text-fg-secondary">
              Reputation contribution: <strong className="text-brand">+{impactGenerated}</strong> impact
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" aria-hidden />
            <h3 className="text-sm font-medium text-fg-muted">Linked mission</h3>
          </div>
          {mission ? (
            <>
              <p className="font-medium text-fg-primary">{mission.title}</p>
              {mission.description && (
                <p className="text-caption line-clamp-3">{mission.description}</p>
              )}
              <Badge variant="outline" className="capitalize">{mission.state}</Badge>
              <Link href={`/missions/${mission.id}`} className="text-sm text-brand hover:underline">
                View mission →
              </Link>
            </>
          ) : (
            <p className="text-caption">No life mission linked. Owner can define one on the dashboard.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-brand" aria-hidden />
            <h3 className="text-sm font-medium text-fg-muted">Milestones</h3>
          </div>
          {milestones.length === 0 ? (
            <p className="text-caption">No milestones yet. Add them from project settings or ask the owner.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className={`text-sm font-medium ${m.completedAt ? "text-fg-muted line-through" : "text-fg-primary"}`}>
                      {m.title}
                    </p>
                    {m.targetDate && (
                      <p className="text-micro text-fg-faint">
                        Target {new Date(m.targetDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {m.completedAt && <Badge variant="success">Done</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
