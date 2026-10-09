import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  member: vi.fn(),
  impact: vi.fn(),
  revalidate: vi.fn(),
  notify: vi.fn(),
  mutationResult: { data: { id: "item-1" } as { id: string } | null, error: null as { message: string } | null },
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
vi.mock("@/lib/auth/session", () => ({ requireProfile: async () => ({ id: "member-1" }) }));
vi.mock("@/lib/actions/_shared", () => ({
  requireProjectMember: mocks.member,
  revalidateProject: mocks.revalidate,
}));
vi.mock("@/engines/impact/record-action.server", () => ({ recordImpactAction: mocks.impact }));
vi.mock("@/lib/supabase/notify", () => ({ createNotification: mocks.notify }));

import {
  completeProjectMilestone,
  updateProjectGoalProgress,
  updateProjectTask,
} from "@/lib/actions/project-workspace";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue(null);
  mocks.mutationResult = { data: { id: "item-1" }, error: null };
  mocks.from.mockImplementation(() => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      single: vi.fn(async () => ({ data: { project_id: "project-1", title: "Ship prototype", progress_percent: 75 } })),
      maybeSingle: vi.fn(async () => mocks.mutationResult),
      update: mocks.update.mockImplementation(() => query),
      insert: mocks.insert.mockResolvedValue({ error: null }),
    };
    return query;
  });
});

const completionActions = [
  { name: "milestone", run: () => completeProjectMilestone("item-1"), event: "project_milestone_completed", missing: "Milestone could not be updated" },
  { name: "goal", run: () => updateProjectGoalProgress("item-1", 100), event: "project_goal_completed", missing: "Goal could not be updated" },
];

for (const action of completionActions) {
  describe(`${action.name} completion persistence`, () => {
    it("does not report success or award impact when persistence fails", async () => {
      mocks.mutationResult = { data: null, error: { message: "Database unavailable" } };
      expect(await action.run()).toEqual({ error: "Database unavailable" });
      expect(mocks.insert).not.toHaveBeenCalled();
      expect(mocks.impact).not.toHaveBeenCalled();
      expect(mocks.revalidate).not.toHaveBeenCalled();
    });

    it("does not report completion when the update returns no row", async () => {
      mocks.mutationResult = { data: null, error: null };
      expect(await action.run()).toEqual({ error: action.missing });
      expect(mocks.insert).not.toHaveBeenCalled();
      expect(mocks.impact).not.toHaveBeenCalled();
      expect(mocks.revalidate).not.toHaveBeenCalled();
    });

    it("preserves the membership prerequisite", async () => {
      mocks.member.mockResolvedValue({ error: "You must be a project member" });
      expect(await action.run()).toEqual({ error: "You must be a project member" });
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.impact).not.toHaveBeenCalled();
    });

    it("records completion only after the row has been persisted", async () => {
      expect(await action.run()).toEqual({});
      expect(mocks.impact).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: action.event }));
      expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.insert.mock.invocationCallOrder[0]);
      expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.impact.mock.invocationCallOrder[0]);
      expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
    });
  });
}

it("keeps partial goal progress free of completion events", async () => {
  expect(await updateProjectGoalProgress("item-1", 50)).toEqual({});
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ progress_percent: 50, status: "active", completed_at: null }));
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.impact).not.toHaveBeenCalled();
  expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
});

it("recalculates project progress when a completed task is reopened", async () => {
  let countQuery = 0;
  mocks.from.mockImplementation((table: string) => {
    let isCount = false;
    const query = {
      select: vi.fn((_columns?: string, options?: { count?: string; head?: boolean }) => {
        isCount = options?.count === "exact";
        return query;
      }),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: { user_id: "member-1" }, error: null })),
      single: vi.fn(async () => table === "project_tasks"
        ? { data: { project_id: "project-1", title: "Ship prototype", status: "done", assignee_id: "member-1" } }
        : { data: { owner_id: "member-1" } }),
      update: mocks.update.mockImplementation(() => query),
      insert: mocks.insert.mockResolvedValue({ error: null }),
      then: (resolve: (value: { count?: number; error: null }) => void) => {
        if (isCount) {
          countQuery += 1;
          resolve({ count: countQuery === 1 ? 4 : 2, error: null });
        } else {
          resolve({ error: null });
        }
      },
    };
    return query;
  });

  expect(await updateProjectTask("task-1", { status: "review" })).toEqual({});
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "review", completed_at: null }));
  expect(mocks.update).toHaveBeenCalledWith({ progress: 50 });
  expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
});

function mockTaskReopenWithAggregateResults({
  countResults = [
    { count: 4, error: null },
    { count: 2, error: null },
  ],
  progressError = null,
}: {
  countResults?: Array<{ count: number | null; error: { message: string } | null }>;
  progressError?: { message: string } | null;
}) {
  let countQuery = 0;

  mocks.from.mockImplementation((table: string) => {
    let isCount = false;
    const query = {
      select: vi.fn((_columns?: string, options?: { count?: string; head?: boolean }) => {
        isCount = options?.count === "exact";
        return query;
      }),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: { user_id: "member-1" }, error: null })),
      single: vi.fn(async () => table === "project_tasks"
        ? { data: { project_id: "project-1", title: "Ship prototype", status: "done", assignee_id: "member-1" } }
        : { data: { owner_id: "member-1" } }),
      update: mocks.update.mockImplementation(() => query),
      insert: mocks.insert.mockResolvedValue({ error: null }),
      then: (resolve: (value: { count?: number | null; error: { message: string } | null }) => void) => {
        if (isCount) {
          resolve(countResults[countQuery++] ?? { count: null, error: null });
        } else {
          resolve({ error: table === "projects" ? progressError : null });
        }
      },
    };
    return query;
  });
}

it.each([
  {
    name: "total task count",
    countResults: [
      { count: null, error: { message: "Total count unavailable" } },
      { count: 2, error: null },
    ],
    message: "Task saved, but project progress could not be recalculated: Total count unavailable",
  },
  {
    name: "completed task count",
    countResults: [
      { count: 4, error: null },
      { count: null, error: { message: "Completed count unavailable" } },
    ],
    message: "Task saved, but project progress could not be recalculated: Completed count unavailable",
  },
])("reports a $name warning without writing aggregate progress", async ({ countResults, message }) => {
  mockTaskReopenWithAggregateResults({ countResults });

  expect(await updateProjectTask("task-1", { status: "review" })).toEqual({ warning: message });
  expect(mocks.update).not.toHaveBeenCalledWith(expect.objectContaining({ progress: expect.any(Number) }));
  expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
});

it("reports a project progress write failure after preserving the task change", async () => {
  mockTaskReopenWithAggregateResults({ progressError: { message: "Project update unavailable" } });

  expect(await updateProjectTask("task-1", { status: "review" })).toEqual({
    warning: "Task saved, but project progress could not be updated: Project update unavailable",
  });
  expect(mocks.update).toHaveBeenCalledWith({ progress: 50 });
  expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
});

function mockTaskCompletionPersistence(result: typeof mocks.mutationResult) {
  let countQuery = 0;
  mocks.from.mockImplementation((table: string) => {
    let isCount = false;
    const query = {
      select: vi.fn((_columns?: string, options?: { count?: string }) => {
        isCount = options?.count === "exact";
        return query;
      }),
      eq: vi.fn(() => query),
      neq: vi.fn(() => query),
      single: vi.fn(async () => table === "project_tasks"
        ? { data: { project_id: "project-1", title: "Ship prototype", status: "review", assignee_id: "member-2" } }
        : { data: { owner_id: "member-1" } }),
      maybeSingle: vi.fn(async () => result),
      update: mocks.update.mockImplementation(() => query),
      insert: mocks.insert.mockResolvedValue({ error: null }),
      then: (resolve: (value: { count?: number; error: null }) => void) => {
        if (isCount) {
          countQuery += 1;
          resolve({ count: countQuery === 1 ? 4 : 3, error: null });
        } else resolve({ error: null });
      },
    };
    return query;
  });
  return { getCountQueries: () => countQuery };
}

it.each([
  { name: "database error", result: { data: null, error: { message: "Task update unavailable" } }, message: "Task update unavailable" },
  { name: "zero-row update", result: { data: null, error: null }, message: "Task could not be updated" },
])("stops task completion after a $name without recording any success", async ({ result, message }) => {
  const queries = mockTaskCompletionPersistence(result);
  expect(await updateProjectTask("task-1", { status: "done" })).toEqual({ error: message });
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.impact).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
  expect(queries.getCountQueries()).toBe(0);
  expect(mocks.notify).not.toHaveBeenCalled();
});

it("records task completion and aggregate progress after persistence", async () => {
  const queries = mockTaskCompletionPersistence({ data: { id: "task-1" }, error: null });
  expect(await updateProjectTask("task-1", { status: "done" })).toEqual({});
  expect(mocks.impact).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: "project_task_completed", userId: "member-2" }));
  expect(mocks.update).toHaveBeenCalledWith({ progress: 75 });
  expect(queries.getCountQueries()).toBe(2);
  expect(mocks.notify).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: "member-2", title: "Contribution approved" }));
  expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
});
