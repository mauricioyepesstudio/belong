import type {
  CreateMissionInput,
  GenerateInsightsOptions,
  GenerateRecommendationsOptions,
  Mission,
  MissionEngineContext,
  MissionInsight,
  MissionProgress,
  MissionRecommendation,
  UpdateMissionInput,
} from "./types";

/**
 * Mission Engine service contract.
 * Defines and manages the user's life mission.
 * @see createMissionEngineService in ./server.ts
 */
export interface MissionEngineService {
  getMission(
    context: MissionEngineContext,
    missionId?: string
  ): Promise<Mission | null>;

  createMission(
    context: MissionEngineContext,
    input: CreateMissionInput
  ): Promise<Mission>;

  updateMission(
    context: MissionEngineContext,
    missionId: string,
    input: UpdateMissionInput
  ): Promise<Mission>;

  archiveMission(
    context: MissionEngineContext,
    missionId: string
  ): Promise<Mission>;

  calculateMissionProgress(
    context: MissionEngineContext,
    missionId: string
  ): Promise<MissionProgress>;

  generateRecommendations(
    context: MissionEngineContext,
    missionId: string,
    options?: GenerateRecommendationsOptions
  ): Promise<MissionRecommendation[]>;

  generateInsights(
    context: MissionEngineContext,
    missionId: string,
    options?: GenerateInsightsOptions
  ): Promise<MissionInsight[]>;
}

/**
 * Factory contract for constructing a Mission Engine instance.
 * @see createMissionEngineService in ./server.ts
 */
export interface MissionEngineFactory {
  create(): MissionEngineService;
}
