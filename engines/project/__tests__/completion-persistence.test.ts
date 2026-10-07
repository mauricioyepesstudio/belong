import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  member: vi.fn(),
  impact: vi.fn(),
  revalidate: vi.fn(),
  mutationResult: { data: { id: "item-1" } as { id: string } | null, error: null as { message: string } | null },
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
vi.mock("@/lib/auth/session", () => ({ requireProfile: async () => ({ id: "member-1" }) }));
vi.mock("@/lib/actions/_shared", () => ({
  requireProjectMember: mocks.member,
  revalidateProject: mocks.revalidate,
}));
vi.mock("@/engines/impact/record-action.server", () => ({ recordImpactAction: mocks.impact }));
vi.mock("@/lib/supabase/notify", () => ({ createNotification: vi.fn() }));

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
