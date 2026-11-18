/**
 * End-to-end integration test for Sprint 2A community flows.
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
  const user1Email = process.env.E2E_TEST_EMAIL ?? "";
  const user2Email = process.env.E2E_TEST_EMAIL_2 ?? "";
  const password = process.env.E2E_TEST_PASSWORD ?? "";
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
    const u1 = await signInExistingUser(user1Email);
    user1Id = u1.userId;
    organizationId = await ensureDefaultOrganization(
      u1.client,
      user1Id,
      "E2E Owner"
    );

    const u2 = await signInExistingUser(user2Email);
    user2Id = u2.userId;
  });

  afterAll(async () => {
    if (!communityId) return;
    const client = anonClient();
    await client.auth.signInWithPassword({ email: user1Email, password });

    if (postId) {
      await client.from("community_post_comments").delete().eq("post_id", postId);
      await client.from("community_post_likes").delete().eq("post_id", postId);
    }
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
    const memberId = user2Id;
    const memberEmail = user2Email;
    await member.auth.signInWithPassword({ email: memberEmail, password });

    await member.from("community_members").upsert({
      community_id: communityId,
      user_id: user2Id,
      role: "member",
    });

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
