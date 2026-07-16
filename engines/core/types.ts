import type { AIContext, AIInsight } from "@/engines/ai/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type {
  DailyMission,
  MissionEngineData,
  UserMomentum,
  WeeklyGoal,
} from "@/engines/mission/types";
import type { ProjectWithMemberCount, UserCommunity, UserStats } from "@/lib/core";
import type { SupabaseServerClient } from "@/lib/core/types";
import type { Community, Mission, UserProfile } from "@/types/database.types";
import type { ENGINE_NAMES } from "./constants";

// ---------------------------------------------------------------------------
// Engine identity
// ---------------------------------------------------------------------------

export type EngineName = (typeof ENGINE_NAMES)[keyof typeof ENGINE_NAMES];

export type CoreEngineRegistryKey = EngineName;

export type EngineLifecycleStatus = "idle" | "initializing" | "ready" | "shutdown";

// ---------------------------------------------------------------------------
// Shared context passed to every sub-engine adapter
// ---------------------------------------------------------------------------

/** Runtime values populated by Core Engine during resolve (orchestration only). */
export type CoreEngineRuntime = {
  stats: UserStats;
  primaryMission: Mission | null;
  hasMission: boolean;
};

export type CoreEngineContext = {
  supabase: SupabaseServerClient;
  profile: UserProfile;
  userId: string;
  /** Set by CoreEngine.resolve before dependent adapters run. */
  runtime?: CoreEngineRuntime;
};

/** Full engine session context including lifecycle state. */
export type EngineContext = {
  core: CoreEngineContext;
  status: EngineLifecycleStatus;
  startedAt: string;
};

export type CoreEngineOptions = {
  /** Run sub-engine fetches in parallel when true (default). */
  parallel?: boolean;
  /** Stop on first adapter failure when true. */
  failFast?: boolean;
  /** Limit discoverable communities returned by the community adapter. */
  discoverCommunityLimit?: number;
  /** Limit recent projects returned by the projects adapter. */
  recentProjectLimit?: number;
  /** Limit recent activity items returned by adapters that surface activity. */
  recentActivityLimit?: number;
};

// ---------------------------------------------------------------------------
// Sub-engine result shapes (orchestrator output slices)
// ---------------------------------------------------------------------------

export type MissionEngineResult = MissionEngineData;

export type ImpactEngineResult = ImpactEngineData;

export type ProjectsEngineResult = {
  recent: ProjectWithMemberCount[];
  total: number;
};

export type CommunityEngineResult = {
  joined: UserCommunity[];
  discover: Community[];
};

export type WeeklyGoalsEngineResult = {
  goals: WeeklyGoal[];
  primary: WeeklyGoal | null;
  progress: number;
  momentum: UserMomentum;
};

export type AIEngineResult = {
  context: AIContext;
  insights: AIInsight[];
};

export type CoreEngineResult = {
  profile: UserProfile;
  primaryMission: Mission | null;
  mission: MissionEngineResult;
  impact: ImpactEngineResult;
  projects: ProjectsEngineResult;
  community: CommunityEngineResult;
  weeklyGoals: WeeklyGoalsEngineResult;
  ai: AIEngineResult;
};

// ---------------------------------------------------------------------------
// Sub-engine adapter contracts
// ---------------------------------------------------------------------------

export interface EngineLifecycle {
  initialize?(context: EngineContext): Promise<void>;
  ready?(context: EngineContext): Promise<void>;
  shutdown?(context: EngineContext): Promise<void>;
}

export interface MissionEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.mission;
  fetch(context: CoreEngineContext, options?: CoreEngineOptions): Promise<MissionEngineResult>;
}

export interface ImpactEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.impact;
  fetch(
    context: CoreEngineContext,
    mission: Pick<MissionEngineResult, "dailyMissions">,
    options?: CoreEngineOptions
  ): Promise<ImpactEngineResult>;
}

export interface ProjectsEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.projects;
  fetch(context: CoreEngineContext, options?: CoreEngineOptions): Promise<ProjectsEngineResult>;
}

export interface CommunityEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.community;
  fetch(context: CoreEngineContext, options?: CoreEngineOptions): Promise<CommunityEngineResult>;
}

export interface WeeklyGoalsEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.weeklyGoals;
  fetch(
    context: CoreEngineContext,
    mission: Pick<MissionEngineResult, "weeklyGoals" | "weeklyProgress" | "momentum">,
    options?: CoreEngineOptions
  ): Promise<WeeklyGoalsEngineResult>;
}

export interface AIEngineAdapter extends EngineLifecycle {
  readonly name: typeof ENGINE_NAMES.ai;
  fetch(
    context: CoreEngineContext,
    snapshot: Pick<CoreEngineResult, "mission" | "impact" | "projects" | "community" | "weeklyGoals">,
    options?: CoreEngineOptions
  ): Promise<AIEngineResult>;
}

export type CoreEngineAdapter =
  | MissionEngineAdapter
  | ImpactEngineAdapter
  | ProjectsEngineAdapter
  | CommunityEngineAdapter
  | WeeklyGoalsEngineAdapter
  | AIEngineAdapter;

// ---------------------------------------------------------------------------
// Orchestrator registry + public Core Engine contract
// ---------------------------------------------------------------------------

export type CoreEngineRegistry = {
  mission: MissionEngineAdapter;
  impact: ImpactEngineAdapter;
  projects: ProjectsEngineAdapter;
  community: CommunityEngineAdapter;
  weeklyGoals: WeeklyGoalsEngineAdapter;
  ai: AIEngineAdapter;
};

export interface CoreEngine {
  readonly version: string;
  readonly registry: EngineRegistry;
  initialize(context: CoreEngineContext): Promise<EngineContext>;
  ready(context: EngineContext): Promise<void>;
  shutdown(context: EngineContext): Promise<void>;
  resolve(context: CoreEngineContext, options?: CoreEngineOptions): Promise<CoreEngineResult>;
}

export interface CoreEngineFactory {
  create(registry: EngineRegistry, observer?: CoreEngineObserver): CoreEngine;
}

export type EngineRegistryValidation = {
  valid: boolean;
  missing: EngineName[];
  dependencyErrors: string[];
  unknownEngines: EngineName[];
};

export interface EngineRegistry {
  register(adapter: CoreEngineAdapter): void;
  unregister(name: EngineName): void;
  has(name: EngineName): boolean;
  get(name: EngineName): CoreEngineAdapter | undefined;
  validate(): EngineRegistryValidation;
  toCoreRegistry(): CoreEngineRegistry;
  list(): EngineName[];
  getExecutionPhases(): EngineName[][];
}

// ---------------------------------------------------------------------------
// Orchestration events (for logging, analytics, future middleware)
// ---------------------------------------------------------------------------

export type CoreEnginePhase = "start" | "adapter" | "complete" | "error";

export type CoreEngineEvent = {
  phase: CoreEnginePhase;
  engine: EngineName | "core";
  timestamp: string;
  durationMs?: number;
  error?: string;
};

export interface CoreEngineObserver {
  onEvent(event: CoreEngineEvent): void;
}

// ---------------------------------------------------------------------------
// Re-exports of commonly referenced domain types (convenience for consumers)
// ---------------------------------------------------------------------------

export type { DailyMission, WeeklyGoal, UserMomentum, MissionEngineData };
export type { ImpactEngineData };
export type { AIContext, AIInsight };
