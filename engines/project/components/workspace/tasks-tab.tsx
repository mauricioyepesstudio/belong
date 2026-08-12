"use client";

import type { ProjectTask, ProjectTaskStatus } from "@/lib/core/project-workspace";
import { createProjectTask, moveProjectTask, updateProjectTask } from "@/lib/actions/project-workspace";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  useToast,
} from "@/systems/design-system";
import { CheckCircle2, FolderKanban, Plus, UserCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

const COLUMNS: { id: ProjectTaskStatus; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const priorityVariant: Record<string, "outline" | "warning" | "default" | "brand"> = {
  low: "outline",
  medium: "default",
  high: "warning",
  urgent: "brand",
};

export function ProjectTasksTab({
  projectId,
  tasks: initialTasks,
  isMember,
  currentUserId,
  currentUserName,
  canApproveWork,
  onActivityCommitted,
}: {
  projectId: string;
  tasks: ProjectTask[];
  isMember: boolean;
  currentUserId: string;
  currentUserName: string | null;
  canApproveWork: boolean;
  onActivityCommitted?: () => void;
}) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const syncId = window.setTimeout(() => setTasks(initialTasks), 0);
    return () => window.clearTimeout(syncId);
  }, [initialTasks]);

  const tasksByStatus = (status: ProjectTaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCreate = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createProjectTask(projectId, { title: title.trim() });
      if (result.error) toast(result.error, "error");
      else {
        toast("Task created", "success");
        setTitle("");
        setTasks((prev) => [
          ...prev,
          {
            id: result.taskId!,
            projectId,
            creatorId: "",
            assigneeId: null,
            title: title.trim(),
            description: null,
            status: "todo",
            priority: "medium",
            deadline: null,
            sortOrder: prev.filter((t) => t.status === "todo").length,
            completedAt: null,
            createdAt: new Date().toISOString(),
            assigneeName: null,
            assigneeAvatar: null,
          },
        ]);
      }
    });
  };

  const handleDrop = (status: ProjectTaskStatus, index: number) => {
    if (!draggingId) return;
    const task = tasks.find((t) => t.id === draggingId);
    if (!task || task.status === status && task.sortOrder === index) return;
    if (status === "done" && task.status !== "done" && !canApproveWork) {
      toast("The project owner must approve work before it is completed", "error");
      setDraggingId(null);
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggingId ? { ...t, status, sortOrder: index } : t
      )
    );

    startTransition(async () => {
      const result = await moveProjectTask(draggingId, status, index);
      if (result.error) toast(result.error, "error");
      else onActivityCommitted?.();
    });
    setDraggingId(null);
  };

  const handleApprove = (task: ProjectTask) => {
    const previousTasks = tasks;
    const doneIndex = tasksByStatus("done").length;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, status: "done", sortOrder: doneIndex, completedAt: new Date().toISOString() }
          : item
      )
    );

    startTransition(async () => {
      const result = await moveProjectTask(task.id, "done", doneIndex);
      if (result.error) {
        setTasks(previousTasks);
        toast(result.error, "error");
      } else {
        toast("Contribution approved", "success");
        onActivityCommitted?.();
      }
    });
  };

  const handleClaim = (task: ProjectTask) => {
    const previousTasks = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, assigneeId: currentUserId, assigneeName: currentUserName ?? "You" }
          : item
      )
    );

    startTransition(async () => {
      const result = await updateProjectTask(task.id, { assigneeId: currentUserId });
      if (result.error) {
        setTasks(previousTasks);
        toast(result.error, "error");
      } else {
        toast("Task claimed", "success");
        onActivityCommitted?.();
      }
    });
  };

  if (!isMember) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Join to manage tasks"
        description="Become a project member to create and move tasks on the board."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="new-task">New task</Label>
            <Input
              id="new-task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              disabled={isPending}
            />
          </div>
          <Button disabled={isPending || !title.trim()} onClick={handleCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Add task
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="rounded-2xl border border-border-subtle bg-bg-base/50 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id, tasksByStatus(col.id).length)}
          >
            <p className="mb-3 px-1 text-sm font-semibold text-fg-primary">
              {col.label}
              <span className="ml-2 text-fg-muted">({tasksByStatus(col.id).length})</span>
            </p>
            <div className="space-y-2">
              {tasksByStatus(col.id).map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(col.id, index);
                  }}
                  className="cursor-grab rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-fg-primary">{task.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={priorityVariant[task.priority] ?? "outline"} className="text-micro capitalize">
                      {task.priority}
                    </Badge>
                    {task.deadline && (
                      <span className="text-micro text-fg-faint">
                        Due {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.assigneeName && (
                    <p className="mt-2 text-micro text-fg-muted">
                      {task.assigneeId === currentUserId ? "Assigned to you" : `@${task.assigneeName}`}
                    </p>
                  )}
                  {!task.assigneeId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-7 px-2 text-xs"
                      disabled={isPending}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => handleClaim(task)}
                    >
                      <UserCheck className="h-3.5 w-3.5" aria-hidden />
                      Claim task
                    </Button>
                  )}
                  {task.status === "review" && canApproveWork && (
                    <Button
                      type="button"
                      size="sm"
                      variant="brand"
                      className="mt-2 h-7 px-2 text-xs"
                      disabled={isPending}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => handleApprove(task)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Approve work
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
