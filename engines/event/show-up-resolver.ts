import type { ShowUpAction } from "@/types/show-up";
import type { EventWithMeta } from "@/lib/data/events";

export function resolveEventAction(event: EventWithMeta, isPending: boolean): ShowUpAction {
  return {
    kind: "ATTEND",
    label: event.registered ? "Registered" : "Register for event",
    state: event.registered ? "ACTIVE" : "AVAILABLE",
    intent: event.registered ? "Unregister" : "Register for event",
    subjectType: "Event",
    subjectId: event.id,
  };
}
