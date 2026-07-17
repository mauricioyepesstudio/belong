/**
 * Integration test for Sprint 2B project workspace flows.
 * Uses real Supabase with anon key auth.
 *
 * Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local to reuse an existing account.
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

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const configured = Boolean(url && anonKey);

const describeIf = configured ? describe : describe.skip;

describeIf("Project workspace flow (Supabase)", () => {
  const runId = Date.now().toString(36);
  const ownerEmail = process.env.E2E_TEST_EMAIL ?? `belong.e2e.project.${runId}@gmail.com`;
  const memberEmail = process.env.E2E_TEST_EMAIL_2 ?? `belong.e2e.project.member.${runId}@gmail.com`;
  const password = process.env.E2E_TEST_PASSWORD ?? `Test-${runId}!Aa1`;
  const communityName = `E2E Project Community ${runId}`;
  const projectName = `E2E Project ${runId}`;

  let ownerId: string;
  let memberId: string;
  let communityId: string;
  let projectId: string;
  let postId: string;

  function anonClient() {
    return createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async function ensureUser(email: string, fullName: string) {
    const client = anonClient();
    const { error: signInError, data: signInData } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (!signInError && signInData.user) {
      return { client, userId: signInData.user.id };
    }

    if (process.env.E2E_TEST_EMAIL) {
      throw new Error(
        `Could not sign in as ${email}. Set E2E_TEST_PASSWORD in .env.local or run: npm run test:project-e2e`
      );
    }

    const { data: signUp, error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) throw signUpError;
    if (!signUp.user) throw new Error("Sign up returned no user");

    if (!signUp.session) {
      const { error: retrySignIn } = await client.auth.signInWithPassword({ email, password });
      if (retrySignIn) throw retrySignIn;
    }

    await client.from("users").upsert({
      id: signUp.user.id,
      email,
      full_name: fullName,
      onboarding_completed: true,
    });

    return { client, userId: signUp.user.id };
  }

  beforeAll(async () => {
    const owner = await ensureUser(ownerEmail, "E2E Project Owner");
    ownerId = owner.userId;

    const { data: community, error: communityError } = await owner.client
      .from("communities")
      .insert({
        name: communityName,
        slug: slugify(communityName),
        description: "E2E project test community",
        owner_id: ownerId,
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
    const client = anonClient();
    if (postId) {
      await client.from("project_post_comments").delete().eq("post_id", postId);
      await client.from("project_post_likes").delete().eq("post_id", postId);
      await client.from("project_posts").delete().eq("id", postId);
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
    const client = anonClient();
    const detail = await fetchProjectDetail(client, projectId, ownerId);
    expect(detail).not.toBeNull();
    expect(detail!.project.name).toBe(projectName);
    expect(detail!.community.id).toBe(communityId);
    expect(detail!.membership?.role).toBe("owner");
    expect(detail!.members.length).toBeGreaterThan(0);
  });

  it("lists project for owner and supports activity feed", async () => {
    const client = anonClient();
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

  it("allows community member to join and discover projects", async () => {
    const member = await ensureUser(memberEmail, "E2E Project Member");
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
});
