import type {
  OpportunityRecommendations,
  ScoredRecommendation,
} from "@/engines/opportunity";

const recommendationSections: Array<keyof OpportunityRecommendations> = [
  "people",
  "projects",
  "communities",
  "organizations",
  "missions",
];

function recommendationKey(item: ScoredRecommendation): string {
  const actionHref = item.meta?.actionHref ?? item.href;
  return [item.category, item.title.trim().toLowerCase(), actionHref].join("|");
}

export function selectCompactRecommendations(
  recommendations: OpportunityRecommendations,
  limit = 4
): ScoredRecommendation[] {
  const sorted = recommendationSections
    .flatMap((section) => recommendations[section])
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();

  return sorted.filter((item) => {
    const key = recommendationKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
