import type { CoreEngineContext, EngineContext, EngineLifecycleStatus } from "./types";

export function createEngineContext(
  core: CoreEngineContext,
  status: EngineLifecycleStatus = "idle"
): EngineContext {
  return {
    core,
    status,
    startedAt: new Date().toISOString(),
  };
}

export function withEngineStatus(
  context: EngineContext,
  status: EngineLifecycleStatus
): EngineContext {
  return { ...context, status };
}
