/**
 * Deterministic compatibility scoring for the Opportunity Engine.
 * All weights and helpers are exported for transparency and testing.
 */

export const SCORE_WEIGHTS = {
  skillOverlap: 35,
  interestOverlap: 25,
  buildGoalMatch: 20,
  sharedCommunity: 15,
  locationMatch: 10,
  sharedProject: 10,
  roleMatch: 8,
  tagMatch: 15,
  textOverlap: 12,
  activityAlignment: 8,
  pendingMissionBoost: 12,
  activeStatusBoost: 5,
} as const;

export type ScoreFactorInput = {
  key: keyof typeof SCORE_WEIGHTS | string;
  weight: number;
  /** 0–1 strength of this signal */
  strength: number;
  reason: string;
};

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function tokenize(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

export function uniqueTokens(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const token = normalizeToken(value);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map(normalizeToken));
  const setB = new Set(b.map(normalizeToken));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function overlapMatches(source: string[], target: string[]): string[] {
  const targetSet = new Set(target.map(normalizeToken));
  return source.filter((item) => targetSet.has(normalizeToken(item)));
}

export function extractLocationCity(location: string | null | undefined): string | null {
  if (!location?.trim()) return null;
  const city = location.split(",")[0]?.trim();
  return city ? normalizeToken(city) : null;
}

export function locationMatches(
  userLocation: string | null | undefined,
  targetLocation: string | null | undefined
): boolean {
  const userCity = extractLocationCity(userLocation);
  const targetCity = extractLocationCity(targetLocation);
  return Boolean(userCity && targetCity && userCity === targetCity);
}

export function textContainsAny(source: string | null | undefined, needles: string[]): string[] {
  if (!source?.trim() || needles.length === 0) return [];
  const haystack = source.toLowerCase();
  return needles.filter((needle) => haystack.includes(normalizeToken(needle)));
}

export function computeCompatibilityScore(factors: ScoreFactorInput[]): {
  score: number;
  factors: Array<{ key: string; weight: number; score: number; reason: string }>;
} {
  if (factors.length === 0) {
    return { score: 0, factors: [] };
  }

  const weighted = factors.map((factor) => ({
    key: factor.key,
    weight: factor.weight,
    score: Math.round(factor.weight * Math.min(1, Math.max(0, factor.strength))),
    reason: factor.reason,
  }));

  const maxPossible = factors.reduce((sum, f) => sum + f.weight, 0);
  const raw = weighted.reduce((sum, f) => sum + f.score, 0);
  const score = maxPossible === 0 ? 0 : Math.round((raw / maxPossible) * 100);

  return { score, factors: weighted };
}

export function pickTopReasons(
  factors: Array<{ score: number; reason: string }>,
  limit = 2
): string[] {
  const seen = new Set<string>();
  const reasons: string[] = [];
  for (const factor of [...factors].sort((a, b) => b.score - a.score)) {
    if (!factor.reason || seen.has(factor.reason)) continue;
    seen.add(factor.reason);
    reasons.push(factor.reason);
    if (reasons.length >= limit) break;
  }
  return reasons;
}

export function formatBuildGoalLabel(goal: string | null | undefined): string {
  if (!goal) return "your goals";
  return goal.replace(/_/g, " ");
}

export function reasonForSkillMatch(skill: string, entityLabel: string): string {
  return `Because your ${skill} skills match this ${entityLabel}`;
}

export function reasonForInterest(interest: string): string {
  return `Because you are interested in ${interest}`;
}

export function reasonForBuildGoal(goal: string): string {
  return `Because you're building toward ${formatBuildGoalLabel(goal)}`;
}

export function reasonForCommunity(communityName: string): string {
  return `Because you joined ${communityName}`;
}

export function reasonForLocation(city: string): string {
  return `Because you're both in ${city}`;
}

export function reasonForSharedProject(projectName: string): string {
  return `Because you're both contributing to ${projectName}`;
}

export function reasonForTag(tag: string): string {
  return `Because this community focuses on ${tag}`;
}

export function reasonForMissionInterest(interest: string): string {
  return `Because this mission aligns with your interest in ${interest}`;
}
