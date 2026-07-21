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
export { fetchOpportunityCandidates } from "./data";
export { getOpportunityRecommendations, getCompatibilityProfile } from "./service";

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
