import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type GlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

export function GlassPanel({ children, className, hover, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "surface-glass rounded-2xl",
        hover && "transition-all duration-300 hover:border-border-strong hover:bg-bg-surface/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
