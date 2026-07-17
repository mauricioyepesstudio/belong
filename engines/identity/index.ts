export { IDENTITY_COMPLETENESS_WEIGHTS, IDENTITY_LIMITS } from "./constants";
export type {
  ImpactEvent,
  ImpactEventModule,
  ImpactEventType,
  ReputationProfile,
  ReputationRanks,
  ReputationScores,
  RecordImpactEventInput,
} from "./reputation";
export {
  computeReputationScores,
  fetchReputationProfile,
  founderLabel,
  MODULE_LABELS,
  recordImpactEvent,
  reputationLevelFromScore,
} from "./reputation";
export type { IdentityEngineService } from "./identity-engine";
export type {
  ExperienceEntryInput,
  IdentityCompleteness,
  IdentityEngineContext,
  IdentityEngineData,
  PersonalityTraitInput,
  SetIdentityCollectionInput,
  UpdateIdentityProfileInput,
  UpdatePersonalityInput,
} from "./types";
export { createExperienceId, normalizeCollection } from "./utils";
export type { UserIdentity } from "./domain/entities/user-identity";
export { IdentityEngineError, IdentityValidationError } from "./domain/errors";
