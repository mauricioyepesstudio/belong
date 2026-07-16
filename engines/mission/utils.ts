import {
  ACTIVE_MISSION_STATES,
  MISSION_CATEGORIES,
  MISSION_INSIGHT_TYPES,
  MISSION_RECOMMENDATION_PRIORITIES,
  MISSION_STATES,
  TERMINAL_MISSION_STATES,
} from "./constants";
import type {
  MissionCategory,
  MissionInsightType,
  MissionRecommendationPriority,
  MissionState,
} from "./types";

export function isMissionState(value: string): value is MissionState {
  return (Object.values(MISSION_STATES) as string[]).includes(value);
}

export function isMissionCategory(value: string): value is MissionCategory {
  return (Object.values(MISSION_CATEGORIES) as string[]).includes(value);
}

export function isMissionInsightType(value: string): value is MissionInsightType {
  return (Object.values(MISSION_INSIGHT_TYPES) as string[]).includes(value);
}

export function isMissionRecommendationPriority(
  value: string
): value is MissionRecommendationPriority {
  return (Object.values(MISSION_RECOMMENDATION_PRIORITIES) as string[]).includes(value);
}

export function isTerminalMissionState(state: MissionState): boolean {
  return (TERMINAL_MISSION_STATES as readonly string[]).includes(state);
}

export function isActiveMissionState(state: MissionState): boolean {
  return (ACTIVE_MISSION_STATES as readonly string[]).includes(state);
}
