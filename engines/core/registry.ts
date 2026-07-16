import { CORE_ENGINE_REGISTRY_ORDER } from "./constants";
import { buildExecutionPhases, validateEngineDependencies } from "./dependencies";
import { getMissingAdapters } from "./utils";
import type {
  CoreEngineAdapter,
  CoreEngineRegistry,
  EngineName,
  EngineRegistry,
  EngineRegistryValidation,
} from "./types";

export class DefaultEngineRegistry implements EngineRegistry {
  private readonly adapters = new Map<EngineName, CoreEngineAdapter>();

  register(adapter: CoreEngineAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  unregister(name: EngineName): void {
    this.adapters.delete(name);
  }

  has(name: EngineName): boolean {
    return this.adapters.has(name);
  }

  get(name: EngineName): CoreEngineAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): EngineName[] {
    return [...this.adapters.keys()];
  }

  validate(): EngineRegistryValidation {
    const partial = Object.fromEntries(
      [...this.adapters.entries()].map(([name, adapter]) => [name, adapter])
    ) as Partial<CoreEngineRegistry>;

    const missing = getMissingAdapters(partial);
    const registered = this.list();
    const dependencyErrors = validateEngineDependencies(registered);

    const unknownEngines = registered.filter(
      (name) => !CORE_ENGINE_REGISTRY_ORDER.includes(name)
    );

    return {
      valid: missing.length === 0 && dependencyErrors.length === 0,
      missing,
      dependencyErrors,
      unknownEngines,
    };
  }

  toCoreRegistry(): CoreEngineRegistry {
    const validation = this.validate();
    if (!validation.valid) {
      const issues = [...validation.missing, ...validation.dependencyErrors];
      throw new Error(`Engine registry invalid: ${issues.join("; ")}`);
    }

    return {
      mission: this.adapters.get("mission") as CoreEngineRegistry["mission"],
      impact: this.adapters.get("impact") as CoreEngineRegistry["impact"],
      projects: this.adapters.get("projects") as CoreEngineRegistry["projects"],
      community: this.adapters.get("community") as CoreEngineRegistry["community"],
      weeklyGoals: this.adapters.get("weeklyGoals") as CoreEngineRegistry["weeklyGoals"],
      ai: this.adapters.get("ai") as CoreEngineRegistry["ai"],
    };
  }

  getExecutionPhases(): EngineName[][] {
    return buildExecutionPhases(this.list());
  }
}

export function createEngineRegistry(adapters: CoreEngineAdapter[] = []): EngineRegistry {
  const registry = new DefaultEngineRegistry();
  for (const adapter of adapters) registry.register(adapter);
  return registry;
}
