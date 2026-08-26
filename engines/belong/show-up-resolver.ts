import type { ShowUpAction } from "@/types/show-up";

// This resolver maps existing recommendation card intents.
export function resolveLiveBuilderAction(item: {
  id: string;
  category: string;
  title: string;
  meta?: Record<string, string | null>;
  href: string;
}): ShowUpAction {
  return {
    kind: "CONTRIBUTE",
    label: item.meta?.actionLabel ?? "View",
    state: "AVAILABLE",
    intent: `Interact with ${item.title}`,
    destination: item.meta?.actionHref ?? item.href,
    subjectType: item.category,
    subjectId: item.id,
  };
}
