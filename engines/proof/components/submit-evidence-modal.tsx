"use client";

import { submitProofEvidence } from "@/lib/actions/proof";
import { CLIENT_PROOF_EVIDENCE_PROVENANCE, PROOF_EVIDENCE_PROVENANCE_LABELS } from "@/lib/core/proof";
import type { ProofEvidenceProvenance } from "@/types/database.types";
import { Button, Input, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SubmitEvidenceModalProps = {
  claimId: string;
  disabled?: boolean;
};

/**
 * The EVIDENCE product object (BELONG_PROOF_LOOP.md): "traceable material
 * attached to a Proof ... Evidence must retain provenance and uncertainty."
 * Provenance options are limited to what a client submission can actually
 * set (see CLIENT_PROOF_EVIDENCE_PROVENANCE) — the stronger states
 * (organization/multi-party/independent review) aren't self-assignable.
 */
export function SubmitEvidenceModal({ claimId, disabled }: SubmitEvidenceModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmitEvidence = (formData: FormData) => {
    const body = (formData.get("body") as string) || undefined;
    const sourceUrl = (formData.get("sourceUrl") as string) || undefined;
    if (!body?.trim() && !sourceUrl?.trim()) {
      toast("Add a description or a source link", "error");
      return;
    }

    startTransition(async () => {
      const result = await submitProofEvidence({
        claimId,
        body,
        sourceUrl,
        provenance: formData.get("provenance") as ProofEvidenceProvenance,
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Evidence added", "success");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(true)} disabled={disabled}>
        <FileCheck className="h-4 w-4" aria-hidden />
        Add evidence
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add evidence"
        description="Traceable material toward this claim's success criteria — evidence can be disputed or incomplete, and that's fine."
      >
        <form action={handleSubmitEvidence} className="space-y-4">
          <div>
            <Label htmlFor="evidence-body">What happened? (optional if you have a source link)</Label>
            <Textarea
              id="evidence-body"
              name="body"
              placeholder="Describe the evidence"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="evidence-source">Source link (optional)</Label>
            <Input id="evidence-source" name="sourceUrl" type="url" placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="evidence-provenance">Provenance</Label>
            <select
              id="evidence-provenance"
              name="provenance"
              required
              defaultValue="self_reported"
              className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              {CLIENT_PROOF_EVIDENCE_PROVENANCE.map((value) => (
                <option key={value} value={value}>
                  {PROOF_EVIDENCE_PROVENANCE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              Add evidence
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
