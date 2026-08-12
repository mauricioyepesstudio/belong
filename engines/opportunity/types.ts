import type { BuildGoal } from "@/types/database.types";

export type OpportunityCategory =
  | "people"
  | "projects"
  | "communities"
  | "organizations"
  | "missions";

export type ConfidenceLevel = "high" | "medium" | "low";

export type ExplanationBulletKind =
  | "shared_interests"
  | "shared_skills"
  | "same_community"
  | "skills_needed"
  | "nearby_location"
  | "similar_project_history"
  | "looking_for_collaborators"
  | "build_goal_match"
  | "active_project"
  | "tag_match"
  | "mission_alignment"
  | "activity_match";

export type ExplanationBullet = {
  id: string;
  kind: ExplanationBulletKind;
  label: string;
};

export type RecommendationDetails = {
  sharedSkills: string[];
  sharedCommunities: string[];
  sharedInterests: string[];
  mutualCollaborators: string[];
  currentOpportunities: string[];
};

export type ScoreFactor = {
  key: string;
  weight: number;
  score: number;
  reason: string;
};

export type ScoreBreakdown = {
  totalScore: number;
  weightedPoints: number;
  maxPossiblePoints: number;
  formula: string;
  factors: ScoreFactor[];
};

export type RecommendationExplanation = {
  bullets: ExplanationBullet[];
  confidence: ConfidenceLevel;
  details: RecommendationDetails;
  scoreBreakdown: ScoreBreakdown;
};

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
  projectNames: Record<string, string>;
  organizationIds: string[];
  activityModules: string[];
  currentStreak: number;
  connectionIds: string[];
  connectionNames: Record<string, string>;
};

export type ScoredRecommendation = {
  id: string;
  category: OpportunityCategory;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
  /** @deprecated use explanation.bullets */
  reasons: string[];
  factors: ScoreFactor[];
  explanation: RecommendationExplanation;
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
  projectIds: string[];
};

export type ProjectCandidate = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  communityId: string;
  communityName: string;
  communitySlug: string;
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

export type MatchSignals = {
  sharedSkills: string[];
  sharedInterests: string[];
  sharedCommunities: string[];
  sharedProjects: string[];
  mutualCollaborators: string[];
  skillsNeeded: string[];
  locationMatch: boolean;
  locationLabel?: string;
  buildGoalMatch: boolean;
  buildGoalLabel?: string;
  lookingForCollaborators: boolean;
  activeProject: boolean;
  tagMatch?: string;
  missionAlignment: boolean;
  activityMatch: boolean;
  currentOpportunities: string[];
};

export type OpportunityGraphContext = {
  membersByCommunity: Record<string, string[]>;
  userNames: Record<string, string>;
};
