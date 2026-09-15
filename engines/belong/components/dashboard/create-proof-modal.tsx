"use client";

import { createProofClaim } from "@/lib/actions/proof";
import type { UserCommunity } from "@/lib/core";
import type { ProofClaimType } from "@/types/database.types";
import { Badge, Button, Input, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { Plus, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CLAIM_TYPES: { value: ProofClaimType; label: string }[] = [
  { value: "goal", label: "Goal" },
  { value: "commitment", label: "Commitment" },
  { value: "capability", label: "Capability" },
  { value: "solution", label: "Proposed solution" },
  { value: "predictive", label: "Prediction" },
  { value: "causal", label: "Causal claim" },
  { value: "factual", label: "Factual claim" },
  { value: "normative", label: "Normative / values claim" },
];

type CreateProofModalProps = {
  communities: UserCommunity[];
};

/**
 * The Proof creation entry point (BELONG_PROOF_LOOP.md V1 vertical slice,
 * item 1) on top of the createProofClaim server action. Self-contained
 * trigger + modal so it can be dropped into Home without new parent state.
 */
export function CreateProofModal({ communities }: CreateProofModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [criterionDraft, setCriterionDraft] = useState("");

  const addCriterion = () => {
    const value = criterionDraft.trim();
    if (!value) return;
    setCriteria((prev) => [...prev, value]);
    setCriterionDraft("");
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const resetAndClose = () => {
    setOpen(false);
    setCriteria([]);
    setCriterionDraft("");
  };

  const handleCreateProof = (formData: FormData) => {
    if (criteria.length === 0) {
      toast("Add at least one success criterion", "error");
      return;
    }

    startTransition(async () => {
      const result = await createProofClaim({
        title: formData.get("title") as string,
        claimType: formData.get("claimType") as ProofClaimType,
        body: (formData.get("body") as string) || undefined,
        communityId: (formData.get("communityId") as string) || undefined,
        standard: {
          successCriteria: criteria,
          problemStatement: (formData.get("problemStatement") as string) || undefined,
          deadline: (formData.get("deadline") as string) || undefined,
        },
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Proof created", "success");
        resetAndClose();
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(true)}>
        <Target className="h-4 w-4" aria-hidden />
        New Proof
      </Button>

      <Modal
        open={open}
        onClose={resetAndClose}
        title="Prove it"
        description="Turn a claim, goal, or commitment into something evidence can resolve."
      >
        <form action={handleCreateProof} className="space-y-4">
          <div>
            <Label htmlFor="proof-title">Claim / goal</Label>
            <Input
              id="proof-title"
              name="title"
              required
              placeholder="e.g. 20 founders will create 100 jobs in Miami in 30 days"
            />
          </div>

          <div>
            <Label htmlFor="proof-claim-type">Claim type</Label>
            <select
              id="proof-claim-type"
              name="claimType"
              required
              defaultValue="goal"
              className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              {CLAIM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {communities.length > 0 && (
            <div>
              <Label htmlFor="proof-community">Community (optional)</Label>
              <select
                id="proof-community"
                name="communityId"
                defaultValue=""
                className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
              >
                <option value="">Personal (not tied to a community)</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="proof-body">Details (optional)</Label>
            <Textarea id="proof-body" name="body" placeholder="Context for the claim" rows={2} />
          </div>

          <div>
            <Label htmlFor="proof-problem">Problem being addressed (optional)</Label>
            <Textarea
              id="proof-problem"
              name="problemStatement"
              placeholder="What problem does this claim or goal respond to?"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="proof-criterion">Success criteria</Label>
            <p className="mt-1 text-micro text-fg-faint">
              What would count as evidence this happened? Add at least one.
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                id="proof-criterion"
                value={criterionDraft}
                onChange={(e) => setCriterionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCriterion();
                  }
                }}
                placeholder="e.g. 100 verified full-time hires"
              />
              <Button type="button" variant="outline" onClick={addCriterion}>
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </Button>
            </div>
            {criteria.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {criteria.map((criterion, index) => (
                  <li key={`${criterion}-${index}`}>
                    <Badge variant="outline" className="gap-1.5 pr-1.5">
                      {criterion}
                      <button
                        type="button"
                        onClick={() => removeCriterion(index)}
                        aria-label={`Remove ${criterion}`}
                        className="rounded-full p-0.5 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="proof-deadline">Deadline (optional)</Label>
            <Input id="proof-deadline" name="deadline" type="date" min={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              <Target className="h-4 w-4" aria-hidden />
              Create Proof
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
