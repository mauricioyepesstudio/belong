"use client";

import { resolveProofClaim } from "@/lib/actions/proof";
import { PROOF_RESOLUTION_LABELS } from "@/lib/core/proof";
import type { ProofResolution } from "@/types/database.types";
import { Button, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const RESOLUTIONS = Object.entries(PROOF_RESOLUTION_LABELS) as [ProofResolution, string][];

type ResolveProofModalProps = {
  claimId: string;
};

/**
 * The OUTCOME step, available only to the claim's own author (RLS enforces
 * this server-side regardless — see resolveProofClaim). Per
 * BELONG_PROOF_PROTOCOL.md, "changing position after evidence should be
 * treated as intellectual growth, not humiliation," so that option is
 * framed as a positive checkbox rather than buried.
 */
export function ResolveProofModal({ claimId }: ResolveProofModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleResolve = (formData: FormData) => {
    startTransition(async () => {
      const result = await resolveProofClaim({
        claimId,
        resolution: formData.get("resolution") as ProofResolution,
        summary: formData.get("summary") as string,
        uncertaintyNotes: (formData.get("uncertaintyNotes") as string) || undefined,
        positionUpdated: formData.get("positionUpdated") === "on",
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Proof resolved", "success");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="brand" className="rounded-2xl" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Resolve
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Resolve this Proof"
        description="This is final — a Proof resolves once. Resolve against the success criteria, not who argued hardest."
      >
        <form action={handleResolve} className="space-y-4">
          <div>
            <Label htmlFor="resolve-resolution">Result</Label>
            <select
              id="resolve-resolution"
              name="resolution"
              required
              defaultValue="supported"
              className="mt-1 flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              {RESOLUTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="resolve-summary">What happened?</Label>
            <Textarea
              id="resolve-summary"
              name="summary"
              required
              placeholder="Summarize the result against the declared success criteria"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="resolve-uncertainty">Uncertainty or limitations (optional)</Label>
            <Textarea
              id="resolve-uncertainty"
              name="uncertaintyNotes"
              placeholder="What's still unclear, disputed, or incomplete?"
              rows={2}
            />
          </div>
          <label className="flex items-start gap-2 text-caption text-fg-secondary">
            <input type="checkbox" name="positionUpdated" className="mt-0.5" />
            My position changed because of this evidence — that&apos;s intellectual growth, not a loss.
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              Resolve Proof
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
