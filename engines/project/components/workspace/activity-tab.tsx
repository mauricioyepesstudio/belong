"use client";

import type { ProjectActivityItem } from "@/lib/core/project-workspace";
import { EmptyState, Card, CardContent } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import {
  Activity,
  CheckCircle2,
  FileUp,
  MessageSquare,
  Target,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const activityIcons: Record<string, LucideIcon> = {
  task_created: Target,
  task_completed: CheckCircle2,
  member_joined: UserPlus,
  file_uploaded: FileUp,
  goal_completed: Target,
  milestone_completed: CheckCircle2,
  discussion_started: MessageSquare,
  post_created: MessageSquare,
};

export function ProjectActivityTab({
  activity,
  postsCount,
}: {
  activity: ProjectActivityItem[];
  postsCount: number;
}) {
  if (activity.length === 0 && postsCount === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Tasks, members, files, and goals will appear here as the team works."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {activity.map((item) => {
        const Icon = activityIcons[item.activityType] ?? Activity;
        return (
          <Card key={item.id}>
            <CardContent className="flex items-start gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                <Icon className="h-4 w-4 text-fg-muted" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg-primary">{item.title}</p>
                <p className="mt-0.5 text-caption capitalize">
                  {item.actorName ?? "System"} · {item.activityType.replace(/_/g, " ")} ·{" "}
                  {formatDistanceToNow(item.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
