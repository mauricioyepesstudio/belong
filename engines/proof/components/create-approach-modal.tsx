"use client";

import { createProofApproach } from "@/lib/actions/proof";
import { Button, Input, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CreateApproachModalProps = {
  challengeId: string;
};

/**
 * The APPROACH product object (BELONG_PROOF_LOOP.md): "a concrete method
 * proposed to address a Challenge." Deliberately allows any number of
 * approaches per challenge — BELONG shows competing tradeoffs rather than
 * picking one.
 */
export function CreateApproachModal({ challengeId }: CreateApproachModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleCreateApproach = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProofApproach({
        challengeId,
        title: formData.get("title") as string,
        body: (formData.get("body") as string) || undefined,
      });

      if (result.error) toast(result.error, "error");
      else {
        toast("Approach proposed", "success");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(true)}>
        <Lightbulb className="h-3.5 w-3.5" aria-hidden />
        Propose an approach
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Propose an approach"
        description="A concrete method to address this challenge. Other people can propose different approaches too."
      >
        <form action={handleCreateApproach} className="space-y-4">
          <div>
            <Label htmlFor="approach-title">Approach</Label>
            <Input id="approach-title" name="title" required placeholder="e.g. Community-led food distribution" />
          </div>
          <div>
            <Label htmlFor="approach-body">How would this work? (optional)</Label>
            <Textarea id="approach-body" name="body" placeholder="Describe the method" rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isPending}>
              Propose
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
