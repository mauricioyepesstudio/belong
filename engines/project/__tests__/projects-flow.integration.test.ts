/**
 * Integration test for Sprint 2B project workspace flows.
 * Uses real Supabase with anon key auth.
 *
 * Requires two existing accounts. This suite never creates auth users.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database.types";
import { slugify } from "@/lib/supabase/notify";
import {
  fetchDiscoverProjectsInCommunities,
  fetchProjectDetail,
  getAllProjectsForUser,
} from "@/lib/core/projects";
import { ensureDefaultOrganization } from "@/lib/core/organizations";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const configured = Boolean(
  url &&
    anonKey &&
    process.env.E2E_TEST_EMAIL &&
    process.env.E2E_TEST_EMAIL_2 &&
    process.env.E2E_TEST_PASSWORD
);

const describeIf = configured ? describe : describe.skip;

describeIf("Project workspace flow (Supabase)", () => {
  const runId = Date.now().toString(36);
  const ownerEmail = process.env.E2E_TEST_EMAIL ?? "";
  const memberEmail = process.env.E2E_TEST_EMAIL_2 ?? "";
  const password = process.env.E2E_TEST_PASSWORD ?? "";
  const communityName = `E2E Project Community ${runId}`;
  const projectName = `E2E Project ${runId}`;

  let ownerId: string;
  let memberId: string;
  let organizationId: string;
  let communityId: string;
  let projectId: string;
  let postId: string;
  let taskId: string;
  let goalId: string;

  function anonClient() {
    return createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async function signInExistingUser(email: string) {
    const client = anonClient();
    const { error, data } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new Error(
        `Could not sign in to the existing BELONG test account ${email}: ${error?.message ?? "user missing"}`
      );
    }
    return { client, userId: data.user.id };
  }

  beforeAll(async () => {
    const owner = await signInExistingUser(ownerEmail);
    ownerId = owner.userId;
    organizationId = await ensureDefaultOrganization(
      owner.client,
      ownerId,
      "E2E Project Owner"
    );

    const { data: community, error: communityError } = await owner.client
      .from("communities")
      .insert({
        name: communityName,
        slug: slugify(communityName),
        description: "E2E project test community",
        owner_id: ownerId,
        organization_id: organizationId,
      })
      .select("id")
      .single();
    if (communityError) throw communityError;
    communityId = community.id;

    await owner.client.from("community_members").insert({
      community_id: communityId,
      user_id: ownerId,
      role: "owner",
    });

    const { data: project, error: projectError } = await owner.client
      .from("projects")
      .insert({
        name: projectName,
        description: "E2E test project",
        owner_id: ownerId,
        community_id: communityId,
        organization_id: organizationId,
        status: "planning",
        progress: 0,
      })
      .select("id")
      .single();
    if (projectError) throw projectError;
    projectId = project.id;

    await owner.client.from("project_members").insert({
      project_id: projectId,
      user_id: ownerId,
      role: "owner",
    });
  }, 60000);

  afterAll(async () => {
    if (!projectId) return;
    const { client } = await signInExistingUser(ownerEmail);
    if (postId) {
      await client.from("project_post_comments").delete().eq("post_id", postId);
      await client.from("project_post_likes").delete().eq("post_id", postId);
      await client.from("project_posts").delete().eq("id", postId);
    }
    if (taskId) {
      await client.from("project_tasks").delete().eq("id", taskId).eq("project_id", projectId);
    }
    if (goalId) {
      await client.from("project_goals").delete().eq("id", goalId).eq("project_id", projectId);
    }
    if (projectId) {
      await client.from("project_members").delete().eq("project_id", projectId);
      await client.from("projects").delete().eq("id", projectId);
    }
    if (communityId) {
      await client.from("community_members").delete().eq("community_id", communityId);
      await client.from("communities").delete().eq("id", communityId);
    }
  });

  it("loads project detail with owner membership", async () => {
    const { client } = await signInExistingUser(ownerEmail);
    const detail = await fetchProjectDetail(client, projectId, ownerId);
    expect(detail).not.toBeNull();
    expect(detail!.project.name).toBe(projectName);
    expect(detail!.community.id).toBe(communityId);
    expect(detail!.membership?.role).toBe("owner");
    expect(detail!.members.length).toBeGreaterThan(0);
  });

  it("lists project for owner and supports activity feed", async () => {
    const { client } = await signInExistingUser(ownerEmail);
    const { data: post, error } = await client
      .from("project_posts")
      .insert({
        project_id: projectId,
        author_id: ownerId,
        content: "E2E integration post",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    postId = post!.id;

    const detail = await fetchProjectDetail(client, projectId, ownerId);
    expect(detail!.posts.length).toBeGreaterThan(0);
    expect(detail!.posts[0].content).toBe("E2E integration post");
  });

  it("creates task and goal rows and reads back the persisted values", async () => {
    const { client } = await signInExistingUser(ownerEmail);
    const { data: task, error: taskError } = await client
      .from("project_tasks")
      .insert({
        project_id: projectId,
        creator_id: ownerId,
        title: `Acceptance task ${runId}`,
        status: "todo",
      })
      .select("id, title, status")
      .single();
    expect(taskError).toBeNull();
    expect(task).toMatchObject({ title: `Acceptance task ${runId}`, status: "todo" });
    taskId = task!.id;

    const { data: goal, error: goalError } = await client
      .from("project_goals")
      .insert({
        project_id: projectId,
        creator_id: ownerId,
        title: `Acceptance goal ${runId}`,
        progress_percent: 0,
        status: "active",
      })
      .select("id, title, progress_percent, status")
      .single();
    expect(goalError).toBeNull();
    expect(goal).toMatchObject({
      title: `Acceptance goal ${runId}`,
      progress_percent: 0,
      status: "active",
    });
    goalId = goal!.id;
  });

  it("denies project work to the second account before membership", async () => {
    const member = await signInExistingUser(memberEmail);
    memberId = member.userId;

    const { data: hiddenTasks, error: taskReadError } = await member.client
      .from("project_tasks")
      .select("id")
      .eq("id", taskId);
    const { data: hiddenGoals, error: goalReadError } = await member.client
      .from("project_goals")
      .select("id")
      .eq("id", goalId);
    expect(taskReadError).toBeNull();
    expect(goalReadError).toBeNull();
    expect(hiddenTasks).toEqual([]);
    expect(hiddenGoals).toEqual([]);

    const { data: changedTasks, error: taskWriteError } = await member.client
      .from("project_tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId)
      .select("id");
    const { data: changedGoals, error: goalWriteError } = await member.client
      .from("project_goals")
      .update({ progress_percent: 25 })
      .eq("id", goalId)
      .select("id");
    expect(taskWriteError).toBeNull();
    expect(goalWriteError).toBeNull();
    expect(changedTasks).toEqual([]);
    expect(changedGoals).toEqual([]);
  });

  it("allows community member to join and discover projects", async () => {
    const member = await signInExistingUser(memberEmail);
    memberId = member.userId;

    await member.client.from("community_members").insert({
      community_id: communityId,
      user_id: memberId,
      role: "member",
    });

    const discover = await fetchDiscoverProjectsInCommunities(member.client, memberId);
    expect(discover.some((p) => p.id === projectId)).toBe(true);

    const { error: joinError } = await member.client.from("project_members").insert({
      project_id: projectId,
      user_id: memberId,
      role: "member",
    });
    expect(joinError).toBeNull();

    const mine = await getAllProjectsForUser(member.client, memberId);
    expect(mine.some((p) => p.id === projectId)).toBe(true);

    const discoverAfter = await fetchDiscoverProjectsInCommunities(member.client, memberId);
    expect(discoverAfter.some((p) => p.id === projectId)).toBe(false);
  }, 60000);

  it("persists progress and resolves concurrent conditional writes with CAS", async () => {
    const member = await signInExistingUser(memberEmail);
    const contender = await signInExistingUser(memberEmail);

    const taskWrites = await Promise.all([
      member.client
        .from("project_tasks")
        .update({ status: "in_progress" })
        .eq("id", taskId)
        .eq("status", "todo")
        .select("id, status"),
      contender.client
        .from("project_tasks")
        .update({ status: "review" })
        .eq("id", taskId)
        .eq("status", "todo")
        .select("id, status"),
    ]);
    expect(taskWrites.map(({ error }) => error)).toEqual([null, null]);
    const confirmedTaskWrites = taskWrites.flatMap(({ data }) => data ?? []);
    expect(confirmedTaskWrites).toHaveLength(1);
    expect(["in_progress", "review"]).toContain(confirmedTaskWrites[0].status);

    const goalWrites = await Promise.all([
      member.client
        .from("project_goals")
        .update({ progress_percent: 50 })
        .eq("id", goalId)
        .eq("progress_percent", 0)
        .select("id, progress_percent"),
      contender.client
        .from("project_goals")
        .update({ progress_percent: 75 })
        .eq("id", goalId)
        .eq("progress_percent", 0)
        .select("id, progress_percent"),
    ]);
    expect(goalWrites.map(({ error }) => error)).toEqual([null, null]);
    const confirmedGoalWrites = goalWrites.flatMap(({ data }) => data ?? []);
    expect(confirmedGoalWrites).toHaveLength(1);
    expect([50, 75]).toContain(confirmedGoalWrites[0].progress_percent);

    const { data: savedTask } = await member.client
      .from("project_tasks")
      .select("status")
      .eq("id", taskId)
      .single();
    const { data: savedGoal } = await member.client
      .from("project_goals")
      .select("progress_percent")
      .eq("id", goalId)
      .single();
    expect(savedTask?.status).toBe(confirmedTaskWrites[0].status);
    expect(savedGoal?.progress_percent).toBe(
      confirmedGoalWrites[0].progress_percent
    );
  });
});
