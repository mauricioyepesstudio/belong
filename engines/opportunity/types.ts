import type { BuildGoal } from "@/types/database.types";

export type OpportunityCategory =
  | "people"
  | "projects"
  | "communities"
  | "organizations"
  | "missions";

export type CompatibilityProfile = {
  userId: string;
  fullName: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  buildGoal: BuildGoal | null;
  buildVision: string | null;
  skills: string[];
  interests: string[];
  strengths: string[];
  values: string[];
  communityIds: string[];
  communityNames: Record<string, string>;
  projectIds: string[];
  organizationIds: string[];
  activityModules: string[];
  currentStreak: number;
};

export type ScoreFactor = {
  key: string;
  weight: number;
  score: number;
  reason: string;
};

export type ScoredRecommendation = {
  id: string;
  category: OpportunityCategory;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
  reasons: string[];
  factors: ScoreFactor[];
  meta?: Record<string, string | null>;
};

export type OpportunityRecommendations = {
  people: ScoredRecommendation[];
  projects: ScoredRecommendation[];
  communities: ScoredRecommendation[];
  organizations: ScoredRecommendation[];
  missions: ScoredRecommendation[];
};

export type PersonCandidate = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  buildGoal: BuildGoal | null;
  skills: string[];
  interests: string[];
  communityIds: string[];
};

export type ProjectCandidate = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  communityId: string;
  communityName: string;
  communityTag: string | null;
};

export type CommunityCandidate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tag: string | null;
  memberCount: number;
};

export type OrganizationCandidate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  communityTags: string[];
};

export type MissionCandidate = {
  id: string;
  title: string;
  description: string | null;
  href: string;
  kind: "daily" | "weekly";
  status: string;
};

export type OpportunityCandidatePool = {
  people: PersonCandidate[];
  projects: ProjectCandidate[];
  communities: CommunityCandidate[];
  organizations: OrganizationCandidate[];
  missions: MissionCandidate[];
};
