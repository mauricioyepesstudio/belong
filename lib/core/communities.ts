import type {
  Community,
  CommunityMemberRole,
  CommunityPost,
  CommunityPostComment,
  UserProfile,
} from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type UserCommunity = Community & {
  role: CommunityMemberRole;
  memberCount: number;
  joinedAt: string;
};

export type DiscoverCommunity = Community & {
  memberCount: number;
};

export type CommunityMember = {
  id: string;
  userId: string;
  role: CommunityMemberRole;
  joinedAt: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type CommunityPostAuthor = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type CommunityPostWithMeta = CommunityPost & {
  author: CommunityPostAuthor;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  comments: CommunityCommentWithAuthor[];
};

export type CommunityCommentWithAuthor = CommunityPostComment & {
  author: CommunityPostAuthor;
};

export type CommunityDetail = {
  community: Community;
  memberCount: number;
  membership: { role: CommunityMemberRole; joinedAt: string } | null;
  members: CommunityMember[];
  posts: CommunityPostWithMeta[];
  owner: Pick<UserProfile, "id" | "full_name" | "avatar_url"> | null;
};

export async function joinMembershipsWithCommunities(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<UserCommunity[]> {
  let query = supabase
    .from("community_members")
    .select("role, community_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: memberships } = await query;
  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.community_id);
  const [{ data: communities }, { data: allMembers }] = await Promise.all([
    supabase.from("communities").select("*").in("id", ids),
    supabase.from("community_members").select("community_id").in("community_id", ids),
  ]);

  if (!communities) return [];

  const memberCounts = countByCommunityId(allMembers ?? []);

  return memberships
    .map((m) => {
      const community = communities.find((c) => c.id === m.community_id);
      if (!community) return null;
      return {
        ...community,
        role: m.role,
        memberCount: memberCounts.get(m.community_id) ?? 1,
        joinedAt: m.joined_at,
      };
    })
    .filter((c): c is UserCommunity => c !== null);
}

export async function fetchDiscoverCommunities(
  supabase: SupabaseServerClient,
  options?: { search?: string; limit?: number }
): Promise<DiscoverCommunity[]> {
  const limit = options?.limit ?? 48;
  let query = supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  const search = options?.search?.trim();
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tag.ilike.%${search}%`);
  }

  const { data: communities } = await query;
  if (!communities?.length) return [];

  const ids = communities.map((c) => c.id);
  const { data: members } = await supabase
    .from("community_members")
    .select("community_id")
    .in("community_id", ids);

  const memberCounts = countByCommunityId(members ?? []);

  return communities.map((c) => ({
    ...c,
    memberCount: memberCounts.get(c.id) ?? 0,
  }));
}

export async function fetchCommunityBySlug(
  supabase: SupabaseServerClient,
  slug: string
): Promise<Community | null> {
  const { data } = await supabase.from("communities").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function fetchCommunityMembership(
  supabase: SupabaseServerClient,
  communityId: string,
  userId: string
): Promise<{ role: CommunityMemberRole; joinedAt: string } | null> {
  const { data } = await supabase
    .from("community_members")
    .select("role, joined_at")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role, joinedAt: data.joined_at };
}

export async function fetchCommunityMembers(
  supabase: SupabaseServerClient,
  communityId: string,
  limit = 50
): Promise<CommunityMember[]> {
  const { data: memberships } = await supabase
    .from("community_members")
    .select("id, user_id, role, joined_at")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: true })
    .limit(limit);

  if (!memberships?.length) return [];

  const userIds = memberships.map((m) => m.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, bio")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return memberships.map((m) => {
    const user = userMap.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      fullName: user?.full_name ?? null,
      avatarUrl: user?.avatar_url ?? null,
      bio: user?.bio ?? null,
    };
  });
}

export async function fetchCommunityMemberCount(
  supabase: SupabaseServerClient,
  communityId: string
): Promise<number> {
  const { count } = await supabase
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId);

  return count ?? 0;
}

export async function fetchCommunityPosts(
  supabase: SupabaseServerClient,
  communityId: string,
  currentUserId: string | null,
  limit = 30
): Promise<CommunityPostWithMeta[]> {
  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [{ data: authors }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from("users").select("id, full_name, avatar_url").in("id", authorIds),
    supabase.from("community_post_likes").select("post_id, user_id").in("post_id", postIds),
    supabase
      .from("community_post_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
  ]);

  const authorMap = new Map(
    (authors ?? []).map((a) => [
      a.id,
      { id: a.id, fullName: a.full_name, avatarUrl: a.avatar_url },
    ])
  );

  const likeCounts = new Map<string, number>();
  const likedByUser = new Set<string>();
  for (const like of likes ?? []) {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
    if (currentUserId && like.user_id === currentUserId) {
      likedByUser.add(like.post_id);
    }
  }

  const commentAuthorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
  const missingAuthorIds = commentAuthorIds.filter((id) => !authorMap.has(id));
  if (missingAuthorIds.length) {
    const { data: commentAuthors } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", missingAuthorIds);
    for (const a of commentAuthors ?? []) {
      authorMap.set(a.id, { id: a.id, fullName: a.full_name, avatarUrl: a.avatar_url });
    }
  }

  const commentsByPost = new Map<string, CommunityCommentWithAuthor[]>();
  for (const comment of comments ?? []) {
    const author = authorMap.get(comment.author_id) ?? {
      id: comment.author_id,
      fullName: null,
      avatarUrl: null,
    };
    const list = commentsByPost.get(comment.post_id) ?? [];
    list.push({ ...comment, author });
    commentsByPost.set(comment.post_id, list);
  }

  return posts.map((post) => ({
    ...post,
    author: authorMap.get(post.author_id) ?? {
      id: post.author_id,
      fullName: null,
      avatarUrl: null,
    },
    likeCount: likeCounts.get(post.id) ?? 0,
    commentCount: commentsByPost.get(post.id)?.length ?? 0,
    likedByCurrentUser: likedByUser.has(post.id),
    comments: commentsByPost.get(post.id) ?? [],
  }));
}

export async function fetchCommunityDetail(
  supabase: SupabaseServerClient,
  slug: string,
  currentUserId: string | null
): Promise<CommunityDetail | null> {
  const community = await fetchCommunityBySlug(supabase, slug);
  if (!community) return null;

  const [memberCount, membership, members, posts, ownerResult] = await Promise.all([
    fetchCommunityMemberCount(supabase, community.id),
    currentUserId
      ? fetchCommunityMembership(supabase, community.id, currentUserId)
      : Promise.resolve(null),
    fetchCommunityMembers(supabase, community.id),
    fetchCommunityPosts(supabase, community.id, currentUserId),
    supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .eq("id", community.owner_id)
      .maybeSingle(),
  ]);

  return {
    community,
    memberCount,
    membership,
    members,
    posts,
    owner: ownerResult.data,
  };
}

function countByCommunityId(rows: { community_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.community_id, (counts.get(row.community_id) ?? 0) + 1);
  }
  return counts;
}
