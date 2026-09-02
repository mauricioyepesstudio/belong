"use client";

import { CollaborationConfirmedCelebration } from "./collaboration-confirmed-celebration";
import {
  cancelCollaborationProposal,
  confirmCollaboration,
  declineCollaboration,
} from "@/lib/actions/collaboration";
import { Button, useToast } from "@/systems/design-system";
import type { ActionResult } from "@/lib/actions/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CollaborationRecordActionsProps =
  | {
      recordId: string;
      mode: "cancel";
    }
  | {
      recordId: string;
      mode: "respond";
      partnerName: string;
      partnerAvatarUrl?: string | null;
      summary: string;
    };

export function CollaborationRecordActions(props: CollaborationRecordActionsProps) {
  const { recordId } = props;
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCelebration, setShowCelebration] = useState(false);

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

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmCollaboration(recordId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      // Deliberately do NOT router.refresh() yet: this record's own
      // CollaborationCard (and this component) lives inside the server
      // list being refreshed, so refreshing now would let the parent
      // re-render without this now-confirmed record and unmount the
      // celebration mid-animation. Refresh happens once the user
      // dismisses instead — see handleCelebrationClose.
      setShowCelebration(true);
    });
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    router.refresh();
  };

  if (props.mode === "cancel") {
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
    <>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="brand"
          size="sm"
          disabled={isPending}
          isLoading={isPending}
          onClick={handleConfirm}
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
      <CollaborationConfirmedCelebration
        open={showCelebration}
        onClose={handleCelebrationClose}
        partnerName={props.partnerName}
        partnerAvatarUrl={props.partnerAvatarUrl}
        summary={props.summary}
      />
    </>
  );
}
