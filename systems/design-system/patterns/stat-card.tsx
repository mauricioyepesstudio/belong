import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  href?: string;
};

export function StatCard({
  label,
  value,
  detail,
  trend = "neutral",
  icon: Icon,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-hover text-fg-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-fg-primary">{value}</p>
      {detail && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            trend === "up" && "text-success",
            trend === "down" && "text-error",
            trend === "neutral" && "text-fg-faint"
          )}
        >
          {detail}
        </p>
      )}
    </>
  );

  const className = cn(
    "group block rounded-2xl border border-border-subtle bg-bg-elevated p-5 transition-all duration-300",
    href && "hover:border-border hover:bg-bg-surface hover:shadow-md"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
