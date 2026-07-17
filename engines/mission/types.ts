export type DailyMissionStatus = "pending" | "completed" | "skipped";
export type WeeklyGoalStatus = "active" | "completed" | "expired";
export type QuarterlyGoalStatus = "active" | "completed" | "expired";

// ---------------------------------------------------------------------------
// Life Mission domain (Sprint 2 — Mission Engine)
// ---------------------------------------------------------------------------

export type MissionState =
  | "draft"
  | "discovering"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type MissionCategory =
  | "startup"
  | "career"
  | "learn"
  | "health"
  | "relationships"
  | "community"
  | "travel"
  | "creator"
  | "custom";

export type Mission = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  vision: string | null;
  category: MissionCategory | null;
  state: MissionState;
  isPrimary: boolean;
  milestones: MissionMilestone[];
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
};

export type MissionMilestone = {
  id: string;
  missionId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: string | null;
  sortOrder: number;
};

export type MissionProgress = {
  missionId: string;
  state: MissionState;
  completionPercent: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  dailyMissionsCompleted: number;
  weeklyGoalsCompleted: number;
  currentStreak: number;
  lastActiveAt: string | null;
};

export type MissionRecommendationPriority = "high" | "medium" | "low";

export type MissionRecommendation = {
  id: string;
  missionId: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority: MissionRecommendationPriority;
  category: MissionCategory | null;
};

export type MissionInsightType =
  | "progress"
  | "momentum"
  | "alignment"
  | "opportunity";

export type MissionInsight = {
  id: string;
  missionId: string;
  title: string;
  description: string;
  type: MissionInsightType;
  createdAt: string;
};

export type CreateMissionInput = {
  title: string;
  description?: string | null;
  vision?: string | null;
  category?: MissionCategory | null;
  state?: MissionState;
  isPrimary?: boolean;
  milestones?: Omit<MissionMilestone, "id" | "missionId" | "completedAt">[];
};

export type UpdateMissionInput = {
  title?: string;
  description?: string | null;
  vision?: string | null;
  category?: MissionCategory | null;
  state?: MissionState;
  isPrimary?: boolean;
};

export type MissionEngineContext = {
  userId: string;
};

export type GenerateRecommendationsOptions = {
  limit?: number;
  includePaused?: boolean;
};

export type GenerateInsightsOptions = {
  limit?: number;
  types?: MissionInsightType[];
};

// ---------------------------------------------------------------------------
// Operational mission data (daily missions, weekly goals, momentum)
// ---------------------------------------------------------------------------

export type DailyMission = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  action_href: string;
  impact_points: number;
  status: DailyMissionStatus;
  mission_date: string;
  completed_at: string | null;
  sort_order: number;
  mission_id: string | null;
  weekly_goal_id: string | null;
};

export type WeeklyGoal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  action_href: string;
  impact_points: number;
  status: WeeklyGoalStatus;
  week_start: string;
  week_end: string;
  completed_at: string | null;
  mission_id: string | null;
  quarterly_goal_id: string | null;
};

export type QuarterlyGoal = {
  id: string;
  user_id: string;
  mission_id: string;
  title: string;
  description: string | null;
  progress_percent: number;
  due_date: string;
  status: QuarterlyGoalStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserMomentum = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  weekly_completions: number;
  week_start: string | null;
};

export type MissionEngineData = {
  dailyMissions: DailyMission[];
  weeklyGoals: WeeklyGoal[];
  momentum: UserMomentum;
  dailyCompleted: number;
  dailyTotal: number;
  weeklyProgress: number;
  lifeMission: Mission | null;
  lifeMissionProgress: MissionProgress | null;
  quarterlyGoals: QuarterlyGoal[];
  quarterlyProgress: number;
};

export type MissionParticipant = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "owner" | "participant";
  joinedAt: string;
};

export type DailyMissionDetailData = {
  mission: DailyMission;
  owner: MissionParticipant;
  participants: MissionParticipant[];
  objectives: MissionMilestone[];
  progress: {
    percent: number;
    milestonesCompleted: number;
    milestonesTotal: number;
  };
  rewards: {
    impactPoints: number;
  };
  isOwner: boolean;
  isParticipant: boolean;
  currentUserId: string;
};
