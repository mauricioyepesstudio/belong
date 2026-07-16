import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  href?: string;
  children: ReactNode;
  className?: string;
};

export function SectionPanel({ title, href, children, className }: SectionPanelProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-elevated p-5 transition-colors hover:border-border",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg-primary">{title}</h2>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted transition-colors hover:text-brand"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}
