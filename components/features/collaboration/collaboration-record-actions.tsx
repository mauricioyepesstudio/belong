"use client";

import {
  cancelCollaborationProposal,
  confirmCollaboration,
  declineCollaboration,
} from "@/lib/actions/collaboration";
import { Button, useToast } from "@/systems/design-system";
import type { ActionResult } from "@/lib/actions/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type CollaborationRecordActionsProps = {
  recordId: string;
  mode: "respond" | "cancel";
};

export function CollaborationRecordActions({ recordId, mode }: CollaborationRecordActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(successMessage, "success");
      router.refresh();
    });
  };

  if (mode === "cancel") {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        isLoading={isPending}
        onClick={() => run(() => cancelCollaborationProposal(recordId), "Proposal withdrawn")}
      >
        Withdraw
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="brand"
        size="sm"
        disabled={isPending}
        isLoading={isPending}
        onClick={() => run(() => confirmCollaboration(recordId), "Collaboration confirmed")}
      >
        Confirm
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => run(() => declineCollaboration(recordId), "Collaboration declined")}
      >
        Decline
      </Button>
    </div>
  );
}
