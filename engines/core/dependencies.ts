import { ENGINE_NAMES } from "./constants";
import type { EngineName } from "./types";

/** Directed dependency graph — orchestrator resolves parents before children. */
export const ENGINE_DEPENDENCIES: Record<EngineName, readonly EngineName[]> = {
  [ENGINE_NAMES.mission]: [],
  [ENGINE_NAMES.projects]: [],
  [ENGINE_NAMES.community]: [],
  [ENGINE_NAMES.impact]: [ENGINE_NAMES.mission],
  [ENGINE_NAMES.weeklyGoals]: [ENGINE_NAMES.mission],
  [ENGINE_NAMES.ai]: [
    ENGINE_NAMES.mission,
    ENGINE_NAMES.impact,
    ENGINE_NAMES.projects,
    ENGINE_NAMES.community,
    ENGINE_NAMES.weeklyGoals,
  ],
};

export function validateEngineDependencies(
  registered: readonly EngineName[]
): string[] {
  const errors: string[] = [];
  const registeredSet = new Set(registered);

  for (const engine of registered) {
    for (const dependency of ENGINE_DEPENDENCIES[engine] ?? []) {
      if (!registeredSet.has(dependency)) {
        errors.push(`${engine} requires ${dependency}, which is not registered`);
      }
    }
  }

  return errors;
}

/**
 * Groups engines into execution phases via topological sort.
 * Engines in the same phase have no unresolved dependencies on each other.
 */
export function buildExecutionPhases(registered: readonly EngineName[]): EngineName[][] {
  const registeredSet = new Set(registered);
  const remaining = new Set(registered);
  const phases: EngineName[][] = [];

  while (remaining.size > 0) {
    const phase: EngineName[] = [];

    for (const engine of remaining) {
      const deps = ENGINE_DEPENDENCIES[engine] ?? [];
      const unresolved = deps.filter((d) => registeredSet.has(d) && remaining.has(d));
      if (unresolved.length === 0) phase.push(engine);
    }

    if (phase.length === 0) {
      throw new Error("Circular engine dependency detected");
    }

    phases.push(phase);
    for (const engine of phase) remaining.delete(engine);
  }

  return phases;
}
