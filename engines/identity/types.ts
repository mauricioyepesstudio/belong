import type { UserIdentity } from "./domain/entities/user-identity";

export type IdentityEngineContext = {
  userId: string;
};

export type IdentityCompleteness = {
  score: number;
  filledFields: string[];
  missingFields: string[];
};

export type UpdateIdentityProfileInput = {
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

export type SetIdentityCollectionInput = {
  strengths?: string[];
  interests?: string[];
  values?: string[];
  skills?: string[];
};

export type PersonalityTraitInput = {
  name: string;
  description?: string | null;
  score?: number | null;
};

export type UpdatePersonalityInput = {
  traits: PersonalityTraitInput[];
};

export type ExperienceEntryInput = {
  id?: string;
  title: string;
  organization: string;
  startYear: number;
  endYear?: number | null;
  description?: string | null;
};

export type IdentityEngineData = {
  identity: UserIdentity;
  completeness: IdentityCompleteness;
};
