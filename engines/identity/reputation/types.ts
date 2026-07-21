import type { Json } from "@/types/database.types";

export type ImpactEventModule =
  | "mission"
  | "community"
  | "project"
  | "organization"
  | "event"
  | "system";

export type ImpactEventType =
  | "mission_completed"
  | "weekly_goal_completed"
  | "quarterly_goal_completed"
  | "community_join"
  | "community_post"
  | "community_comment"
  | "community_like"
  | "project_created"
  | "project_join"
  | "project_post"
  | "project_comment"
  | "project_completed"
  | "project_task_created"
  | "project_task_completed"
  | "project_file_uploaded"
  | "project_goal_completed"
  | "project_milestone_completed"
  | "organization_created"
  | "organization_join"
  | "organization_invite_accepted"
  | "ai_copilot_applied"
  | "streak_activity"
  | "connection_accepted"
  | "helpful_reaction_received"
  | "event_organized"
  | "profile_completed"
  | "collaboration_started";

export type ImpactEvent = {
  id: string;
  userId: string;
  module: ImpactEventModule;
  eventType: ImpactEventType;
  points: number;
  sourceId: string | null;
  metadata: Json;
  createdAt: string;
};

export type ReputationScores = {
  reputationScore: number;
  founderScore: number;
  collaborationScore: number;
  communityContributionScore: number;
  projectCompletionScore: number;
  missionCompletionRate: number;
};

export type ReputationRanks = {
  founderRank: number;
  communityRank: number;
  totalFounders: number;
  totalContributors: number;
};

export type ReputationProfile = {
  totalImpact: number;
  reputationLevel: string;
  scores: ReputationScores;
  ranks: ReputationRanks;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletions: number;
  recentEvents: ImpactEvent[];
  eventTotals: { module: ImpactEventModule; points: number; count: number }[];
  breakdown: { label: string; points: number }[];
  history: { date: string; score: number }[];
  nextLevelAt: number;
  progressToNext: number;
};

export type RecordImpactEventInput = {
  userId: string;
  module: ImpactEventModule;
  eventType: ImpactEventType;
  points: number;
  sourceId?: string;
  metadata?: Json;
};
