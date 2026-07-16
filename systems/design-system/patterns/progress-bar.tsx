"use client";

import { motion, useReducedMotion } from "framer-motion";

type ProgressBarProps = {
  value: number;
  className?: string;
  animate?: boolean;
};

export function ProgressBar({ value, className, animate = true }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-fg-muted">
        <span>Progress</span>
        <span>{clamped}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-hover">
        {animate && !reduced ? (
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        ) : (
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${clamped}%` }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
      </div>
    </div>
  );
}
