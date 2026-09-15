"use client";

import { Button, useToast } from "@/systems/design-system";
import { Share2 } from "lucide-react";
import { useState } from "react";

type ShareProofButtonProps = {
  claimId: string;
};

/**
 * The SHARE step (BELONG_PROOF_LOOP.md V1 vertical slice, item 10):
 * "export the result to the wider internet as a distribution loop back
 * into BELONG." /proof/[id] is already that deep link — this just makes
 * it copyable.
 */
export function ShareProofButton({ claimId }: ShareProofButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/proof/${claimId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied", "success");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Couldn't copy the link", "error");
    }
  };

  return (
    <Button variant="outline" size="sm" className="rounded-xl" onClick={handleShare}>
      <Share2 className="h-3.5 w-3.5" aria-hidden />
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
