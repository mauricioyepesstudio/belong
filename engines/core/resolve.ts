import { DEFAULT_CORE_ENGINE_OPTIONS, ENGINE_NAMES } from "./constants";
import { createEngineContext, withEngineStatus } from "./engine-context";
import { invokeAdapterFetch, type PartialCoreEngineSnapshot } from "./adapters";
import type {
  AIEngineResult,
  CommunityEngineResult,
  CoreEngine,
  CoreEngineContext,
  CoreEngineObserver,
  CoreEngineOptions,
  CoreEngineResult,
  CoreEngineRuntime,
  EngineContext,
  EngineLifecycle,
  EngineName,
  EngineRegistry,
  ImpactEngineResult,
  MissionEngineResult,
  ProjectsEngineResult,
  WeeklyGoalsEngineResult,
} from "./types";
import { fetchUserStats } from "@/lib/core";
import { getMissionText } from "@/engines/mission/config";
import { CORE_ENGINE_VERSION } from "./constants";

function mergeOptions(options?: CoreEngineOptions): CoreEngineOptions {
  return { ...DEFAULT_CORE_ENGINE_OPTIONS, ...options };
}

function emit(observer: CoreEngineObserver | undefined, event: Parameters<CoreEngineObserver["onEvent"]>[0]) {
  observer?.onEvent(event);
}

async function runLifecycleHook(
  adapter: EngineLifecycle,
  hook: keyof EngineLifecycle,
  context: EngineContext
): Promise<void> {
  const fn = adapter[hook];
  if (fn) await fn.call(adapter, context);
}

async function prepareRuntime(context: CoreEngineContext): Promise<CoreEngineRuntime> {
  const [stats, { data: primaryMission }] = await Promise.all([
    fetchUserStats(context.supabase, context.userId),
    context.supabase
      .from("missions")
      .select("*")
      .eq("user_id", context.userId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  return {
    stats,
    primaryMission: primaryMission ?? null,
    hasMission: Boolean(getMissionText(context.profile, primaryMission ?? null)),
  };
}

export class CoreEngineImpl implements CoreEngine {
  readonly version = CORE_ENGINE_VERSION;

  constructor(
    readonly registry: EngineRegistry,
    private readonly observer?: CoreEngineObserver
  ) {}

  async initialize(context: CoreEngineContext): Promise<EngineContext> {
    const validation = this.registry.validate();
    if (!validation.valid) {
      throw new Error(
        `Cannot initialize Core Engine: ${[...validation.missing, ...validation.dependencyErrors].join("; ")}`
      );
    }

    const engineContext = withEngineStatus(createEngineContext(context), "initializing");

    for (const name of this.registry.list()) {
      const adapter = this.registry.get(name);
      if (adapter) await runLifecycleHook(adapter, "initialize", engineContext);
    }

    return engineContext;
  }

  async ready(context: EngineContext): Promise<void> {
    const readyContext = withEngineStatus(context, "ready");

    for (const name of this.registry.list()) {
      const adapter = this.registry.get(name);
      if (adapter) await runLifecycleHook(adapter, "ready", readyContext);
    }
  }

  async shutdown(context: EngineContext): Promise<void> {
    const shutdownContext = withEngineStatus(context, "shutdown");

    for (const name of this.registry.list()) {
      const adapter = this.registry.get(name);
      if (adapter) await runLifecycleHook(adapter, "shutdown", shutdownContext);
    }
  }

  async resolve(
    context: CoreEngineContext,
    options?: CoreEngineOptions
  ): Promise<CoreEngineResult> {
    const merged = mergeOptions(options);
    const startedAt = Date.now();

    emit(this.observer, {
      phase: "start",
      engine: "core",
      timestamp: new Date().toISOString(),
    });

    const engineContext = await this.initialize(context);

    try {
      const runtime = await prepareRuntime(context);
      const orchestrationContext: CoreEngineContext = { ...context, runtime };

      const snapshot: PartialCoreEngineSnapshot = {};
      const phases = this.registry.getExecutionPhases();

      for (const phase of phases) {
        const runners = phase.map(async (name) => {
          const adapter = this.registry.get(name);
          if (!adapter) throw new Error(`Adapter not registered: ${name}`);

          const adapterStarted = Date.now();

          try {
            const result = await invokeAdapterFetch(
              adapter,
              orchestrationContext,
              snapshot,
              merged
            );

            assignSnapshot(snapshot, name, result);

            emit(this.observer, {
              phase: "adapter",
              engine: name,
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - adapterStarted,
            });

            return result;
          } catch (error) {
            emit(this.observer, {
              phase: "error",
              engine: name,
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - adapterStarted,
              error: error instanceof Error ? error.message : String(error),
            });

            if (merged.failFast) throw error;
            return undefined;
          }
        });

        if (merged.parallel) {
          await Promise.all(runners);
        } else {
          for (const runner of runners) await runner;
        }
      }

      await this.ready(engineContext);

      const result: CoreEngineResult = {
        profile: context.profile,
        stats: runtime.stats,
        primaryMission: runtime.primaryMission,
        mission: snapshot.mission as MissionEngineResult,
        impact: snapshot.impact as ImpactEngineResult,
        projects: snapshot.projects as ProjectsEngineResult,
        community: snapshot.community as CommunityEngineResult,
        weeklyGoals: snapshot.weeklyGoals as WeeklyGoalsEngineResult,
        ai: snapshot.ai as AIEngineResult,
      };

      emit(this.observer, {
        phase: "complete",
        engine: "core",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      });

      return result;
    } finally {
      await this.shutdown(engineContext);
    }
  }
}

function assignSnapshot(
  snapshot: PartialCoreEngineSnapshot,
  name: EngineName,
  result: unknown
): void {
  switch (name) {
    case ENGINE_NAMES.mission:
      snapshot.mission = result as MissionEngineResult;
      break;
    case ENGINE_NAMES.impact:
      snapshot.impact = result as ImpactEngineResult;
      break;
    case ENGINE_NAMES.projects:
      snapshot.projects = result as ProjectsEngineResult;
      break;
    case ENGINE_NAMES.community:
      snapshot.community = result as CommunityEngineResult;
      break;
    case ENGINE_NAMES.weeklyGoals:
      snapshot.weeklyGoals = result as WeeklyGoalsEngineResult;
      break;
    case ENGINE_NAMES.ai:
      snapshot.ai = result as AIEngineResult;
      break;
  }
}

export function createCoreEngine(
  registry: EngineRegistry,
  observer?: CoreEngineObserver
): CoreEngine {
  return new CoreEngineImpl(registry, observer);
}
