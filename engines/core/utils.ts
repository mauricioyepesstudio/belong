import { CORE_ENGINE_REGISTRY_ORDER, ENGINE_NAMES } from "./constants";
import type { CoreEngineAdapter, CoreEngineRegistry, EngineName } from "./types";

/**
 * Type guard: checks whether a string is a registered engine name.
 */
export function isEngineName(value: string): value is EngineName {
  return (Object.values(ENGINE_NAMES) as string[]).includes(value);
}

/**
 * Returns adapter keys in deterministic orchestration order.
 */
export function getRegistryOrder(): readonly EngineName[] {
  return CORE_ENGINE_REGISTRY_ORDER;
}

/**
 * Validates that a registry contains all required adapters.
 * Returns missing engine names; empty array means complete.
 */
export function getMissingAdapters(registry: Partial<CoreEngineRegistry>): EngineName[] {
  return CORE_ENGINE_REGISTRY_ORDER.filter((name) => registry[name] === undefined);
}

/**
 * Narrows an adapter union to a specific engine name.
 */
export function isAdapterFor<E extends EngineName>(
  adapter: CoreEngineAdapter,
  name: E
): adapter is CoreEngineRegistry[E] {
  return adapter.name === name;
}
