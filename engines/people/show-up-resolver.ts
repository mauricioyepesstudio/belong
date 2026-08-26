import type { ShowUpKind, ShowUpState } from "@/types/show-up";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";

export interface PeopleStoryAction {
  kind: ShowUpKind;
  label: string;
  state: ShowUpState;
  intent: string;
  disabledReason?: string;
}

export function resolvePersonAction(person: DiscoveryPerson): PeopleStoryAction {
  if (person.connectionState.state === "connected") {
    return {
      kind: "COLLABORATE",
      label: "Message",
      state: "ACTIVE",
      intent: "Message person",
    };
  }

  if (person.connectionState.state.startsWith("pending")) {
    return {
      kind: "COLLABORATE",
      label: "Request sent",
      state: "PENDING",
      intent: "Pending request",
      disabledReason: "Connection request already sent",
    };
  }

  return {
    kind: "JOIN",
    label: "Connect",
    state: "AVAILABLE",
    intent: "Send connection request",
  };
}
