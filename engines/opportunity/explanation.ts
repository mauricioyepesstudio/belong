/**
 * Deterministic explanation builder for explainable recommendations.
 */

import { computeCompatibilityScore, type ScoreFactorInput } from "./scoring";
import type {
  ConfidenceLevel,
  ExplanationBullet,
  MatchSignals,
  RecommendationDetails,
  RecommendationExplanation,
  ScoreBreakdown,
} from "./types";

export function computeConfidenceLevel(score: number, bulletCount: number): ConfidenceLevel {
  if (score >= 70 && bulletCount >= 3) return "high";
  if (score >= 45 && bulletCount >= 2) return "medium";
  return "low";
}

export function buildScoreBreakdown(
  factors: ScoreFactorInput[],
  scoreResult = computeCompatibilityScore(factors)
): ScoreBreakdown {
  const result = scoreResult;
  const weightedPoints = result.factors.reduce((sum, f) => sum + f.score, 0);
  const maxPossiblePoints = result.maxPossiblePoints;
  const formula = result.formula;

  return {
    totalScore: result.score,
    weightedPoints,
    maxPossiblePoints,
    formula,
    factors: result.factors,
  };
}

export function buildExplanationBullets(signals: MatchSignals): ExplanationBullet[] {
  const bullets: ExplanationBullet[] = [];

  if (signals.sharedInterests.length > 0) {
    bullets.push({
      id: "shared-interests",
      kind: "shared_interests",
      label:
        signals.sharedInterests.length === 1
          ? `Shared interest: ${signals.sharedInterests[0]}`
          : `${signals.sharedInterests.length} shared interests`,
    });
  }

  if (signals.sharedSkills.length > 0) {
    bullets.push({
      id: "shared-skills",
      kind: "shared_skills",
      label:
        signals.sharedSkills.length === 1
          ? `Shared skill: ${signals.sharedSkills[0]}`
          : `${signals.sharedSkills.length} shared skills`,
    });
  }

  if (signals.sharedCommunities.length > 0) {
    bullets.push({
      id: "same-community",
      kind: "same_community",
      label:
        signals.sharedCommunities.length === 1
          ? `Same community: ${signals.sharedCommunities[0]}`
          : `${signals.sharedCommunities.length} shared communities`,
    });
  }

  if (signals.skillsNeeded.length > 0) {
    const skill = signals.skillsNeeded[0];
    bullets.push({
      id: "skills-needed",
      kind: "skills_needed",
      label:
        signals.skillsNeeded.length === 1
          ? `${skill} skills needed`
          : `${signals.skillsNeeded.slice(0, 2).join(", ")} skills needed`,
    });
  }

  if (signals.locationMatch && signals.locationLabel) {
    bullets.push({
      id: "nearby-location",
      kind: "nearby_location",
      label: `Nearby location: ${signals.locationLabel}`,
    });
  }

  if (signals.sharedProjects.length > 0) {
    bullets.push({
      id: "project-history",
      kind: "similar_project_history",
      label:
        signals.sharedProjects.length === 1
          ? `Similar project history: ${signals.sharedProjects[0]}`
          : `${signals.sharedProjects.length} shared projects`,
    });
  }

  if (signals.lookingForCollaborators) {
    bullets.push({
      id: "collaborators",
      kind: "looking_for_collaborators",
      label: "Looking for collaborators",
    });
  }

  if (signals.buildGoalMatch && signals.buildGoalLabel) {
    bullets.push({
      id: "build-goal",
      kind: "build_goal_match",
      label: `Same build goal: ${signals.buildGoalLabel}`,
    });
  }

  if (signals.activeProject) {
    bullets.push({
      id: "active-project",
      kind: "active_project",
      label: "Actively shipping",
    });
  }

  if (signals.tagMatch) {
    bullets.push({
      id: "tag-match",
      kind: "tag_match",
      label: `Focus area: ${signals.tagMatch}`,
    });
  }

  if (signals.missionAlignment) {
    bullets.push({
      id: "mission-alignment",
      kind: "mission_alignment",
      label: "Aligns with your mission focus",
    });
  }

  if (signals.activityMatch) {
    bullets.push({
      id: "activity-match",
      kind: "activity_match",
      label: "Matches your recent activity",
    });
  }

  return bullets;
}

export function buildRecommendationDetails(signals: MatchSignals): RecommendationDetails {
  return {
    sharedSkills: signals.sharedSkills,
    sharedCommunities: signals.sharedCommunities,
    sharedInterests: signals.sharedInterests,
    mutualCollaborators: signals.mutualCollaborators,
    currentOpportunities: signals.currentOpportunities,
  };
}

export function buildRecommendationExplanation(
  factors: ScoreFactorInput[],
  signals: MatchSignals,
  scoreResult?: ReturnType<typeof computeCompatibilityScore>
): RecommendationExplanation {
  const scoreBreakdown = buildScoreBreakdown(factors, scoreResult);
  const bullets = buildExplanationBullets(signals);

  return {
    bullets,
    confidence: computeConfidenceLevel(scoreBreakdown.totalScore, bullets.length),
    details: buildRecommendationDetails(signals),
    scoreBreakdown,
  };
}

/** Flatten bullets to legacy reason strings for backward compatibility. */
export function bulletsToReasons(bullets: ExplanationBullet[]): string[] {
  return bullets.map((b) => b.label);
}

export function confidenceLabel(level: ConfidenceLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function confidenceVariant(
  level: ConfidenceLevel
): "success" | "warning" | "outline" {
  if (level === "high") return "success";
  if (level === "medium") return "warning";
  return "outline";
}
