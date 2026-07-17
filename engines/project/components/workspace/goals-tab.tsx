"use client";

import type { ProjectGoal } from "@/lib/core/project-workspace";
import { createProjectGoal, updateProjectGoalProgress } from "@/lib/actions/project-workspace";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  ProgressBar,
  useToast,
} from "@/systems/design-system";
import { Target } from "lucide-react";
import { useState, useTransition } from "react";

export function ProjectGoalsTab({
  projectId,
  goals: initialGoals,
  isMember,
}: {
  projectId: string;
  goals: ProjectGoal[];
  isMember: boolean;
}) {
  const { toast } = useToast();
  const [goals, setGoals] = useState(initialGoals);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<"weekly" | "quarterly">("weekly");
  const [isPending, startTransition] = useTransition();

  const weekly = goals.filter((g) => g.goalType === "weekly");
  const quarterly = goals.filter((g) => g.goalType === "quarterly");

  const handleCreate = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createProjectGoal(projectId, { title: title.trim(), goalType });
      if (result.error) toast(result.error, "error");
      else {
        toast("Goal created", "success");
        setTitle("");
        window.location.reload();
      }
    });
  };

  const bumpProgress = (goalId: string, current: number) => {
    const next = Math.min(100, current + 25);
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, progressPercent: next } : g))
    );
    startTransition(async () => {
      const result = await updateProjectGoalProgress(goalId, next);
      if (result.error) toast(result.error, "error");
    });
  };

  const GoalList = ({ items, label }: { items: ProjectGoal[]; label: string }) => (
    <div>
      <h3 className="mb-3 text-sm font-medium text-fg-muted">{label}</h3>
      {items.length === 0 ? (
        <p className="text-caption">No {label.toLowerCase()} yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((g) => (
            <li key={g.id} className="rounded-xl border border-border-subtle p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-fg-primary">{g.title}</p>
                <Badge variant={g.status === "completed" ? "success" : "outline"}>
                  {g.progressPercent}%
                </Badge>
              </div>
              <ProgressBar value={g.progressPercent} className="mt-3" />
              {isMember && g.status !== "completed" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  disabled={isPending}
                  onClick={() => bumpProgress(g.id, g.progressPercent)}
                >
                  +25% progress
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!isMember) {
    return (
      <EmptyState
        icon={Target}
        title="Join to set goals"
        description="Track weekly and quarterly goals for this project."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[180px] flex-1">
            <Label htmlFor="goal-title">New goal</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title"
              disabled={isPending}
            />
          </div>
          <select
            className="rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as "weekly" | "quarterly")}
          >
            <option value="weekly">Weekly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <Button disabled={isPending || !title.trim()} onClick={handleCreate}>
            Add goal
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <GoalList items={weekly} label="Weekly goals" />
        <GoalList items={quarterly} label="Quarter goals" />
      </div>
    </div>
  );
}
