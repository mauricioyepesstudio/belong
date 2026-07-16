/**
 * Server-only Mission Engine entry point.
 * Import from here in Server Components, Server Actions, and route handlers.
 */
export {
  createMissionEngineService,
  MissionEngineServiceImpl,
  MissionEngineError,
} from "./service";

export { createLifeMissionAdapter, type LifeMissionAdapter } from "./adapter";

export type { MissionEngineService } from "./mission-engine";
