"use client";

import { proposeCollaboration } from "@/lib/actions/collaboration";
import { Button, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CollaborationProposeDialogProps = {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
};

export function CollaborationProposeDialog({
  open,
  onClose,
  partnerId,
  partnerName,
}: CollaborationProposeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [summary, setSummary] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = summary.trim();
    if (!trimmed) {
      toast("A short summary is required", "error");
      return;
    }

    startTransition(async () => {
      const result = await proposeCollaboration(partnerId, trimmed);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(`Collaboration proposed to ${partnerName}`, "success");
      setSummary("");
      onClose();
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Propose a collaboration"
      description={`Describe what you and ${partnerName} worked on together. Once ${partnerName} confirms, it will be added to both of your impact passports.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="collaboration-summary">Summary</Label>
          <Textarea
            id="collaboration-summary"
            name="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder={`What did you and ${partnerName} build or accomplish together?`}
            rows={4}
            required
            disabled={isPending}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" isLoading={isPending} disabled={isPending}>
            Send proposal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
