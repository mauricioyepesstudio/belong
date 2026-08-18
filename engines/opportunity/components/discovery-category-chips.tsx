"use client";

import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "@/engines/opportunity";

type DiscoveryCategoryChipsProps = {
  categories: readonly DiscoveryCategory[];
  active: DiscoveryCategory;
  onSelect: (category: DiscoveryCategory) => void;
  disabled?: boolean;
};

/**
 * Horizontal, scroll-on-overflow filter chip row for the people discovery
 * category taxonomy. The category list itself (DISCOVERY_CATEGORIES) is
 * owned by engines/opportunity/discovery.ts — this component only renders it.
 */
export function DiscoveryCategoryChips({
  categories,
  active,
  onSelect,
  disabled,
}: DiscoveryCategoryChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtrar por categoría"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
    >
      {categories.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onSelect(category)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium",
              "transition-colors duration-[var(--duration-normal)] focus-ring disabled:pointer-events-none disabled:opacity-60",
              isActive
                ? "border-brand/40 bg-brand/15 text-fg-primary shadow-[0_0_24px_-8px_var(--brand-glow)]"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg-secondary"
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
