"use client";

import { cn } from "@/lib/utils";

export function LiveBadge({
  count,
  label = "Live",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-micro font-medium text-emerald-400",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="tabular-nums text-emerald-300">{count}</span>
      )}
    </span>
  );
}
