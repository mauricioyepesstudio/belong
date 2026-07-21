import {
  computeCompatibilityScore,
  formatBuildGoalLabel,
  jaccardSimilarity,
  locationMatches,
  overlapMatches,
  pickTopReasons,
  reasonForBuildGoal,
  reasonForCommunity,
  reasonForInterest,
  reasonForLocation,
  reasonForMissionInterest,
  reasonForSharedProject,
  reasonForSkillMatch,
  reasonForTag,
  SCORE_WEIGHTS,
  textContainsAny,
  tokenize,
  type ScoreFactorInput,
} from "./scoring";
import type {
  CommunityCandidate,
  CompatibilityProfile,
  MissionCandidate,
  OrganizationCandidate,
  PersonCandidate,
  ProjectCandidate,
  ScoredRecommendation,
} from "./types";

const MIN_SCORE = 12;
const LIMIT = 4;

function toRecommendation(
  category: ScoredRecommendation["category"],
  id: string,
  title: string,
  subtitle: string | undefined,
  href: string,
  factors: ScoreFactorInput[],
  meta?: Record<string, string | null>
): ScoredRecommendation | null {
  const result = computeCompatibilityScore(factors);
  if (result.score < MIN_SCORE) return null;

  const reasons = pickTopReasons(result.factors);
  if (reasons.length === 0) return null;

  return {
    id,
    category,
    title,
    subtitle,
    href,
    score: result.score,
    reasons,
    factors: result.factors,
    meta,
  };
}

function sharedCommunityFactor(
  profile: CompatibilityProfile,
  candidateCommunityIds: string[]
): ScoreFactorInput | null {
  const sharedId = profile.communityIds.find((id) => candidateCommunityIds.includes(id));
  if (!sharedId) return null;
  const name = profile.communityNames[sharedId] ?? "a shared community";
  return {
    key: "sharedCommunity",
    weight: SCORE_WEIGHTS.sharedCommunity,
    strength: 1,
    reason: reasonForCommunity(name),
  };
}

export function scorePersonMatch(
  profile: CompatibilityProfile,
  candidate: PersonCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];

  const skillMatches = overlapMatches(profile.skills, candidate.skills);
  if (skillMatches.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillMatches.length / 2),
      reason: reasonForSkillMatch(skillMatches[0], "person"),
    });
  }

  const interestMatches = overlapMatches(profile.interests, candidate.interests);
  if (interestMatches.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, interestMatches.length / 2),
      reason: reasonForInterest(interestMatches[0]),
    });
  }

  if (profile.buildGoal && candidate.buildGoal === profile.buildGoal) {
    factors.push({
      key: "buildGoalMatch",
      weight: SCORE_WEIGHTS.buildGoalMatch,
      strength: 1,
      reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
    });
  }

  const sharedCommunity = sharedCommunityFactor(profile, candidate.communityIds);
  if (sharedCommunity) factors.push(sharedCommunity);

  if (locationMatches(profile.location, candidate.location)) {
    const city = profile.location?.split(",")[0]?.trim() ?? "your area";
    factors.push({
      key: "locationMatch",
      weight: SCORE_WEIGHTS.locationMatch,
      strength: 1,
      reason: reasonForLocation(city),
    });
  }

  if (profile.role && candidate.role && profile.role.toLowerCase() === candidate.role.toLowerCase()) {
    factors.push({
      key: "roleMatch",
      weight: SCORE_WEIGHTS.roleMatch,
      strength: 1,
      reason: `Because you both work as ${profile.role}s`,
    });
  }

  const bioMatches = textContainsAny(candidate.bio, [...profile.interests, ...profile.skills]);
  if (bioMatches.length > 0) {
    factors.push({
      key: "textOverlap",
      weight: SCORE_WEIGHTS.textOverlap,
      strength: Math.min(1, bioMatches.length / 2),
      reason: reasonForInterest(bioMatches[0]),
    });
  }

  return toRecommendation(
    "people",
    candidate.id,
    candidate.fullName ?? "Builder",
    candidate.role ?? undefined,
    `/community?tab=people&q=${encodeURIComponent(candidate.fullName ?? "")}`,
    factors,
    { avatarUrl: candidate.avatarUrl }
  );
}

export function scoreProjectMatch(
  profile: CompatibilityProfile,
  candidate: ProjectCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const projectText = `${candidate.name} ${candidate.description ?? ""} ${candidate.communityTag ?? ""}`;

  const skillMatches = textContainsAny(projectText, profile.skills);
  if (skillMatches.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillMatches.length / 2),
      reason: reasonForSkillMatch(skillMatches[0], "project"),
    });
  }

  const interestMatches = textContainsAny(projectText, profile.interests);
  if (interestMatches.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, interestMatches.length / 2),
      reason: reasonForInterest(interestMatches[0]),
    });
  }

  if (profile.communityIds.includes(candidate.communityId)) {
    factors.push({
      key: "sharedCommunity",
      weight: SCORE_WEIGHTS.sharedCommunity,
      strength: 1,
      reason: reasonForCommunity(candidate.communityName),
    });
  }

  if (candidate.communityTag) {
    const tagMatches = textContainsAny(candidate.communityTag, profile.interests);
    if (tagMatches.length > 0 || profile.buildGoal === candidate.communityTag.toLowerCase()) {
      factors.push({
        key: "tagMatch",
        weight: SCORE_WEIGHTS.tagMatch,
        strength: 1,
        reason: reasonForTag(candidate.communityTag),
      });
    }
  }

  if (candidate.status === "active") {
    factors.push({
      key: "activeStatusBoost",
      weight: SCORE_WEIGHTS.activeStatusBoost,
      strength: 1,
      reason: "Because this project is actively shipping",
    });
  }

  return toRecommendation(
    "projects",
    candidate.id,
    candidate.name,
    candidate.communityName,
    `/projects/${candidate.id}`,
    factors
  );
}

export function scoreCommunityMatch(
  profile: CompatibilityProfile,
  candidate: CommunityCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const communityText = `${candidate.name} ${candidate.description ?? ""} ${candidate.tag ?? ""}`;

  const interestMatches = textContainsAny(communityText, profile.interests);
  if (interestMatches.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, interestMatches.length / 2),
      reason: reasonForInterest(interestMatches[0]),
    });
  }

  const skillMatches = textContainsAny(communityText, profile.skills);
  if (skillMatches.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillMatches.length / 2),
      reason: reasonForSkillMatch(skillMatches[0], "community"),
    });
  }

  if (candidate.tag) {
    factors.push({
      key: "tagMatch",
      weight: SCORE_WEIGHTS.tagMatch,
      strength: jaccardSimilarity(tokenize(candidate.tag), tokenize(profile.buildGoal ?? "")) || 0.75,
      reason: reasonForTag(candidate.tag),
    });
  }

  if (profile.buildGoal) {
    const goalMatches = textContainsAny(communityText, [formatBuildGoalLabel(profile.buildGoal)]);
    if (goalMatches.length > 0) {
      factors.push({
        key: "buildGoalMatch",
        weight: SCORE_WEIGHTS.buildGoalMatch,
        strength: 1,
        reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
      });
    }
  }

  return toRecommendation(
    "communities",
    candidate.id,
    candidate.name,
    candidate.tag ?? `${candidate.memberCount} members`,
    `/community/${candidate.slug}`,
    factors
  );
}

export function scoreOrganizationMatch(
  profile: CompatibilityProfile,
  candidate: OrganizationCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const orgText = `${candidate.name} ${candidate.description ?? ""} ${candidate.communityTags.join(" ")}`;

  const skillMatches = textContainsAny(orgText, profile.skills);
  if (skillMatches.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillMatches.length / 2),
      reason: `Because ${candidate.name} is looking for ${skillMatches[0]} skills`,
    });
  }

  const interestMatches = textContainsAny(orgText, profile.interests);
  if (interestMatches.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, interestMatches.length / 2),
      reason: reasonForInterest(interestMatches[0]),
    });
  }

  if (candidate.communityTags.length > 0) {
    const tagMatches = overlapMatches(
      candidate.communityTags,
      profile.interests.map((i) => i.toLowerCase())
    );
    if (tagMatches.length > 0) {
      factors.push({
        key: "tagMatch",
        weight: SCORE_WEIGHTS.tagMatch,
        strength: 1,
        reason: reasonForTag(tagMatches[0]),
      });
    }
  }

  return toRecommendation(
    "organizations",
    candidate.id,
    candidate.name,
    candidate.description?.slice(0, 80) ?? undefined,
    `/organizations/${candidate.slug}`,
    factors
  );
}

export function scoreMissionMatch(
  profile: CompatibilityProfile,
  candidate: MissionCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const missionText = `${candidate.title} ${candidate.description ?? ""}`;

  const interestMatches = textContainsAny(missionText, profile.interests);
  if (interestMatches.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, interestMatches.length / 2),
      reason: reasonForMissionInterest(interestMatches[0]),
    });
  }

  const skillMatches = textContainsAny(missionText, profile.skills);
  if (skillMatches.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillMatches.length / 2),
      reason: reasonForSkillMatch(skillMatches[0], "mission"),
    });
  }

  if (profile.buildGoal) {
    const goalMatches = textContainsAny(missionText, [formatBuildGoalLabel(profile.buildGoal)]);
    if (goalMatches.length > 0) {
      factors.push({
        key: "buildGoalMatch",
        weight: SCORE_WEIGHTS.buildGoalMatch,
        strength: 1,
        reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
      });
    }
  }

  if (candidate.status === "pending" || candidate.status === "active") {
    factors.push({
      key: "pendingMissionBoost",
      weight: SCORE_WEIGHTS.pendingMissionBoost,
      strength: 1,
      reason: candidate.kind === "daily" ? "Because this is your next daily mission" : "Because this weekly goal matches your focus",
    });
  }

  if (profile.activityModules.length > 0) {
    const moduleMatches = textContainsAny(missionText, profile.activityModules);
    if (moduleMatches.length > 0) {
      factors.push({
        key: "activityAlignment",
        weight: SCORE_WEIGHTS.activityAlignment,
        strength: 1,
        reason: "Because you've been active in similar areas",
      });
    }
  }

  return toRecommendation(
    "missions",
    candidate.id,
    candidate.title,
    candidate.kind === "daily" ? "Daily mission" : "Weekly goal",
    candidate.href,
    factors
  );
}

function sortAndLimit(items: ScoredRecommendation[]): ScoredRecommendation[] {
  return [...items].sort((a, b) => b.score - a.score).slice(0, LIMIT);
}

export function scoreAllMatches(
  profile: CompatibilityProfile,
  candidates: {
    people: PersonCandidate[];
    projects: ProjectCandidate[];
    communities: CommunityCandidate[];
    organizations: OrganizationCandidate[];
    missions: MissionCandidate[];
  }
) {
  return {
    people: sortAndLimit(
      candidates.people
        .map((candidate) => scorePersonMatch(profile, candidate))
        .filter((item): item is ScoredRecommendation => item !== null)
    ),
    projects: sortAndLimit(
      candidates.projects
        .map((candidate) => scoreProjectMatch(profile, candidate))
        .filter((item): item is ScoredRecommendation => item !== null)
    ),
    communities: sortAndLimit(
      candidates.communities
        .map((candidate) => scoreCommunityMatch(profile, candidate))
        .filter((item): item is ScoredRecommendation => item !== null)
    ),
    organizations: sortAndLimit(
      candidates.organizations
        .map((candidate) => scoreOrganizationMatch(profile, candidate))
        .filter((item): item is ScoredRecommendation => item !== null)
    ),
    missions: sortAndLimit(
      candidates.missions
        .map((candidate) => scoreMissionMatch(profile, candidate))
        .filter((item): item is ScoredRecommendation => item !== null)
    ),
  };
}

export { sharedCommunityFactor, reasonForSharedProject };
