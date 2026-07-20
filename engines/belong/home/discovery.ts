import type { SupabaseServerClient } from "@/lib/core/types";
import type { DiscoverCommunity } from "@/engines/core/types";
import type { EventWithMeta } from "@/lib/core/events";
import type { ConnectionSuggestion } from "@/engines/ai/coach-types";
import type { CoachRecommendation } from "@/engines/belong/recommendation";
import type { SmartHomeItem } from "@/engines/belong/creator-os";
import type { Opportunity } from "@/engines/ai/coach-types";
import type { HomeDiscoveryData, TrendingDiscussion, TopContributor } from "./types";

export async function fetchTrendingDiscussions(
  supabase: SupabaseServerClient,
  limit = 5
): Promise<TrendingDiscussion[]> {
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, content, community_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (!posts?.length) return [];

  const communityIds = [...new Set(posts.map((p) => p.community_id))];
  const postIds = posts.map((p) => p.id);

  const [{ data: communities }, { data: commentCounts }] = await Promise.all([
    supabase.from("communities").select("id, name, slug").in("id", communityIds),
    supabase.from("community_post_comments").select("post_id").in("post_id", postIds),
  ]);

  const communityMap = new Map((communities ?? []).map((c) => [c.id, c]));
  const countMap = new Map<string, number>();
  for (const c of commentCounts ?? []) {
    countMap.set(c.post_id, (countMap.get(c.post_id) ?? 0) + 1);
  }

  return posts
    .map((post) => {
      const community = communityMap.get(post.community_id);
      return {
        id: post.id,
        title: post.content.slice(0, 72) + (post.content.length > 72 ? "…" : ""),
        communityName: community?.name ?? "Community",
        href: community?.slug ? `/community/${community.slug}` : "/community",
        replyCount: countMap.get(post.id) ?? 0,
      };
    })
    .sort((a, b) => b.replyCount - a.replyCount)
    .slice(0, limit);
}

export async function fetchTopContributors(
  supabase: SupabaseServerClient,
  limit = 5
): Promise<TopContributor[]> {
  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  const { data: contributions } = await supabase
    .from("community_contributions")
    .select("user_id, points")
    .gte("created_at", weekAgo.toISOString());

  if (!contributions?.length) return [];

  const totals = new Map<string, number>();
  for (const c of contributions) {
    totals.set(c.user_id, (totals.get(c.user_id) ?? 0) + c.points);
  }

  const topIds = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", topIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return topIds.map((id) => {
    const user = userMap.get(id);
    return {
      id,
      name: user?.full_name ?? "Builder",
      avatarUrl: user?.avatar_url ?? null,
      points: totals.get(id) ?? 0,
      href: "/profile",
    };
  });
}

export function buildHomeDiscoveryData(input: {
  trendingDiscussions: TrendingDiscussion[];
  upcomingEvents: EventWithMeta[];
  discoverCommunities: DiscoverCommunity[];
  connectionSuggestions: ConnectionSuggestion[];
  primaryRecommendation: CoachRecommendation;
  smartHome: SmartHomeItem[];
  opportunities: Opportunity[];
  topContributors: TopContributor[];
}): HomeDiscoveryData {
  const aiRecommendations = [
    {
      id: "primary-rec",
      title: input.primaryRecommendation.title,
      description: input.primaryRecommendation.description,
      href: input.primaryRecommendation.actionHref,
      actionLabel: input.primaryRecommendation.actionLabel,
    },
    ...input.smartHome.slice(0, 2).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      actionLabel: item.actionLabel,
    })),
    ...input.opportunities.slice(0, 2).map((opp) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      href: opp.actionHref,
      actionLabel: "Explore",
    })),
  ].slice(0, 4);

  return {
    trendingDiscussions: input.trendingDiscussions,
    upcomingEvents: input.upcomingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.starts_at,
      location: event.location,
      attendeeCount: event.attendeeCount,
      href: "/events",
      registered: event.registered,
    })),
    suggestedCommunities: input.discoverCommunities.slice(0, 4).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      tag: c.tag,
      memberCount: c.memberCount,
      href: `/community/${c.slug}`,
    })),
    suggestedCollaborators: input.connectionSuggestions.slice(0, 4).map((s) => ({
      id: s.id,
      name: s.name,
      reason: s.reason,
      avatarUrl: s.avatarUrl,
      href: s.actionHref,
    })),
    aiRecommendations,
    topContributors: input.topContributors,
  };
}
