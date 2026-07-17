import type {
  Community,
  Project,
  ProjectPost,
  ProjectPostComment,
  UserProfile,
} from "@/types/database.types";
import type { SupabaseServerClient } from "./types";
import { fetchProjectWorkspaceBundle } from "./project-workspace";

export type ProjectCommunitySummary = Pick<Community, "id" | "name" | "slug">;

export type ProjectWithMemberCount = Project & {
  memberCount: number;
  community: ProjectCommunitySummary | null;
};

export type ProjectMember = {
  key: string;
  userId: string;
  role: string;
  joinedAt: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type ProjectPostAuthor = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type ProjectCommentWithAuthor = ProjectPostComment & {
  author: ProjectPostAuthor;
};

export type ProjectPostWithMeta = ProjectPost & {
  author: ProjectPostAuthor;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
  comments: ProjectCommentWithAuthor[];
};

export type ProjectDetail = {
  project: Project;
  community: ProjectCommunitySummary;
  owner: Pick<UserProfile, "id" | "full_name" | "avatar_url">;
  memberCount: number;
  membership: { role: string; joinedAt: string } | null;
  members: ProjectMember[];
  posts: ProjectPostWithMeta[];
  workspace: Awaited<ReturnType<typeof fetchProjectWorkspaceBundle>>;
};

export async function attachProjectMemberCounts(
  supabase: SupabaseServerClient,
  projects: Project[]
): Promise<ProjectWithMemberCount[]> {
  if (!projects.length) return [];

  const communityIds = [...new Set(projects.map((p) => p.community_id))];
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, slug")
    .in("id", communityIds);

  const communityMap = new Map((communities ?? []).map((c) => [c.id, c]));

  return Promise.all(
    projects.map(async (project) => {
      const { count } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);
      return {
        ...project,
        memberCount: count ?? 0,
        community: communityMap.get(project.community_id) ?? null,
      };
    })
  );
}

export async function getUniqueProjectIds(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Set<string>> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("projects").select("id").eq("owner_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);

  return new Set([
    ...(owned?.map((p) => p.id) ?? []),
    ...(memberships?.map((m) => m.project_id) ?? []),
  ]);
}

export async function getAllProjectsForUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ProjectWithMemberCount[]> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);

  const ownedIds = new Set((owned ?? []).map((p) => p.id));
  const memberIds = (memberships ?? [])
    .map((m) => m.project_id)
    .filter((id) => !ownedIds.has(id));

  let memberProjects: Project[] = [];
  if (memberIds.length) {
    const { data } = await supabase.from("projects").select("*").in("id", memberIds);
    memberProjects = data ?? [];
  }

  const combined = [...(owned ?? []), ...memberProjects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return attachProjectMemberCounts(supabase, combined);
}

export async function fetchDiscoverProjectsInCommunities(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 48
): Promise<ProjectWithMemberCount[]> {
  const { data: communityMemberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);

  if (!communityMemberships?.length) return [];

  const communityIds = communityMemberships.map((m) => m.community_id);
  const userProjectIds = await getUniqueProjectIds(supabase, userId);

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .in("community_id", communityIds)
    .order("updated_at", { ascending: false })
    .limit(limit * 2);

  const discover = (projects ?? []).filter((p) => !userProjectIds.has(p.id)).slice(0, limit);
  return attachProjectMemberCounts(supabase, discover);
}

export async function getActiveProjectsForUser(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<ProjectWithMemberCount[]> {
  const all = await getAllProjectsForUser(supabase, userId);
  const filtered = all.filter((p) => p.status === "active" || p.status === "planning");
  return limit ? filtered.slice(0, limit) : filtered;
}

export async function fetchProjectById(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<Project | null> {
  const { data } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  return data;
}

export async function fetchProjectMembership(
  supabase: SupabaseServerClient,
  projectId: string,
  userId: string
): Promise<{ role: string; joinedAt: string } | null> {
  const { data } = await supabase
    .from("project_members")
    .select("role, joined_at")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return { role: data.role, joinedAt: data.joined_at };
}

export async function fetchProjectMembers(
  supabase: SupabaseServerClient,
  projectId: string,
  limit = 50
): Promise<ProjectMember[]> {
  const { data: memberships } = await supabase
    .from("project_members")
    .select("user_id, role, joined_at")
    .eq("project_id", projectId)
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
      key: `${projectId}-${m.user_id}`,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      fullName: user?.full_name ?? null,
      avatarUrl: user?.avatar_url ?? null,
      bio: user?.bio ?? null,
    };
  });
}

export async function fetchProjectMemberCount(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<number> {
  const { count } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  return count ?? 0;
}

export async function fetchProjectPosts(
  supabase: SupabaseServerClient,
  projectId: string,
  currentUserId: string | null,
  limit = 30
): Promise<ProjectPostWithMeta[]> {
  const { data: posts } = await supabase
    .from("project_posts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [{ data: authors }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from("users").select("id, full_name, avatar_url").in("id", authorIds),
    supabase.from("project_post_likes").select("post_id, user_id").in("post_id", postIds),
    supabase
      .from("project_post_comments")
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

  const commentsByPost = new Map<string, ProjectCommentWithAuthor[]>();
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

export async function fetchProjectDetail(
  supabase: SupabaseServerClient,
  projectId: string,
  currentUserId: string | null
): Promise<ProjectDetail | null> {
  const project = await fetchProjectById(supabase, projectId);
  if (!project) return null;

  const [communityResult, memberCount, membership, members, posts, ownerResult] =
    await Promise.all([
      supabase
        .from("communities")
        .select("id, name, slug")
        .eq("id", project.community_id)
        .maybeSingle(),
      fetchProjectMemberCount(supabase, project.id),
      currentUserId
        ? fetchProjectMembership(supabase, project.id, currentUserId)
        : Promise.resolve(null),
      fetchProjectMembers(supabase, project.id),
      fetchProjectPosts(supabase, project.id, currentUserId),
      supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .eq("id", project.owner_id)
        .maybeSingle(),
    ]);

  if (!communityResult.data || !ownerResult.data) return null;

  const workspace = await fetchProjectWorkspaceBundle(
    supabase,
    project.id,
    project.owner_id,
    project.mission_id ?? null,
    members.map((m) => m.userId),
    project.progress
  );

  return {
    project,
    community: communityResult.data,
    owner: ownerResult.data,
    memberCount,
    membership,
    members,
    posts,
    workspace,
  };
}
