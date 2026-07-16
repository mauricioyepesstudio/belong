"use client";

import { createDonationCheckout } from "@/lib/actions/billing";
import {
  Button,
  Input,
  Label,
  Modal,
  Tabs,
  useToast,
} from "@/systems/design-system";
import { MIN_DONATION_CENTS } from "@/lib/stripe/config";
import { useState, useTransition } from "react";

const PRESETS = [500, 1000, 2500, 5000];

type PayModalProps = {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  mode?: "donation" | "tip" | "fund";
  projectId?: string;
  projectName?: string;
};

export function PayModal({
  open,
  onClose,
  recipientId,
  recipientName,
  mode = "donation",
}: PayModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("10");
  const [kind, setKind] = useState<"donation" | "creator_tip">(
    mode === "tip" ? "creator_tip" : "donation"
  );
  const [isPending, startTransition] = useTransition();

  const title =
    mode === "tip"
      ? `Tip ${recipientName}`
      : `Support ${recipientName}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(amount);
    if (Number.isNaN(dollars) || dollars <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents < MIN_DONATION_CENTS) {
      toast(`Minimum is $${(MIN_DONATION_CENTS / 100).toFixed(2)}`, "error");
      return;
    }

    startTransition(async () => {
      const result = await createDonationCheckout(recipientId, cents, kind);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description="Secure payment via Stripe.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "donation" && (
          <Tabs
            tabs={[
              { id: "donation", label: "Donate" },
              { id: "creator_tip", label: "Tip" },
            ]}
            active={kind}
            onChange={(id) => setKind(id as "donation" | "creator_tip")}
          />
        )}

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((cents) => (
            <Button
              key={cents}
              type="button"
              size="sm"
              variant={Math.round(parseFloat(amount || "0") * 100) === cents ? "brand" : "secondary"}
              onClick={() => setAmount(String(cents / 100))}
            >
              ${cents / 100}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            min={MIN_DONATION_CENTS / 100}
            step="0.01"
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
