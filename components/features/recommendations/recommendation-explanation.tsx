"use client";

import type { ExplanationBullet, ScoredRecommendation } from "@/engines/opportunity";
import { confidenceLabel, confidenceVariant } from "@/engines/opportunity";
import { Badge } from "@/systems/design-system";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecommendationExplanation({
  item,
  className,
  limit,
}: {
  item: ScoredRecommendation;
  className?: string;
  limit?: number;
}) {
  const bullets = limit ? item.explanation.bullets.slice(0, limit) : item.explanation.bullets;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand" className="text-micro">
          {item.score}% compatibility
        </Badge>
        <Badge variant={confidenceVariant(item.explanation.confidence)} className="text-micro">
          {confidenceLabel(item.explanation.confidence)} confidence
        </Badge>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          Why this recommendation?
        </p>
        <ul className="mt-2 space-y-1.5">
          {bullets.map((bullet) => (
            <ExplanationBulletRow key={bullet.id} bullet={bullet} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ExplanationBulletRow({ bullet }: { bullet: ExplanationBullet }) {
  return (
    <li className="flex items-start gap-2 text-sm text-fg-secondary">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
      <span>{bullet.label}</span>
    </li>
  );
}

export function CompatibilityScoreRing({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? 44 : 52;
  const stroke = size === "sm" ? 4 : 5;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: dimension, height: dimension }}
      aria-label={`${score}% compatibility`}
    >
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border-subtle"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-brand transition-all"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-fg-primary">{score}</span>
    </div>
  );
}
