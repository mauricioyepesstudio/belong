export const IDENTITY_LIMITS = {
  nameMaxLength: 120,
  bioMaxLength: 2000,
  locationMaxLength: 120,
  roleMaxLength: 120,
  labeledItemMaxLength: 80,
  labeledItemMaxCount: 50,
  experienceTitleMaxLength: 120,
  experienceOrganizationMaxLength: 120,
  experienceDescriptionMaxLength: 1000,
  experienceMaxCount: 30,
  personalityTraitMaxLength: 80,
  personalityTraitMaxCount: 20,
  personalityScoreMin: 1,
  personalityScoreMax: 5,
} as const;

export const IDENTITY_COMPLETENESS_WEIGHTS = {
  name: 10,
  bio: 10,
  location: 5,
  role: 5,
  skills: 15,
  strengths: 15,
  interests: 10,
  values: 10,
  personality: 10,
  experience: 10,
} as const;
