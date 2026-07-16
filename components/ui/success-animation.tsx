"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function SuccessAnimation({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full bg-success/15 animate-success-pop",
        className
      )}
    >
      <Check className="h-8 w-8 text-success" strokeWidth={2.5} />
    </div>
  );
}
