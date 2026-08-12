import type { CoachRecommendation } from "@/engines/belong/recommendation";

export type HomeHeroAction = {
  kind: "href" | "join-community" | "create-project";
  label: string;
  href?: string;
};

export function resolveHomeHeroActions(
  stats: { communities: number; connections: number; projects: number },
  recommendation: CoachRecommendation
): { primary: HomeHeroAction; secondary: HomeHeroAction } {
  if (stats.communities === 0) {
    return {
      primary: { kind: "join-community", label: "Find a community" },
      secondary: { kind: "href", label: "Meet builders", href: "/community?tab=people" },
    };
  }

  if (stats.connections === 0) {
    return {
      primary: { kind: "href", label: "Meet builders", href: "/community?tab=people" },
      secondary: { kind: "create-project", label: "Create a project" },
    };
  }

  if (stats.projects === 0) {
    return {
      primary: { kind: "create-project", label: "Create your first project" },
      secondary: { kind: "href", label: "Grow your network", href: "/community?tab=people" },
    };
  }

  return {
    primary: {
      kind: "href",
      label: recommendation.actionLabel,
      href: recommendation.actionHref,
    },
    secondary: { kind: "create-project", label: "Create project" },
  };
}
