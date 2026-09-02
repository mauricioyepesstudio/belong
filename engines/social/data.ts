import type { SupabaseServerClient } from "@/lib/core/types";
import type { Database } from "@/types/database.types";
import { resolveConnectionState } from "@/lib/core/connection-state";
import {
  decodeGlobalSocialFeedCursor,
  decodeSocialFeedCursor,
  encodeGlobalSocialFeedCursor,
  encodeSocialFeedCursor,
} from "./pagination";
import {
  SOCIAL_FEED_DEFAULT_LIMIT,
  SOCIAL_FEED_MAX_LIMIT,
  type SocialFeedPage,
  type SocialPost,
} from "./types";

type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

type FeedOptions = {
  limit?: number;
  cursor?: string | null;
};

function normalizedLimit(limit?: number): number {
  if (!limit || limit < 1) return SOCIAL_FEED_DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), SOCIAL_FEED_MAX_LIMIT);
}

function connectionRowsForUser(
  rows: Array<{ id: string; requester_id: string; recipient_id: string; status: string }>,
  viewerId: string,
  otherUserId: string
) {
  return rows.filter(
    (row) =>
      (row.requester_id === viewerId && row.recipient_id === otherUserId) ||
      (row.recipient_id === viewerId && row.requester_id === otherUserId)
  );
}

async function hydrateSocialPosts(
  supabase: SupabaseServerClient,
  rows: SocialPostRow[],
  viewerId: string
): Promise<SocialPost[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((row) => row.id);
  const mediaPaths = [
    ...new Set(rows.flatMap((row) => row.media_path ? [row.media_path] : [])),
  ];
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const communityIds = [...new Set(rows.flatMap((row) => row.community_id ? [row.community_id] : []))];
  const projectIds = [...new Set(rows.flatMap((row) => row.project_id ? [row.project_id] : []))];

  const [{ data: authors }, { data: reactions }, { data: comments }, communities, projects, { data: connections }, signedMedia] =
    await Promise.all([
      supabase.from("users").select("id, full_name, avatar_url, role").in("id", authorIds),
      supabase.from("social_post_reactions").select("post_id, user_id").in("post_id", postIds),
      supabase
        .from("social_post_comments")
        .select("id, post_id, author_id, content, created_at, updated_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      communityIds.length
        ? supabase.from("communities").select("id, name, slug").in("id", communityIds)
        : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
      projectIds.length
        ? supabase.from("projects").select("id, name").in("id", projectIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      supabase
        .from("connections")
        .select("id, requester_id, recipient_id, status")
        .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
      mediaPaths.length
        ? supabase.storage.from("post-media").createSignedUrls(mediaPaths, 60 * 60)
        : Promise.resolve({ data: [], error: null }),
    ]);
  const signedMediaMap = new Map(
    (signedMedia.data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );

  const commentAuthorIds = [...new Set((comments ?? []).map((comment) => comment.author_id))];
  const missingAuthorIds = commentAuthorIds.filter((id) => !authorIds.includes(id));
  const { data: commentAuthors } = missingAuthorIds.length
    ? await supabase.from("users").select("id, full_name, avatar_url, role").in("id", missingAuthorIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null; role: string | null }[] };
  const authorMap = new Map(
    [...(authors ?? []), ...(commentAuthors ?? [])].map((author) => [author.id, author])
  );
  const communityMap = new Map((communities.data ?? []).map((community) => [community.id, community]));
  const projectMap = new Map((projects.data ?? []).map((project) => [project.id, project]));
  const supportCounts = new Map<string, number>();
  const supported = new Set<string>();
  for (const reaction of reactions ?? []) {
    supportCounts.set(reaction.post_id, (supportCounts.get(reaction.post_id) ?? 0) + 1);
    if (reaction.user_id === viewerId) supported.add(reaction.post_id);
  }
  const commentCounts = new Map<string, number>();
  const commentsByPost = new Map<string, SocialPost["comments"]>();
  for (const comment of comments ?? []) {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
    const author = authorMap.get(comment.author_id);
    const items = commentsByPost.get(comment.post_id) ?? [];
    items.push({
      id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        id: comment.author_id,
        fullName: author?.full_name ?? "Builder",
        avatarUrl: author?.avatar_url ?? null,
        role: author?.role ?? null,
        connectionState: resolveConnectionState(
          viewerId,
          connectionRowsForUser(connections ?? [], viewerId, comment.author_id)
        ),
      },
    });
    commentsByPost.set(comment.post_id, items);
  }

  return rows.map((row) => {
    const author = authorMap.get(row.author_id);
    const community = row.community_id ? communityMap.get(row.community_id) : null;
    const project = row.project_id ? projectMap.get(row.project_id) : null;
    return {
      id: row.id,
      type: row.post_type,
      body: row.body,
      mediaUrl:
        (row.media_path ? signedMediaMap.get(row.media_path) : null) ??
        row.media_url,
      mediaPath: row.media_path,
      mediaType: row.media_type,
      mediaMimeType: row.media_mime_type,
      mediaSizeBytes: row.media_size_bytes,
      mediaMetadata: row.media_metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        fullName: author?.full_name ?? "Builder",
        avatarUrl: author?.avatar_url ?? null,
        role: author?.role ?? null,
        connectionState: resolveConnectionState(
          viewerId,
          connectionRowsForUser(connections ?? [], viewerId, row.author_id)
        ),
      },
      context: {
        communityId: row.community_id,
        communityName: community?.name ?? null,
        communitySlug: community?.slug ?? null,
        projectId: row.project_id,
        projectName: project?.name ?? null,
      },
      supportCount: supportCounts.get(row.id) ?? 0,
      commentCount: commentCounts.get(row.id) ?? 0,
      supportedByViewer: supported.has(row.id),
      comments: commentsByPost.get(row.id) ?? [],
    };
  });
}

export async function fetchProfileSocialFeed(
  supabase: SupabaseServerClient,
  profileUserId: string,
  viewerId: string,
  options: FeedOptions = {}
): Promise<SocialFeedPage> {
  const limit = normalizedLimit(options.limit);
  const cursor = decodeSocialFeedCursor(options.cursor);
  let query = supabase
    .from("social_posts")
    .select("*")
    .eq("author_id", profileUserId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const posts = await hydrateSocialPosts(supabase, pageRows, viewerId);
  const last = pageRows.at(-1);
  return {
    posts,
    nextCursor: hasMore && last
      ? encodeSocialFeedCursor({ createdAt: last.created_at, id: last.id })
      : null,
  };
}

export async function fetchSocialPostById(
  supabase: SupabaseServerClient,
  postId: string,
  viewerId: string
): Promise<SocialPost | null> {
  const { data: row, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (error || !row) return null;
  const posts = await hydrateSocialPosts(supabase, [row], viewerId);
  return posts[0] ?? null;
}

export async function fetchGlobalSocialFeed(
  supabase: SupabaseServerClient,
  viewerId: string,
  options: FeedOptions = {}
): Promise<SocialFeedPage> {
  const limit = normalizedLimit(options.limit);
  const cursor = decodeGlobalSocialFeedCursor(options.cursor);

  const [{ data: connections }, { data: communities }, { data: projects }] = await Promise.all([
    supabase
      .from("connections")
      .select("requester_id, recipient_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
    supabase.from("community_members").select("community_id").eq("user_id", viewerId),
    supabase.from("project_members").select("project_id").eq("user_id", viewerId),
  ]);

  const connectionIds = new Set(
    (connections ?? []).map((row) =>
      row.requester_id === viewerId ? row.recipient_id : row.requester_id
    )
  );
  const communityIds = new Set((communities ?? []).map((row) => row.community_id));
  const projectIds = new Set((projects ?? []).map((row) => row.project_id));

  // Bounded over-fetch keeps the query finite while allowing deterministic relevance tiers.
  const fetchLimit = Math.min((limit + 1) * 8, 400);
  let query = supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(fetchLimit);
  if (cursor?.beforeCreatedAt && cursor.beforeId) {
    query = query.or(
      `created_at.lt.${cursor.beforeCreatedAt},and(created_at.eq.${cursor.beforeCreatedAt},id.lt.${cursor.beforeId})`
    );
  }
  const { data, error } = await query;
  if (error) throw error;

  const tier = (post: SocialPostRow): number => {
    if (connectionIds.has(post.author_id)) return 1;
    if (
      (post.community_id && communityIds.has(post.community_id)) ||
      (post.project_id && projectIds.has(post.project_id))
    ) return 2;
    return 3;
  };
  const rows = [...(data ?? [])].sort((a, b) =>
    tier(a) - tier(b) ||
    b.created_at.localeCompare(a.created_at) ||
    b.id.localeCompare(a.id)
  );
  const offset = cursor?.offset ?? 0;
  const pageRows = rows.slice(offset, offset + limit);
  const posts = await hydrateSocialPosts(supabase, pageRows, viewerId);
  const nextOffset = offset + pageRows.length;
  const chronologicalOldest = (data ?? []).at(-1);
  const hasMoreInBatch = nextOffset < rows.length;
  const hasOlderBatch = (data ?? []).length === fetchLimit && chronologicalOldest;
  return {
    posts,
    nextCursor: hasMoreInBatch
      ? encodeGlobalSocialFeedCursor({
          beforeCreatedAt: cursor?.beforeCreatedAt ?? null,
          beforeId: cursor?.beforeId ?? null,
          offset: nextOffset,
        })
      : hasOlderBatch
        ? encodeGlobalSocialFeedCursor({
            beforeCreatedAt: chronologicalOldest.created_at,
            beforeId: chronologicalOldest.id,
            offset: 0,
          })
        : null,
  };
}
