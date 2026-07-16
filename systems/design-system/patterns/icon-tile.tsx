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
        "flex h-11 w-11 items-center justify-center rounded-xl",
        variant === "brand" && "bg-brand-subtle text-brand",
        variant === "neutral" && "bg-bg-hover text-fg-muted",
        className
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </div>
  );
}
