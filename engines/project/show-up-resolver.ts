import type { ShowUpAction } from "@/types/show-up";
import type { ProjectTask } from "@/lib/core/project-workspace";

export function resolveProjectTaskAction(task: ProjectTask, canApproveWork: boolean): ShowUpAction {
  if (task.status === "done") {
    return {
      kind: "CONTRIBUTE",
      label: "Completed",
      state: "COMPLETED",
      intent: "View completed work",
      subjectType: "ProjectTask",
      subjectId: task.id,
      disabledReason: "Task already completed",
    };
  }

  if (task.status === "review" && canApproveWork) {
    return {
      kind: "COLLABORATE",
      label: "Approve work",
      state: "AVAILABLE",
      intent: "Approve task contribution",
      subjectType: "ProjectTask",
      subjectId: task.id,
    };
  }

  if (!task.assigneeId) {
    return {
      kind: "HELP",
      label: "I can help",
      state: "AVAILABLE",
      intent: "Claim task",
      subjectType: "ProjectTask",
      subjectId: task.id,
    };
  }

  return {
    kind: "COLLABORATE",
    label: "Assigned",
    state: "ACTIVE",
    intent: "Task in progress",
    subjectType: "ProjectTask",
    subjectId: task.id,
    disabledReason: "Already assigned",
  };
}
