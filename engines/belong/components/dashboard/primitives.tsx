import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/systems/design-system";

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
  icon,
}: {
  label: string;
  title: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && <IconTile icon={icon} className="shrink-0" />}
        <div>
          <p className="text-label">{label}</p>
          <h2 className="mt-1 text-heading-lg text-fg-primary">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}
