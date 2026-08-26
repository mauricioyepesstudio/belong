import type { ShowUpAction } from "@/types/show-up";
import type { CommunityDetail } from "@/lib/core";

export function resolveCommunityAction(
  data: CommunityDetail,
  isMember: boolean,
  isPending: boolean
): ShowUpAction {
  const { community } = data;

  if (isMember) {
    return {
      kind: "COLLABORATE",
      label: "Member",
      state: "ACTIVE",
      intent: "Community member",
      subjectType: "Community",
      subjectId: community.id,
      disabledReason: "Already a member",
    };
  }

  return {
    kind: "JOIN",
    label: community.is_paid ? "Subscribe" : "Join community",
    state: "AVAILABLE",
    intent: "Join community",
    destination: community.is_paid ? undefined : undefined, // Handled by existing action
    subjectType: "Community",
    subjectId: community.id,
  };
}
