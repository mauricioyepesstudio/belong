"use client";

import type { ScoredRecommendation } from "@/engines/opportunity";
import { confidenceLabel, confidenceVariant } from "@/engines/opportunity";
import { Modal } from "@/components/ui/modal";
import { Avatar, Badge, Button } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import Link from "next/link";
import {
  CompatibilityScoreRing,
  ExplanationBulletRow,
  RecommendationExplanation,
} from "./recommendation-explanation";

function DetailSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-fg-faint">{empty}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}

export function RecommendationDetailsDrawer({
  item,
  open,
  onClose,
}: {
  item: ScoredRecommendation | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!item) return null;

  const { explanation } = item;
  const avatarUrl = item.meta?.avatarUrl ?? undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={item.title}
      description={item.subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Link href={item.href}>
            <Button variant="brand">View</Button>
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4">
          {item.category === "people" && (
            <Avatar src={avatarUrl} fallback={formatInitials(item.title)} size="md" />
          )}
          <CompatibilityScoreRing score={item.score} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg-primary">Compatibility score</p>
            <p className="mt-1 text-caption text-fg-muted">
              Deterministic score from weighted signals — not engagement-based.
            </p>
            <Badge
              variant={confidenceVariant(explanation.confidence)}
              className="mt-2 text-micro"
            >
              {confidenceLabel(explanation.confidence)} confidence
            </Badge>
          </div>
        </div>

        <RecommendationExplanation item={item} />

        <div className="grid gap-5 sm:grid-cols-2">
          <DetailSection
            title="Shared skills"
            items={explanation.details.sharedSkills}
            empty="No direct skill overlap detected"
          />
          <DetailSection
            title="Shared interests"
            items={explanation.details.sharedInterests}
            empty="No shared interests detected"
          />
          <DetailSection
            title="Shared communities"
            items={explanation.details.sharedCommunities}
            empty="Not in the same communities yet"
          />
          <DetailSection
            title="Mutual collaborators"
            items={explanation.details.mutualCollaborators}
            empty="No mutual collaborators identified"
          />
        </div>

        <DetailSection
          title="Current opportunities"
          items={explanation.details.currentOpportunities}
          empty="No active opportunities surfaced"
        />

        <section className="rounded-2xl border border-border-subtle bg-white/[0.02] p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            Scoring calculation
          </h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-fg-secondary">
            {explanation.scoreBreakdown.formula}
          </p>
          <ul className="mt-3 space-y-2">
            {explanation.scoreBreakdown.factors.map((factor) => (
              <li
                key={factor.key}
                className="flex items-center justify-between gap-3 text-xs text-fg-muted"
              >
                <span className="capitalize">{factor.key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-mono text-fg-secondary">
                  {factor.score}/{factor.weight}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}

export { ExplanationBulletRow };
