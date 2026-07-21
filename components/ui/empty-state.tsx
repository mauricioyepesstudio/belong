import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-hover border border-border-subtle">
        <Icon className="h-6 w-6 text-fg-muted" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-5 text-base font-semibold text-fg-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-fg-muted leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
