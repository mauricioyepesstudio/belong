import { createDefaultEngineAdapters } from "./adapters";
import { createCoreEngine } from "./resolve";
import { createEngineRegistry } from "./registry";

/**
 * Server-only Core Engine entry point.
 * Import from here in Server Components, Server Actions, and route handlers.
 */
export { createCoreEngine, CoreEngineImpl } from "./resolve";
export { createEngineRegistry, DefaultEngineRegistry } from "./registry";
export { createDefaultEngineAdapters } from "./adapters";
export { createEngineContext, withEngineStatus } from "./engine-context";
export {
  ENGINE_DEPENDENCIES,
  validateEngineDependencies,
  buildExecutionPhases,
} from "./dependencies";

export type {
  CoreEngine,
  EngineRegistry,
  EngineContext,
  CoreEngineRuntime,
} from "./types";

export function createDefaultCoreEngine() {
  const registry = createEngineRegistry(createDefaultEngineAdapters());
  return createCoreEngine(registry);
}
