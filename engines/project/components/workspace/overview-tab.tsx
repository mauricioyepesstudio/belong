"use client";

import type { ProjectDetail } from "@/lib/core";
import { Badge, Button, Card, CardContent, ProgressBar } from "@/systems/design-system";
import {
  FileUp,
  ListChecks,
  MessageSquare,
  Radio,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";

type ContributionDestination = "activity" | "tasks" | "files" | "discussions";

export function ProjectOverviewTab({
  data,
  isMember,
  onNavigate,
}: {
  data: ProjectDetail;
  isMember: boolean;
  onNavigate: (destination: ContributionDestination) => void;
}) {
  const { project, owner, workspace } = data;
  const { mission, milestones, impactGenerated } = workspace;
  const openTasks = workspace.tasks.filter((task) => task.status !== "done").length;

  const contributionActions = [
    {
      destination: "tasks" as const,
      icon: ListChecks,
      label: openTasks > 0 ? `${openTasks} open task${openTasks === 1 ? "" : "s"}` : "Create the first task",
      detail: "Choose work and move it forward",
    },
    {
      destination: "discussions" as const,
      icon: MessageSquare,
      label: workspace.discussions.length > 0 ? "Join the discussion" : "Start a discussion",
      detail: "Align decisions with the team",
    },
    {
      destination: "activity" as const,
      icon: Radio,
      label: "Share an update",
      detail: "Make progress visible",
    },
    {
      destination: "files" as const,
      icon: FileUp,
      label: workspace.files.length > 0 ? "Open shared files" : "Upload a resource",
      detail: "Contribute an asset or document",
    },
  ];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {isMember && (
        <Card className="relative overflow-hidden border-brand/20 bg-[radial-gradient(circle_at_8%_0%,rgba(139,92,246,0.16),transparent_36%),rgba(255,255,255,0.015)] lg:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/10 blur-3xl" aria-hidden />
          <CardContent className="relative pt-6">
            <div className="max-w-2xl">
              <p className="text-micro font-semibold uppercase tracking-[0.18em] text-brand">Contribution launchpad</p>
              <h3 className="mt-2 text-lg font-semibold text-fg-primary">Move this project forward</h3>
              <p className="mt-1 text-sm text-fg-muted">
                Pick one meaningful action. Every task, discussion, update, and shared resource becomes visible team progress.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {contributionActions.map(({ destination, icon: Icon, label, detail }) => (
                <Button
                  key={destination}
                  type="button"
                  variant="secondary"
                  className="h-auto justify-start gap-3 px-4 py-3 text-left"
                  onClick={() => onNavigate(destination)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-fg-primary">{label}</span>
                    <span className="mt-0.5 block text-micro font-normal text-fg-muted">{detail}</span>
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          <ProgressBar value={project.progress} />
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
              <Link href="/settings?tab=profile" className="text-sm text-brand hover:underline">
                Edit life mission →
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
