import type { MarketplaceListing } from "@/types/database.types";

/**
 * BELONG Resources — presentational-only category derived from a listing's
 * title/description text. There is no `category` column on
 * `marketplace_listings`; this is a client-facing heuristic, not a source of
 * truth. Kept in its own file (no Supabase/server imports) so client
 * components can import it without pulling server-only code into the bundle.
 */
export type ResourceCategory = "tools" | "guidance" | "learning" | "funding" | "services";
export type ResourceType = "product" | "service";

export const RESOURCE_CATEGORIES: { id: ResourceCategory; label: string }[] = [
  { id: "tools", label: "Tools & templates" },
  { id: "guidance", label: "Guidance" },
  { id: "learning", label: "Learning" },
  { id: "funding", label: "Funding & launch" },
  { id: "services", label: "Services" },
];

const RESOURCE_CATEGORY_KEYWORDS: Record<Exclude<ResourceCategory, "services">, string[]> = {
  tools: ["template", "tool", "boilerplate", "kit", "starter kit", "toolkit", "plugin"],
  guidance: ["mentor", "coaching", "coach", "advice", "guidance", "review", "consult", "feedback"],
  learning: ["course", "workshop", "class", "learn", "tutorial", "training"],
  funding: ["fund", "grant", "invest", "launch", "capital", "pitch"],
};

const SERVICE_KEYWORDS = [
  "service", "consult", "coaching", "coach", "design", "marketing", "development",
  "developer", "professional", "support", "strategy", "review", "audit", "session",
];

export function deriveResourceType(
  listing: Pick<MarketplaceListing, "title" | "description">
): ResourceType {
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();
  return SERVICE_KEYWORDS.some((keyword) => text.includes(keyword)) ? "service" : "product";
}

/**
 * Best-guess category for a listing, derived purely from its existing text
 * fields. Falls back to "services" when nothing matches — an intentional,
 * spec-approved tradeoff given we're not allowed to add a schema column.
 */
export function deriveResourceCategory(
  listing: Pick<MarketplaceListing, "title" | "description">
): ResourceCategory {
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();

  for (const [category, keywords] of Object.entries(RESOURCE_CATEGORY_KEYWORDS) as [
    Exclude<ResourceCategory, "services">,
    string[],
  ][]) {
    if (keywords.some((keyword) => text.includes(keyword))) return category;
  }

  return "services";
}

export function resourceCategoryLabel(category: ResourceCategory): string {
  return RESOURCE_CATEGORIES.find((c) => c.id === category)?.label ?? "Services";
}
