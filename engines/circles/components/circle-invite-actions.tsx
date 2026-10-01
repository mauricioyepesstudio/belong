"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToCircleInvite } from "@/lib/actions/circles";
import { Button, useToast } from "@/systems/design-system";

type CircleInviteActionsProps = {
  circleId: string;
  circleName: string;
};

export function CircleInviteActions({ circleId, circleName }: CircleInviteActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const respond = (accept: boolean) => {
    startTransition(async () => {
      const result = await respondToCircleInvite(circleId, accept);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(accept ? `You joined ${circleName}` : `Invite declined`, "success");
      router.refresh();
    });
  };

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="brand"
        size="sm"
        disabled={isPending}
        isLoading={isPending}
        onClick={() => respond(true)}
      >
        Accept
      </Button>
      <Button variant="ghost" size="sm" disabled={isPending} onClick={() => respond(false)}>
        Decline
      </Button>
    </div>
  );
}
