export type HomeActivityType =
  | "thought"
  | "image"
  | "video"
  | "article"
  | "poll"
  | "project"
  | "event"
  | "collaboration"
  | "opportunity"
  | "community_update"
  | "organization_update"
  | "ai_recommendation";

export type PublishPurpose =
  | "inspire"
  | "learn"
  | "ask"
  | "teach"
  | "collaborate"
  | "build"
  | "celebrate"
  | "support";

export type BelongReaction =
  | "helpful"
  | "inspired"
  | "collaborate"
  | "learned"
  | "count_me_in";

export type HomeActivityAuthor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: string | null;
};

export type HomeActivityReactions = Partial<Record<BelongReaction, number>>;

export type HomeActivity = {
  id: string;
  type: HomeActivityType;
  purpose?: PublishPurpose;
  title: string;
  body?: string;
  excerpt?: string;
  author: HomeActivityAuthor;
  href: string;
  createdAt: string;
  contextLabel?: string;
  imageUrl?: string;
  videoUrl?: string;
  pollOptions?: { label: string; votes: number }[];
  meta?: Record<string, string | number>;
  reactions: HomeActivityReactions;
  commentCount: number;
  impactPoints?: number;
};

export type TrendingDiscussion = {
  id: string;
  title: string;
  communityName: string;
  href: string;
  replyCount: number;
};

export type TopContributor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  href: string;
};

export type HomeDiscoveryData = {
  trendingDiscussions: TrendingDiscussion[];
  upcomingEvents: {
    id: string;
    title: string;
    startsAt: string;
    location: string | null;
    attendeeCount: number;
    href: string;
    registered: boolean;
  }[];
  suggestedCommunities: {
    id: string;
    name: string;
    slug: string;
    tag: string | null;
    memberCount: number;
    href: string;
  }[];
  suggestedCollaborators: {
    id: string;
    name: string;
    reason: string;
    avatarUrl: string | null;
    href: string;
  }[];
  aiRecommendations: {
    id: string;
    title: string;
    description: string;
    href: string;
    actionLabel: string;
  }[];
  topContributors: TopContributor[];
};
