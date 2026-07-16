"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type TabsProps = {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 rounded-xl border border-border-subtle bg-bg-surface p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id ? "text-fg-primary" : "text-fg-muted hover:text-fg-secondary"
          )}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-lg bg-bg-hover border border-border-subtle"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
          {tab.count !== undefined && (
            <span className="relative z-10 rounded-full bg-brand-subtle px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
