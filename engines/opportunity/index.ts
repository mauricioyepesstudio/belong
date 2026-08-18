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
  buildExplanationBullets,
  buildRecommendationExplanation,
  buildRecommendationDetails,
  buildScoreBreakdown,
  bulletsToReasons,
  computeConfidenceLevel,
  confidenceLabel,
  confidenceVariant,
} from "./explanation";

export {
  scorePersonMatch,
  scoreProjectMatch,
  scoreCommunityMatch,
  scoreOrganizationMatch,
  scoreMissionMatch,
  scoreAllMatches,
} from "./matchers";

export {
  buildCompatibilityProfile,
  buildOpportunityGraphContext,
  resolveMutualCollaborators,
  resolveSharedCommunityNames,
  resolveSharedProjectNames,
} from "./profile-vector";
export { fetchOpportunityCandidates, fetchPeopleCandidates } from "./data";
export { getOpportunityRecommendations, getCompatibilityProfile } from "./service";
export { OpportunityScreen } from "./components/opportunity-screen";
export {
  discoverPeople,
  discoverPeopleForHome,
  DISCOVERY_CATEGORIES,
} from "./discovery";

export type {
  CompatibilityProfile,
  ConfidenceLevel,
  ExplanationBullet,
  ExplanationBulletKind,
  MatchSignals,
  OpportunityCategory,
  OpportunityGraphContext,
  OpportunityRecommendations,
  RecommendationDetails,
  RecommendationExplanation,
  ScoredRecommendation,
  ScoreBreakdown,
  ScoreFactor,
  OpportunityCandidatePool,
} from "./types";

export type {
  DiscoveryCategory,
  DiscoveryPerson,
  DiscoverPeopleOptions,
  DiscoverPeopleResult,
} from "./discovery";
export type { FetchPeopleCandidatesOptions } from "./data";
