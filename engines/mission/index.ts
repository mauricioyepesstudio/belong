// Config & helpers (existing)
export { getBuildGoalOption, getMissionText, BUILD_GOALS, BUILD_GOAL_PROMPTS } from "./config";
export type { BuildGoalOption } from "./config";

// UI components (existing)
export { MissionCard, BuildGoalBadge } from "./components/mission-card";
export { MissionEnginePanel } from "./components/mission-engine-panel";
export { MissionDetailScreen } from "./components/mission-detail-screen";

// Operational data fetchers (existing — daily missions, weekly goals)
export { fetchMissionEngineData, buildDailyMissionTemplates } from "./engine";

// Life Mission Engine contracts (Sprint 2)
export type { MissionEngineService, MissionEngineFactory } from "./mission-engine";

// Constants
export {
  MISSION_ENGINE_VERSION,
  MISSION_STATES,
  MISSION_CATEGORIES,
  TERMINAL_MISSION_STATES,
  ACTIVE_MISSION_STATES,
  MISSION_INSIGHT_TYPES,
  MISSION_RECOMMENDATION_PRIORITIES,
  DEFAULT_MISSION_STATE,
  DEFAULT_RECOMMENDATIONS_LIMIT,
  DEFAULT_INSIGHTS_LIMIT,
} from "./constants";

// Types — life mission domain
export type {
  MissionState,
  MissionCategory,
  Mission,
  MissionMilestone,
  MissionProgress,
  MissionRecommendationPriority,
  MissionRecommendation,
  MissionInsightType,
  MissionInsight,
  CreateMissionInput,
  UpdateMissionInput,
  MissionEngineContext,
  GenerateRecommendationsOptions,
  GenerateInsightsOptions,
} from "./types";

// Types — operational mission data (existing)
export type {
  DailyMissionStatus,
  WeeklyGoalStatus,
  DailyMission,
  WeeklyGoal,
  UserMomentum,
  MissionEngineData,
  MissionParticipant,
  DailyMissionDetailData,
} from "./types";

// Utilities
export {
  isMissionState,
  isMissionCategory,
  isMissionInsightType,
  isMissionRecommendationPriority,
  isTerminalMissionState,
  isActiveMissionState,
} from "./utils";
