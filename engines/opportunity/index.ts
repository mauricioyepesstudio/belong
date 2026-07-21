export {
  SCORE_WEIGHTS,
  computeCompatibilityScore,
  jaccardSimilarity,
  locationMatches,
  normalizeToken,
  overlapMatches,
  pickTopReasons,
  tokenize,
  uniqueTokens,
  textContainsAny,
  formatBuildGoalLabel,
  reasonForSkillMatch,
  reasonForInterest,
  reasonForBuildGoal,
  reasonForCommunity,
  reasonForLocation,
  reasonForMissionInterest,
  reasonForTag,
} from "./scoring";

export {
  scorePersonMatch,
  scoreProjectMatch,
  scoreCommunityMatch,
  scoreOrganizationMatch,
  scoreMissionMatch,
  scoreAllMatches,
} from "./matchers";

export { buildCompatibilityProfile } from "./profile-vector";
export { fetchOpportunityCandidates } from "./data";
export { getOpportunityRecommendations, getCompatibilityProfile } from "./service";

export type {
  CompatibilityProfile,
  OpportunityCategory,
  OpportunityRecommendations,
  ScoredRecommendation,
  ScoreFactor,
  OpportunityCandidatePool,
} from "./types";
