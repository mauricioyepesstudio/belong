/**
 * Server-only Identity Engine entry point.
 * Import from here in Server Components, Server Actions, and route handlers.
 */
export {
  createIdentityEngineService,
  IdentityEngineServiceImpl,
  IdentityEngineError,
  IdentityValidationError,
} from "./services/identity-service";

export { createIdentityCoreAdapter, type IdentityCoreAdapter } from "./adapters/core-adapter";

export type { IdentityEngineService } from "./identity-engine";
