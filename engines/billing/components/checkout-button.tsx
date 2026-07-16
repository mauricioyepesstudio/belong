"use client";

import { createPlatformCheckout } from "@/lib/actions/billing";
import { Button, useToast } from "@/systems/design-system";
import { useTransition } from "react";

type CheckoutButtonProps = {
  tier: "pro" | "creator";
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "brand" | "outline";
  className?: string;
};

export function CheckoutButton({
  tier,
  children,
  variant = "primary",
  className,
}: CheckoutButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await createPlatformCheckout(tier);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
    });
  };

  return (
    <Button
      variant={variant}
      className={className}
      isLoading={isPending}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
