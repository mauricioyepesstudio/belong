import type { ShowUpAction } from "@/types/show-up";
import type { ScoredRecommendation } from "@/engines/opportunity/types";

export function resolveOpportunityAction(recommendation: ScoredRecommendation): ShowUpAction {
  // Map opportunity recommendation category to ShowUpKind
  const kindMap: Record<string, ShowUpAction["kind"]> = {
    people: "COLLABORATE",
    projects: "CONTRIBUTE",
    communities: "JOIN",
    organizations: "CONTRIBUTE",
    missions: "CONTRIBUTE",
  };

  return {
    kind: kindMap[recommendation.category] ?? "CONTRIBUTE",
    label: recommendation.meta?.actionLabel ?? "View",
    state: "AVAILABLE",
    intent: `Interact with ${recommendation.title}`,
    destination: recommendation.meta?.actionHref ?? recommendation.href,
    subjectType: recommendation.category,
    subjectId: recommendation.id,
  };
}
