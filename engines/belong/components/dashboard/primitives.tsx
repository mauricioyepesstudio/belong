import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
};

export function GlassCard({ children, className, hover, glow }: GlassCardProps) {
  return (
    <div
      className={cn(
        "surface-glass rounded-3xl",
        hover && "transition-all duration-300 hover:border-border-strong hover:bg-white/[0.04]",
        glow && "shadow-[0_0_80px_-20px_var(--brand-glow)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-label">{label}</p>
        <h2 className="text-heading-lg mt-2 text-fg-primary">{title}</h2>
      </div>
      {action}
    </div>
  );
}
