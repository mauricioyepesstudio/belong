import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { UnreadDot } from "./unread-dot";

type ListRowProps = {
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  trailing?: ReactNode;
  unread?: boolean;
  className?: string;
};

export function ListRow({
  href,
  onClick,
  icon: Icon,
  iconNode,
  title,
  subtitle,
  meta,
  trailing,
  unread,
  className,
}: ListRowProps) {
  const content = (
    <>
      {(Icon || iconNode) && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-hover text-fg-muted">
          {iconNode ?? (Icon && <Icon className="h-4 w-4" aria-hidden />)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-fg-primary" : "text-fg-secondary"
            )}
          >
            {title}
          </p>
          {unread && <UnreadDot />}
        </div>
        {subtitle && <p className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</p>}
      </div>
      {meta && <span className="shrink-0 text-xs text-fg-faint">{meta}</span>}
      {trailing}
    </>
  );

  const rowClass = cn(
    "group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-bg-hover",
    className
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(rowClass, "w-full text-left")}>
      {content}
    </button>
  );
}
