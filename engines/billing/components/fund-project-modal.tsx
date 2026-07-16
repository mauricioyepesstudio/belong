"use client";

import { createProjectFundingCheckout } from "@/lib/actions/billing";
import { Button, Input, Label, Modal, ProgressBar, useToast } from "@/systems/design-system";
import { formatCents } from "@/engines/billing/config";
import { MIN_FUNDING_CENTS } from "@/lib/stripe/config";
import type { Project } from "@/types/database.types";
import { useState, useTransition } from "react";

type FundProjectModalProps = {
  open: boolean;
  onClose: () => void;
  project: Pick<
    Project,
    "id" | "name" | "funding_goal_cents" | "funding_raised_cents" | "funding_enabled"
  >;
};

export function FundProjectModal({ open, onClose, project }: FundProjectModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("25");
  const [isPending, startTransition] = useTransition();

  const goal = project.funding_goal_cents ?? 0;
  const raised = project.funding_raised_cents ?? 0;
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(amount);
    if (Number.isNaN(dollars)) {
      toast("Enter a valid amount", "error");
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents < MIN_FUNDING_CENTS) {
      toast(`Minimum is $${(MIN_FUNDING_CENTS / 100).toFixed(2)}`, "error");
      return;
    }

    startTransition(async () => {
      const result = await createProjectFundingCheckout(project.id, cents);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Back ${project.name}`}
      description="Support this project with a one-time contribution."
    >
      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-fg-muted">Raised</span>
          <span className="font-medium">
            {formatCents(raised)}
            {goal > 0 ? ` of ${formatCents(goal)}` : ""}
          </span>
        </div>
        {goal > 0 && <ProgressBar value={progress} />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fund-amount">Contribution (USD)</Label>
          <Input
            id="fund-amount"
            type="number"
            min={MIN_FUNDING_CENTS / 100}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" isLoading={isPending}>
            Continue to checkout
          </Button>
        </div>
      </form>
    </Modal>
  );
}
