"use client";

import { createProofChallenge } from "@/lib/actions/proof";
import { PROOF_CHALLENGE_TYPE_LABELS } from "@/lib/core/proof";
import type { ProofChallengeType } from "@/types/database.types";
import { Button, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CHALLENGE_TYPES = Object.entries(PROOF_CHALLENGE_TYPE_LABELS) as [ProofChallengeType, string][];

type CreateChallengeModalProps = {
  claimId: string;
  disabled?: boolean;
};

/**
 * The CHALLENGE product verb (BELONG_PROOF_LOOP.md): "invite other people
 * or organizations to support, counter, improve, test, or execute" a claim.
 */
export function CreateChallengeModal({ claimId, disabled }: CreateChallengeModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleCreateChallenge = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProofChallenge({
        claimId,
        challengeType: formData.get("challengeType") as ProofChallengeType,
        body: formData.get("body") as string,
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Challenge posted", "success");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="brand" className="rounded-2xl" onClick={() => setOpen(true)} disabled={disabled}>
        <MessageSquare className="h-4 w-4" aria-hidden />
        Challenge this
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Challenge this claim"
        description="Test it, support it with evidence, counter it, propose an improvement, or execute it."
      >
        <form action={handleCreateChallenge} className="space-y-4">
          <div>
            <Label htmlFor="challenge-type">How are you challenging it?</Label>
            <select
              id="challenge-type"
              name="challengeType"
              required
              defaultValue="test"
              className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              {CHALLENGE_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="challenge-body">Details</Label>
            <Textarea
              id="challenge-body"
              name="body"
              required
              placeholder="What are you testing, supporting, countering, improving, or executing?"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              Post challenge
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
