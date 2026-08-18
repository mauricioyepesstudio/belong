import {
  bulletsToReasons,
  buildRecommendationExplanation,
} from "./explanation";
import {
  computeCompatibilityScore,
  formatBuildGoalLabel,
  jaccardSimilarity,
  locationMatches,
  overlapMatches,
  reasonForBuildGoal,
  reasonForCommunity,
  reasonForInterest,
  reasonForLocation,
  reasonForMissionInterest,
  reasonForSkillMatch,
  reasonForTag,
  SCORE_WEIGHTS,
  textContainsAny,
  tokenize,
  type ScoreFactorInput,
} from "./scoring";
import {
  resolveMutualCollaborators,
  resolveSharedCommunityNames,
  resolveSharedProjectNames,
} from "./profile-vector";
import type {
  CommunityCandidate,
  CompatibilityProfile,
  MatchSignals,
  MissionCandidate,
  OpportunityGraphContext,
  OrganizationCandidate,
  PersonCandidate,
  ProjectCandidate,
  ScoredRecommendation,
} from "./types";

const MIN_SCORE = 12;
const LIMIT = 4;

type PersonMatchOptions = {
  minimumScore?: number;
  requireExplanation?: boolean;
};

function toRecommendation(
  category: ScoredRecommendation["category"],
  id: string,
  title: string,
  subtitle: string | undefined,
  href: string,
  factors: ScoreFactorInput[],
  signals: MatchSignals,
  meta?: Record<string, string | null>,
  options: PersonMatchOptions = {}
): ScoredRecommendation | null {
  const result = computeCompatibilityScore(factors);
  const minimumScore = options.minimumScore ?? MIN_SCORE;
  if (result.score < minimumScore) return null;

  const explanation = buildRecommendationExplanation(factors, signals);
  if ((options.requireExplanation ?? true) && explanation.bullets.length === 0) return null;

  return {
    id,
    category,
    title,
    subtitle,
    href,
    score: result.score,
    reasons: bulletsToReasons(explanation.bullets),
    factors: result.factors,
    explanation,
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
  candidate: PersonCandidate,
  context: OpportunityGraphContext,
  options: PersonMatchOptions = {}
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const sharedSkills = overlapMatches(profile.skills, candidate.skills);
  const sharedInterests = overlapMatches(profile.interests, candidate.interests);
  const sharedCommunities = resolveSharedCommunityNames(profile, candidate.communityIds);
  const sharedProjects = resolveSharedProjectNames(profile, candidate.projectIds);
  const mutualCollaborators = resolveMutualCollaborators(
    profile,
    candidate.communityIds,
    candidate.projectIds,
    context
  );
  const locationMatch = locationMatches(profile.location, candidate.location);
  const locationLabel = profile.location?.split(",")[0]?.trim();
  const buildGoalMatch = Boolean(
    profile.buildGoal && candidate.buildGoal === profile.buildGoal
  );

  if (sharedSkills.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, sharedSkills.length / 2),
      reason: reasonForSkillMatch(sharedSkills[0], "person"),
    });
  }

  if (sharedInterests.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, sharedInterests.length / 2),
      reason: reasonForInterest(sharedInterests[0]),
    });
  }

  if (buildGoalMatch && profile.buildGoal) {
    factors.push({
      key: "buildGoalMatch",
      weight: SCORE_WEIGHTS.buildGoalMatch,
      strength: 1,
      reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
    });
  }

  const sharedCommunity = sharedCommunityFactor(profile, candidate.communityIds);
  if (sharedCommunity) factors.push(sharedCommunity);

  if (locationMatch && locationLabel) {
    factors.push({
      key: "locationMatch",
      weight: SCORE_WEIGHTS.locationMatch,
      strength: 1,
      reason: reasonForLocation(locationLabel),
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

  if (sharedProjects.length > 0) {
    factors.push({
      key: "sharedProject",
      weight: SCORE_WEIGHTS.sharedProject,
      strength: Math.min(1, sharedProjects.length / 2),
      reason: `Because you both contribute to ${sharedProjects[0]}`,
    });
  }

  const currentOpportunities: string[] = [];
  if (sharedCommunities.length > 0) {
    currentOpportunities.push(`Active in ${sharedCommunities[0]}`);
  }
  if (candidate.bio?.toLowerCase().includes("building")) {
    currentOpportunities.push("Open to collaborating");
  }
  if (mutualCollaborators.length > 0) {
    currentOpportunities.push(`${mutualCollaborators.length} mutual connections`);
  }

  const signals: MatchSignals = {
    sharedSkills,
    sharedInterests,
    sharedCommunities,
    sharedProjects,
    mutualCollaborators,
    skillsNeeded: [],
    locationMatch,
    locationLabel,
    buildGoalMatch,
    buildGoalLabel: profile.buildGoal ? formatBuildGoalLabel(profile.buildGoal) : undefined,
    lookingForCollaborators:
      sharedCommunities.length > 0 && (sharedSkills.length > 0 || sharedInterests.length > 0),
    activeProject: false,
    missionAlignment: false,
    activityMatch: false,
    currentOpportunities,
  };

  return toRecommendation(
    "people",
    candidate.id,
    candidate.fullName ?? "Builder",
    candidate.role ?? undefined,
    `/community?tab=people&q=${encodeURIComponent(candidate.fullName ?? "")}`,
    factors,
    signals,
    { avatarUrl: candidate.avatarUrl },
    options
  );
}

export function scoreProjectMatch(
  profile: CompatibilityProfile,
  candidate: ProjectCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const isCommunityMember = profile.communityIds.includes(candidate.communityId);
  const requiresCommunityMembership = !isCommunityMember && Boolean(candidate.communitySlug);
  const projectText = `${candidate.name} ${candidate.description ?? ""} ${candidate.communityTag ?? ""}`;
  const skillsNeeded = textContainsAny(projectText, profile.skills);
  const sharedInterests = textContainsAny(projectText, profile.interests);
  const sharedCommunities = isCommunityMember ? [candidate.communityName] : [];

  if (skillsNeeded.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillsNeeded.length / 2),
      reason: reasonForSkillMatch(skillsNeeded[0], "project"),
    });
  }

  if (sharedInterests.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, sharedInterests.length / 2),
      reason: reasonForInterest(sharedInterests[0]),
    });
  }

  if (sharedCommunities.length > 0) {
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

  const activeProject = candidate.status === "active";
  if (activeProject) {
    factors.push({
      key: "activeStatusBoost",
      weight: SCORE_WEIGHTS.activeStatusBoost,
      strength: 1,
      reason: "Because this project is actively shipping",
    });
  }

  const currentOpportunities: string[] = [];
  if (activeProject) currentOpportunities.push("Actively recruiting contributors");
  if (candidate.status === "planning") currentOpportunities.push("Early-stage project");
  if (skillsNeeded.length > 0) {
    currentOpportunities.push(`Needs ${skillsNeeded.slice(0, 2).join(", ")}`);
  }

  const signals: MatchSignals = {
    sharedSkills: skillsNeeded,
    sharedInterests,
    sharedCommunities,
    sharedProjects: [],
    mutualCollaborators: [],
    skillsNeeded,
    locationMatch: false,
    buildGoalMatch: false,
    lookingForCollaborators: skillsNeeded.length > 0 && activeProject,
    activeProject,
    tagMatch: candidate.communityTag ?? undefined,
    missionAlignment: false,
    activityMatch: false,
    currentOpportunities,
  };

  return toRecommendation(
    "projects",
    candidate.id,
    candidate.name,
    candidate.communityName,
    `/projects/${candidate.id}`,
    factors,
    signals,
    {
      actionHref: requiresCommunityMembership
        ? `/community/${candidate.communitySlug}`
        : `/projects/${candidate.id}`,
      actionLabel: requiresCommunityMembership ? "Join community first" : "Open project",
      actionHint: requiresCommunityMembership
        ? `Join ${candidate.communityName} before contributing to this project.`
        : `You already belong to ${candidate.communityName}.`,
      requiresCommunityMembership: requiresCommunityMembership ? "true" : "false",
    }
  );
}

export function scoreCommunityMatch(
  profile: CompatibilityProfile,
  candidate: CommunityCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const communityText = `${candidate.name} ${candidate.description ?? ""} ${candidate.tag ?? ""}`;
  const sharedInterests = textContainsAny(communityText, profile.interests);
  const sharedSkills = textContainsAny(communityText, profile.skills);
  const buildGoalMatch = Boolean(
    profile.buildGoal &&
      textContainsAny(communityText, [formatBuildGoalLabel(profile.buildGoal)]).length > 0
  );

  if (sharedInterests.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, sharedInterests.length / 2),
      reason: reasonForInterest(sharedInterests[0]),
    });
  }

  if (sharedSkills.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, sharedSkills.length / 2),
      reason: reasonForSkillMatch(sharedSkills[0], "community"),
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

  if (buildGoalMatch && profile.buildGoal) {
    factors.push({
      key: "buildGoalMatch",
      weight: SCORE_WEIGHTS.buildGoalMatch,
      strength: 1,
      reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
    });
  }

  const currentOpportunities: string[] = [];
  if (candidate.memberCount > 0) {
    currentOpportunities.push(`${candidate.memberCount} members already building`);
  }
  currentOpportunities.push("Open to new members");

  const signals: MatchSignals = {
    sharedSkills,
    sharedInterests,
    sharedCommunities: [],
    sharedProjects: [],
    mutualCollaborators: [],
    skillsNeeded: sharedSkills,
    locationMatch: false,
    buildGoalMatch,
    buildGoalLabel: profile.buildGoal ? formatBuildGoalLabel(profile.buildGoal) : undefined,
    lookingForCollaborators: candidate.memberCount >= 3,
    activeProject: false,
    tagMatch: candidate.tag ?? undefined,
    missionAlignment: false,
    activityMatch: false,
    currentOpportunities,
  };

  return toRecommendation(
    "communities",
    candidate.id,
    candidate.name,
    candidate.tag ?? `${candidate.memberCount} members`,
    `/community/${candidate.slug}`,
    factors,
    signals
  );
}

export function scoreOrganizationMatch(
  profile: CompatibilityProfile,
  candidate: OrganizationCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const orgText = `${candidate.name} ${candidate.description ?? ""} ${candidate.communityTags.join(" ")}`;
  const skillsNeeded = textContainsAny(orgText, profile.skills);
  const sharedInterests = textContainsAny(orgText, profile.interests);

  if (skillsNeeded.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, skillsNeeded.length / 2),
      reason: `Because ${candidate.name} is looking for ${skillsNeeded[0]} skills`,
    });
  }

  if (sharedInterests.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, sharedInterests.length / 2),
      reason: reasonForInterest(sharedInterests[0]),
    });
  }

  let tagMatch: string | undefined;
  if (candidate.communityTags.length > 0) {
    const tagMatches = overlapMatches(
      candidate.communityTags,
      profile.interests.map((i) => i.toLowerCase())
    );
    if (tagMatches.length > 0) {
      tagMatch = tagMatches[0];
      factors.push({
        key: "tagMatch",
        weight: SCORE_WEIGHTS.tagMatch,
        strength: 1,
        reason: reasonForTag(tagMatches[0]),
      });
    }
  }

  const currentOpportunities: string[] = [`Recruiting across ${candidate.communityTags.length || 1} focus areas`];
  if (skillsNeeded.length > 0) {
    currentOpportunities.push(`Seeking ${skillsNeeded.slice(0, 2).join(", ")} talent`);
  }

  const signals: MatchSignals = {
    sharedSkills: skillsNeeded,
    sharedInterests,
    sharedCommunities: [],
    sharedProjects: [],
    mutualCollaborators: [],
    skillsNeeded,
    locationMatch: false,
    buildGoalMatch: false,
    lookingForCollaborators: skillsNeeded.length > 0,
    activeProject: false,
    tagMatch,
    missionAlignment: false,
    activityMatch: false,
    currentOpportunities,
  };

  return toRecommendation(
    "organizations",
    candidate.id,
    candidate.name,
    candidate.description?.slice(0, 80) ?? undefined,
    `/organizations/${candidate.slug}`,
    factors,
    signals
  );
}

export function scoreMissionMatch(
  profile: CompatibilityProfile,
  candidate: MissionCandidate
): ScoredRecommendation | null {
  const factors: ScoreFactorInput[] = [];
  const missionText = `${candidate.title} ${candidate.description ?? ""}`;
  const sharedInterests = textContainsAny(missionText, profile.interests);
  const sharedSkills = textContainsAny(missionText, profile.skills);
  const buildGoalMatch = Boolean(
    profile.buildGoal &&
      textContainsAny(missionText, [formatBuildGoalLabel(profile.buildGoal)]).length > 0
  );
  const activityMatch =
    profile.activityModules.length > 0 &&
    textContainsAny(missionText, profile.activityModules).length > 0;

  if (sharedInterests.length > 0) {
    factors.push({
      key: "interestOverlap",
      weight: SCORE_WEIGHTS.interestOverlap,
      strength: Math.min(1, sharedInterests.length / 2),
      reason: reasonForMissionInterest(sharedInterests[0]),
    });
  }

  if (sharedSkills.length > 0) {
    factors.push({
      key: "skillOverlap",
      weight: SCORE_WEIGHTS.skillOverlap,
      strength: Math.min(1, sharedSkills.length / 2),
      reason: reasonForSkillMatch(sharedSkills[0], "mission"),
    });
  }

  if (buildGoalMatch && profile.buildGoal) {
    factors.push({
      key: "buildGoalMatch",
      weight: SCORE_WEIGHTS.buildGoalMatch,
      strength: 1,
      reason: reasonForBuildGoal(formatBuildGoalLabel(profile.buildGoal)),
    });
  }

  if (candidate.status === "pending" || candidate.status === "active") {
    factors.push({
      key: "pendingMissionBoost",
      weight: SCORE_WEIGHTS.pendingMissionBoost,
      strength: 1,
      reason:
        candidate.kind === "daily"
          ? "Because this is your next daily mission"
          : "Because this weekly goal matches your focus",
    });
  }

  if (activityMatch) {
    factors.push({
      key: "activityAlignment",
      weight: SCORE_WEIGHTS.activityAlignment,
      strength: 1,
      reason: "Because you've been active in similar areas",
    });
  }

  const currentOpportunities: string[] = [];
  if (candidate.kind === "daily" && candidate.status === "pending") {
    currentOpportunities.push("Pending daily mission");
  }
  if (candidate.kind === "weekly") {
    currentOpportunities.push("Active weekly goal");
  }

  const signals: MatchSignals = {
    sharedSkills,
    sharedInterests,
    sharedCommunities: [],
    sharedProjects: [],
    mutualCollaborators: [],
    skillsNeeded: sharedSkills,
    locationMatch: false,
    buildGoalMatch,
    buildGoalLabel: profile.buildGoal ? formatBuildGoalLabel(profile.buildGoal) : undefined,
    lookingForCollaborators: false,
    activeProject: false,
    missionAlignment: sharedInterests.length > 0 || sharedSkills.length > 0,
    activityMatch,
    currentOpportunities,
  };

  return toRecommendation(
    "missions",
    candidate.id,
    candidate.title,
    candidate.kind === "daily" ? "Daily mission" : "Weekly goal",
    candidate.href,
    factors,
    signals
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
  },
  context: OpportunityGraphContext
) {
  return {
    people: sortAndLimit(
      candidates.people
        .map((candidate) => scorePersonMatch(profile, candidate, context))
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
