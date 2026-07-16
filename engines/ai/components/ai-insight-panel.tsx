"use client";

import type { AIInsight } from "@/engines/ai/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Link from "next/link";

type AIInsightPanelProps = {
  insights: AIInsight[];
};

const priorityStyles = {
  high: "border-brand/25 bg-brand/5",
  medium: "border-border-subtle bg-bg-surface/50",
  low: "border-border-subtle bg-transparent",
} as const;

export function AIInsightPanel({ insights }: AIInsightPanelProps) {
  if (!insights.length) return null;

  return (
    <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
          <Sparkles className="h-4 w-4 text-brand" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-fg-primary">Suggested next steps</h2>
          <p className="text-xs text-fg-muted">Personalized from your BELONG activity</p>
        </div>
      </div>
      <ul className="space-y-2">
        {insights.map((item) => (
          <li key={item.id}>
            <Link
              href={item.actionHref}
              className={cn(
                "group block rounded-xl border p-4 transition-all hover:border-border-strong",
                priorityStyles[item.priority]
              )}
            >
              <p className="text-sm font-medium text-fg-primary">{item.title}</p>
              <p className="mt-1 text-xs text-fg-muted">{item.description}</p>
              <span className="mt-2 inline-block text-xs font-medium text-brand group-hover:underline">
                {item.actionLabel} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
