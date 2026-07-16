import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type EntityCardProps = {
  title: string;
  description?: string | null;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  badges?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export function EntityCard({
  title,
  description,
  icon: Icon,
  iconNode,
  badges,
  meta,
  footer,
  href,
  onClick,
  className,
}: EntityCardProps) {
  const inner = (
    <Card
      className={cn(
        "transition-all hover:border-border-strong hover:shadow-md",
        (href || onClick) && "cursor-pointer",
        className
      )}
    >
      <CardContent className="pt-6">
        {(Icon || iconNode || badges) && (
          <div className="flex items-start justify-between gap-3">
            {iconNode ??
              (Icon ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-secondary/10">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
              ) : null)}
            {badges}
          </div>
        )}
        <h3 className={cn("font-semibold text-fg-primary", (Icon || iconNode) && "mt-4", "text-lg")}>
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-caption line-clamp-2">{description}</p>
        )}
        {meta && <div className="mt-3">{meta}</div>}
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="block w-full text-left" onClick={onClick}>
        {inner}
      </button>
    );
  }

  return inner;
}

export function EntityGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
  );
}
