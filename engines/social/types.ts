import type {
  Json,
  SocialMediaType,
  SocialPostType as DatabaseSocialPostType,
} from "@/types/database.types";
import type { UserConnectionState } from "@/lib/core/connection-state";

export type SocialPublishingContext = {
  type: "community" | "project";
  id: string;
  name: string;
};

export type SocialPostType =
  | "TEXT"
  | "PHOTO"
  | "VIDEO"
  | "PROJECT_UPDATE"
  | "COMMUNITY_UPDATE"
  | "NEEDS_HELP"
  | "IMPACT";

export type SocialAuthor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
  connectionState: UserConnectionState;
};

export type SocialContext = {
  communityId: string | null;
  communityName: string | null;
  communitySlug: string | null;
  projectId: string | null;
  projectName: string | null;
};

export type SocialComment = {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: SocialAuthor;
};

export type SocialPost = {
  id: string;
  type: DatabaseSocialPostType;
  body: string;
  mediaUrl: string | null;
  mediaPath: string | null;
  mediaType: SocialMediaType | null;
  mediaMimeType: string | null;
  mediaSizeBytes: number | null;
  mediaMetadata: Json;
  createdAt: string;
  updatedAt: string;
  author: SocialAuthor;
  context: SocialContext;
  supportCount: number;
  commentCount: number;
  supportedByViewer: boolean;
  comments: SocialComment[];
};

export type SocialFeedCursor = {
  createdAt: string;
  id: string;
};

export type GlobalSocialFeedCursor = {
  beforeCreatedAt: string | null;
  beforeId: string | null;
  offset: number;
};

export type SocialFeedPage = {
  posts: SocialPost[];
  nextCursor: string | null;
};

export type CreateSocialPostInput = {
  type: SocialPostType;
  body?: string;
  communityId?: string | null;
  projectId?: string | null;
  media?: {
    url: string;
    path: string;
    type: "image" | "video";
    mimeType: string;
    sizeBytes: number;
    name: string;
  } | null;
};

export type SocialProfilePage = {
  profile: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    buildGoal: string | null;
    interests: string[];
    skills: string[];
  };
  viewer: { id: string; fullName: string | null; avatarUrl: string | null };
  isSelf: boolean;
  connectionState: "self" | "none" | "pending_sent" | "pending_received" | "connected";
  connectionId: string | null;
  posts: SocialFeedPage;
  publishingContexts: SocialPublishingContext[];
  projects: Array<{ id: string; name: string; status: string | null }>;
  communities: Array<{ id: string; name: string; slug: string; role: string | null }>;
  impact: Array<{ id: string; title: string; description: string | null; points: number }>;
  stats: {
    connectionCount: number;
    projectCount: number;
    communityCount: number;
    impactScore: number;
    postCount: number;
    supportCount: number;
  };
};

export const SOCIAL_FEED_DEFAULT_LIMIT = 20;
export const SOCIAL_FEED_MAX_LIMIT = 50;
