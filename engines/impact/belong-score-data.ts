import type { SupabaseServerClient } from "@/lib/core/types";
import { computeBelongScore, type BelongScoreResult } from "./belong-score";

/**
 * Fetches the raw give/receive activity counts for a user from existing
 * social reaction/comment data and computes their Belong Score v1.
 *
 * Given = reactions/comments the user placed on OTHER people's posts.
 * Received = reactions/comments others placed on the user's OWN posts.
 * Self-interactions (reacting/commenting on your own post) are excluded
 * from both sides.
 */
export async function fetchBelongScoreInputs(
  supabase: SupabaseServerClient,
  userId: string
): Promise<BelongScoreResult> {
  const [{ data: givenReactionRows }, { data: givenCommentRows }, { data: ownPosts }] =
    await Promise.all([
      supabase.from("social_post_reactions").select("post_id").eq("user_id", userId),
      supabase.from("social_post_comments").select("post_id").eq("author_id", userId),
      supabase.from("social_posts").select("id").eq("author_id", userId),
    ]);

  const givenPostIds = [
    ...new Set([
      ...(givenReactionRows ?? []).map((row) => row.post_id),
      ...(givenCommentRows ?? []).map((row) => row.post_id),
    ]),
  ];

  const { data: givenPostAuthors } = givenPostIds.length
    ? await supabase.from("social_posts").select("id, author_id").in("id", givenPostIds)
    : { data: [] as { id: string; author_id: string }[] };

  const authorByPostId = new Map(
    (givenPostAuthors ?? []).map((post) => [post.id, post.author_id])
  );

  const givenReactions = (givenReactionRows ?? []).filter((row) => {
    const authorId = authorByPostId.get(row.post_id);
    return authorId != null && authorId !== userId;
  }).length;

  const givenComments = (givenCommentRows ?? []).filter((row) => {
    const authorId = authorByPostId.get(row.post_id);
    return authorId != null && authorId !== userId;
  }).length;

  const ownPostIds = (ownPosts ?? []).map((post) => post.id);

  const [{ count: receivedReactions }, { count: receivedComments }] = ownPostIds.length
    ? await Promise.all([
        supabase
          .from("social_post_reactions")
          .select("*", { count: "exact", head: true })
          .in("post_id", ownPostIds)
          .neq("user_id", userId),
        supabase
          .from("social_post_comments")
          .select("*", { count: "exact", head: true })
          .in("post_id", ownPostIds)
          .neq("author_id", userId),
      ])
    : [{ count: 0 }, { count: 0 }];

  return computeBelongScore({
    givenReactions,
    givenComments,
    receivedReactions: receivedReactions ?? 0,
    receivedComments: receivedComments ?? 0,
  });
}
