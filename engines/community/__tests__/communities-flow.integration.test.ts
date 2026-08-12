/**
 * End-to-end integration test for Sprint 2A community flows.
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
  fetchCommunityDetail,
  fetchDiscoverCommunities,
  joinMembershipsWithCommunities,
} from "@/lib/core/communities";
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

describeIf("Community creation flow (Supabase)", () => {
  const runId = Date.now().toString(36);
  const user1Email = process.env.E2E_TEST_EMAIL ?? `belong.e2e.owner.${runId}@gmail.com`;
  const user2Email = process.env.E2E_TEST_EMAIL_2 ?? `belong.e2e.member.${runId}@gmail.com`;
  const password = process.env.E2E_TEST_PASSWORD ?? `Test-${runId}!Aa1`;
  const communityName = `E2E Community ${runId}`;

  let user1Id: string;
  let user2Id: string;
  let organizationId: string;
  let communityId: string;
  let communitySlug: string;
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
        `Could not sign in as ${email}. Set E2E_TEST_PASSWORD in .env.local or run: npm run test:community-e2e`
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
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
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
    const u1 = await ensureUser(user1Email, "E2E Owner");
    user1Id = u1.userId;
    organizationId = await ensureDefaultOrganization(
      u1.client,
      user1Id,
      "E2E Owner"
    );

    if (!process.env.E2E_TEST_EMAIL_2 && !process.env.E2E_TEST_EMAIL) {
      const u2 = await ensureUser(user2Email, "E2E Member");
      user2Id = u2.userId;
    } else if (process.env.E2E_TEST_EMAIL_2) {
      const u2 = await ensureUser(user2Email, "E2E Member");
      user2Id = u2.userId;
    } else {
      user2Id = user1Id;
    }
  });

  afterAll(async () => {
    if (!communityId) return;
    const client = anonClient();
    await client.auth.signInWithPassword({ email: user1Email, password });

    await client.from("community_post_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await client.from("community_post_likes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await client.from("community_posts").delete().eq("community_id", communityId);
    await client.from("community_members").delete().eq("community_id", communityId);
    await client.from("communities").delete().eq("id", communityId);
  });

  it("creates a community and saves owner membership in Supabase", async () => {
    const client = anonClient();
    await client.auth.signInWithPassword({ email: user1Email, password });
    communitySlug = slugify(communityName);

    const { data: community, error } = await client
      .from("communities")
      .insert({
        name: communityName,
        slug: communitySlug,
        description: "End-to-end validation community",
        tag: "Testing",
        owner_id: user1Id,
        organization_id: organizationId,
      })
      .select("id, slug")
      .single();

    expect(error).toBeNull();
    expect(community).toBeTruthy();
    communityId = community!.id;
    communitySlug = community!.slug;

    const { error: memberError } = await client.from("community_members").insert({
      community_id: communityId,
      user_id: user1Id,
      role: "owner",
    });

    expect(memberError).toBeNull();

    const { data: membership } = await client
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", user1Id)
      .single();

    expect(membership?.role).toBe("owner");
  });

  it("appears in discover immediately and in joined for the owner", async () => {
    const client = anonClient();

    const discover = await fetchDiscoverCommunities(client, { limit: 100 });
    expect(discover.some((c) => c.id === communityId)).toBe(true);

    const joined = await joinMembershipsWithCommunities(client, user1Id);
    expect(joined.some((c) => c.id === communityId && c.role === "owner")).toBe(true);
  });

  it("supports join and leave for another user", async () => {
    if (user2Id === user1Id) return;

    const client = anonClient();
    await client.auth.signInWithPassword({ email: user2Email, password });

    const { error: joinError } = await client.from("community_members").insert({
      community_id: communityId,
      user_id: user2Id,
      role: "member",
    });
    expect(joinError).toBeNull();

    const { error: leaveError } = await client
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user2Id);
    expect(leaveError).toBeNull();
  });

  it("loads community detail page data", async () => {
    const client = anonClient();
    const detail = await fetchCommunityDetail(client, communitySlug, user1Id);
    expect(detail).toBeTruthy();
    expect(detail!.community.name).toBe(communityName);
    expect(detail!.membership?.role).toBe("owner");
    expect(detail!.members.length).toBeGreaterThanOrEqual(1);
  });

  it("creates posts, comments, and likes", async () => {
    const owner = anonClient();
    await owner.auth.signInWithPassword({ email: user1Email, password });

    const { data: post, error } = await owner
      .from("community_posts")
      .insert({
        community_id: communityId,
        author_id: user1Id,
        content: "Hello from E2E test",
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    postId = post!.id;

    const member = anonClient();
    const memberId = user2Id === user1Id ? user1Id : user2Id;
    const memberEmail = user2Id === user1Id ? user1Email : user2Email;
    await member.auth.signInWithPassword({ email: memberEmail, password });

    if (user2Id !== user1Id) {
      await member.from("community_members").upsert({
        community_id: communityId,
        user_id: user2Id,
        role: "member",
      });
    }

    const { error: likeError } = await member.from("community_post_likes").insert({
      post_id: postId,
      user_id: memberId,
    });
    expect(likeError).toBeNull();

    const { error: commentError } = await member.from("community_post_comments").insert({
      post_id: postId,
      author_id: memberId,
      content: "Great post!",
    });
    expect(commentError).toBeNull();

    const detail = await fetchCommunityDetail(member, communitySlug, memberId);
    const savedPost = detail!.posts.find((p) => p.id === postId);
    expect(savedPost).toBeTruthy();
    expect(savedPost!.likeCount).toBe(1);
    expect(savedPost!.commentCount).toBe(1);
  });
});
