import type { UserIdentity } from "./domain/entities/user-identity";
import type {
  ExperienceEntryInput,
  IdentityCompleteness,
  IdentityEngineContext,
  IdentityEngineData,
  SetIdentityCollectionInput,
  UpdateIdentityProfileInput,
  UpdatePersonalityInput,
} from "./types";

export interface IdentityEngineService {
  getIdentity(context: IdentityEngineContext): Promise<UserIdentity | null>;
  getIdentityData(context: IdentityEngineContext): Promise<IdentityEngineData | null>;
  calculateCompleteness(identity: UserIdentity): IdentityCompleteness;
  updateProfile(
    context: IdentityEngineContext,
    input: UpdateIdentityProfileInput
  ): Promise<UserIdentity>;
  setCollections(
    context: IdentityEngineContext,
    input: SetIdentityCollectionInput
  ): Promise<UserIdentity>;
  updatePersonality(
    context: IdentityEngineContext,
    input: UpdatePersonalityInput
  ): Promise<UserIdentity>;
  setExperience(
    context: IdentityEngineContext,
    entries: ExperienceEntryInput[]
  ): Promise<UserIdentity>;
}
