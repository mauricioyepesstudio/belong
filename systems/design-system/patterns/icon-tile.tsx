import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type IconTileProps = {
  icon: LucideIcon;
  className?: string;
  variant?: "brand" | "neutral";
};

export function IconTile({ icon: Icon, className, variant = "brand" }: IconTileProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,.08)]",
        variant === "brand" && "border-violet-300/25 bg-[linear-gradient(145deg,rgba(139,92,246,.18),rgba(34,211,238,.08))] text-violet-200 shadow-[0_0_20px_rgba(139,92,246,.14)]",
        variant === "neutral" && "bg-bg-hover text-fg-muted",
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </div>
  );
}
