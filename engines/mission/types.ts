export type DailyMissionStatus = "pending" | "completed" | "skipped";
export type WeeklyGoalStatus = "active" | "completed" | "expired";

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
};
