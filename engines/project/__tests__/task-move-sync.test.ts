import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { ProjectTask } from "@/lib/core/project-workspace";

// Exercise the actual tab handler with deferred actions, without adding a DOM
// renderer. The saved column must remain visible until the action succeeds.
const harness = vi.hoisted(() => ({
  save: vi.fn(), toast: vi.fn(), setTasks: vi.fn(), committed: vi.fn(),
  tasks: [] as ProjectTask[],
  pending: undefined as Promise<void> | undefined,
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => typeof initial === "function"
    ? [(initial as () => ProjectTask[])(), harness.setTasks]
    : [initial, vi.fn()],
  useEffect: vi.fn(),
  useRef: (initial: unknown) => ({ current: initial }),
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
}));
vi.mock("@/lib/actions/project-workspace", () => ({
  createProjectTask: vi.fn(), moveProjectTask: harness.save, updateProjectTask: vi.fn(),
}));
vi.mock("@/systems/design-system", () => ({
  Badge: "badge", Button: "button", Card: "card", CardContent: "content",
  EmptyState: "empty", Input: "input", Label: "label",
  useToast: () => ({ toast: harness.toast }),
}));

import { ProjectTasksTab } from "../components/workspace/tasks-tab";

type MoveEvent = { target: { value: string } };
function findMove(node: unknown, title: string): (event: MoveEvent) => void {
  if (Array.isArray(node)) {
    for (const child of node) {
      try { return findMove(child, title); } catch { /* inspect the next child */ }
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<{
      "aria-label"?: string; onChange?: (event: MoveEvent) => void; children?: unknown;
    }>).props;
    if (props["aria-label"] === `Move "${title}" to another column` && props.onChange) return props.onChange;
    return findMove(props.children, title);
  }
  throw new Error("Task move control not found");
}

function render(canApproveWork = true) {
  return ProjectTasksTab({
    projectId: "project-1", tasks: harness.tasks, isMember: true,
    currentUserId: "member-1", currentUserName: "Builder", canApproveWork,
    onActivityCommitted: harness.committed,
  });
}
function move(handler: (event: MoveEvent) => void, status = "in_progress") {
  handler({ target: { value: status } });
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.pending = undefined;
  harness.tasks = [{
    id: "task-1", projectId: "project-1", creatorId: "member-1", assigneeId: null,
    title: "Ship prototype", description: null, status: "todo", priority: "medium",
    deadline: null, sortOrder: 0, completedAt: null, createdAt: "2026-10-15T12:00:00Z",
    assigneeName: null, assigneeAvatar: null,
  }];
  harness.setTasks.mockImplementation((update: (tasks: ProjectTask[]) => ProjectTask[]) => {
    harness.tasks = update(harness.tasks);
  });
});

describe("task move confirmation", () => {
  it("keeps the saved column while pending and after a rejected save", async () => {
    let resolve!: (result: { error: string }) => void;
    harness.save.mockReturnValue(new Promise((done) => { resolve = done; }));
    move(findMove(render(), "Ship prototype"));
    expect(harness.save).toHaveBeenCalledWith("task-1", "in_progress", 0);
    expect(harness.tasks[0]).toMatchObject({ status: "todo", sortOrder: 0 });
    expect(harness.setTasks).not.toHaveBeenCalled();
    resolve({ error: "Task could not be updated" });
    await harness.pending;
    expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.committed).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("Task could not be updated", "error");
  });

  it("moves only the confirmed task and refreshes activity after success", async () => {
    harness.tasks.push({ ...harness.tasks[0], id: "task-2", title: "Another task" });
    const untouched = harness.tasks[1];
    harness.save.mockResolvedValue({});
    move(findMove(render(), "Ship prototype"));
    expect(harness.setTasks).not.toHaveBeenCalled();
    await harness.pending;
    expect(harness.tasks[0]).toMatchObject({ status: "in_progress", sortOrder: 0 });
    expect(harness.tasks[1]).toBe(untouched);
    expect(harness.committed).toHaveBeenCalledOnce();
    expect(harness.toast).not.toHaveBeenCalled();
  });

  it("preserves the info warning after a confirmed save", async () => {
    harness.save.mockResolvedValue({ warning: "Project progress could not be updated" });
    move(findMove(render(), "Ship prototype"), "done");
    await harness.pending;
    expect(harness.tasks[0].status).toBe("done");
    expect(harness.toast).toHaveBeenCalledWith("Project progress could not be updated", "info");
    expect(harness.committed).toHaveBeenCalledOnce();
  });

  it("preserves the owner approval guard", () => {
    move(findMove(render(false), "Ship prototype"), "done");
    expect(harness.save).not.toHaveBeenCalled();
    expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("The project owner must approve work before it is completed", "error");
  });

  it("reports a thrown action and permits retry without changing the task", async () => {
    harness.save.mockRejectedValueOnce(new Error("Network unavailable"));
    const handler = findMove(render(), "Ship prototype");
    move(handler);
    await harness.pending;
    expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.committed).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("Task could not be moved. Please try again.", "error");
    harness.save.mockResolvedValue({});
    move(handler);
    await harness.pending;
    expect(harness.tasks[0].status).toBe("in_progress");
    expect(harness.save).toHaveBeenCalledTimes(2);
  });

  it("ignores a second move of the same task until the first settles", async () => {
    let resolve!: (result: object) => void;
    harness.save.mockReturnValue(new Promise((done) => { resolve = done; }));
    const handler = findMove(render(), "Ship prototype");
    move(handler);
    move(handler, "review");
    expect(harness.save).toHaveBeenCalledOnce();
    resolve({});
    await harness.pending;
    expect(harness.tasks[0].status).toBe("in_progress");
  });

  it("releases the task lock after a returned error so the move can be retried", async () => {
    harness.save.mockResolvedValueOnce({ error: "Task could not be updated" });
    const handler = findMove(render(), "Ship prototype");
    move(handler);
    await harness.pending;
    harness.save.mockResolvedValue({});
    move(handler, "review");
    await harness.pending;
    expect(harness.save).toHaveBeenCalledTimes(2);
    expect(harness.tasks[0].status).toBe("review");
    expect(harness.committed).toHaveBeenCalledOnce();
  });

  it("allows independent moves and preserves refreshed fields when actions settle", async () => {
    harness.tasks.push({ ...harness.tasks[0], id: "task-2", title: "Another task" });
    let resolveFirst!: (result: object) => void;
    harness.save.mockReturnValueOnce(new Promise((done) => { resolveFirst = done; }));
    harness.save.mockResolvedValueOnce({});
    const tree = render();
    move(findMove(tree, "Ship prototype"));
    const firstPending = harness.pending;
    move(findMove(tree, "Another task"), "review");
    await harness.pending;
    expect(harness.tasks[1].status).toBe("review");
    harness.tasks = harness.tasks.map((task) => task.id === "task-1"
      ? { ...task, title: "Updated by refresh", assigneeName: "Another builder" }
      : task);
    resolveFirst({});
    await firstPending;
    expect(harness.tasks[0]).toMatchObject({
      title: "Updated by refresh", assigneeName: "Another builder", status: "in_progress",
    });
    expect(harness.tasks[1].status).toBe("review");
    expect(harness.committed).toHaveBeenCalledTimes(2);
  });
});
