import type { OpportunityCategory } from "@/engines/opportunity";

const ACTION_LABELS: Record<OpportunityCategory, string> = {
  people: "Meet this person",
  projects: "Open project",
  communities: "Explore community",
  organizations: "View organization",
  missions: "Start mission",
};

export function recommendationActionLabel(category: OpportunityCategory) {
  return ACTION_LABELS[category];
}
