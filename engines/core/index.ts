// Constants
export {
  CORE_ENGINE_VERSION,
  ENGINE_NAMES,
  CORE_ENGINE_REGISTRY_ORDER,
  DEFAULT_CORE_ENGINE_OPTIONS,
} from "./constants";

// Types & interfaces
export type {
  EngineName,
  CoreEngineRegistryKey,
  EngineLifecycleStatus,
  CoreEngineRuntime,
  CoreEngineContext,
  EngineContext,
  EngineLifecycle,
  CoreEngineOptions,
  MissionEngineResult,
  ImpactEngineResult,
  ProjectsEngineResult,
  CommunityEngineResult,
  WeeklyGoalsEngineResult,
  AIEngineResult,
  CoreEngineResult,
  MissionEngineAdapter,
  ImpactEngineAdapter,
  ProjectsEngineAdapter,
  CommunityEngineAdapter,
  WeeklyGoalsEngineAdapter,
  AIEngineAdapter,
  CoreEngineAdapter,
  CoreEngineRegistry,
  CoreEngine,
  CoreEngineFactory,
  CoreEnginePhase,
  CoreEngineEvent,
  CoreEngineObserver,
  EngineRegistry,
  EngineRegistryValidation,
  DailyMission,
  WeeklyGoal,
  UserMomentum,
  MissionEngineData,
  ImpactEngineData,
  AIContext,
  AIInsight,
} from "./types";

// Orchestrator
export { CoreEngineImpl, createCoreEngine } from "./resolve";
export { createEngineContext, withEngineStatus } from "./engine-context";
export { createEngineRegistry, DefaultEngineRegistry } from "./registry";
export {
  ENGINE_DEPENDENCIES,
  validateEngineDependencies,
  buildExecutionPhases,
} from "./dependencies";

// Adapter factories (server-side usage recommended)
export {
  createMissionEngineAdapter,
  createImpactEngineAdapter,
  createProjectsEngineAdapter,
  createCommunityEngineAdapter,
  createWeeklyGoalsEngineAdapter,
  createAIEngineAdapter,
  createDefaultEngineAdapters,
} from "./adapters";

// Utilities
export { isEngineName, getRegistryOrder, getMissingAdapters, isAdapterFor } from "./utils";
