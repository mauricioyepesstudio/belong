"use client";

import { cn } from "@/lib/utils";
import { formatInitials } from "@/lib/format";
import { Avatar, Button } from "@/systems/design-system";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Handshake } from "lucide-react";
import { useEffect, useId, useMemo } from "react";

type CollaborationConfirmedCelebrationProps = {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  summary: string;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: "circle" | "square";
};

/**
 * Confetti palette is deliberately multi-hue rather than a single flat tone.
 * `--brand-*` anchors the burst to this being a core product/brand moment —
 * confirming a collaboration is the founding action behind the Impact
 * Passport, not a peripheral reward. `--warning` (the same amber "momentum"
 * token StreakBadge uses for streaks) and `--success` are mixed in so the
 * burst actually reads as confetti — real confetti is never one color — and
 * borrows a little of that established "achievement" visual language without
 * fully abandoning brand identity for this specifically brand-defining event.
 */
const PARTICLE_COLORS = [
  "var(--brand-400)",
  "var(--brand-secondary)",
  "var(--warning)",
  "var(--success)",
  "var(--brand-accent)",
];

function createParticles(): Particle[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: 130 + Math.random() * 190,
    rotate: (Math.random() - 0.5) * 520,
    delay: Math.random() * 0.22,
    duration: 0.9 + Math.random() * 0.65,
    size: 5 + Math.random() * 7,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    shape: i % 3 === 0 ? "square" : "circle",
  }));
}

export function CollaborationConfirmedCelebration({
  open,
  onClose,
  partnerName,
  partnerAvatarUrl,
  summary,
}: CollaborationConfirmedCelebrationProps) {
  const titleId = useId();
  const descriptionId = useId();
  const shouldReduceMotion = useReducedMotion();

  // Each time `open` flips to true this is a brand new confirmation, so a
  // fresh randomized burst is generated (no external state/effect needed —
  // the component instance is naturally discarded once its record leaves
  // the pending list after `router.refresh()`).
  const particles = useMemo(() => {
    if (!open || shouldReduceMotion) return [];
    return createParticles();
  }, [open, shouldReduceMotion]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 24 }
            }
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 340, damping: 22, mass: 0.8 }
            }
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-brand/30 bg-bg-overlay shadow-[0_0_80px_var(--brand-glow)]"
          >
            {particles.length > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-visible"
                aria-hidden
              >
                {particles.map((particle) => (
                  <motion.span
                    key={particle.id}
                    className={cn(
                      "absolute left-1/2 top-6",
                      particle.shape === "circle" ? "rounded-full" : "rounded-[2px]"
                    )}
                    style={{
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                    }}
                    initial={{ opacity: 0, x: -particle.size / 2, y: 0, scale: 0.4, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: particle.x - particle.size / 2,
                      y: particle.y,
                      scale: 1,
                      rotate: particle.rotate,
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative flex flex-col items-center gap-4 px-6 pb-6 pt-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/25 to-brand/5 text-brand">
                <Handshake className="h-8 w-8" strokeWidth={2} aria-hidden />
              </div>

              <div className="space-y-1.5">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg-primary">
                  You and {partnerName} just made something real.
                </h2>
                <p id={descriptionId} className="text-sm text-fg-secondary">
                  This collaboration is confirmed on both sides — a permanent, two-sided
                  record has just been added to both of your impact passports.
                </p>
              </div>

              <div className="flex w-full items-start gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-3 text-left">
                <Avatar
                  src={partnerAvatarUrl ?? undefined}
                  fallback={formatInitials(partnerName)}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-fg-muted">{partnerName}</p>
                  <p className="mt-0.5 text-sm text-fg-primary">{summary}</p>
                </div>
              </div>

              <Button variant="brand" size="lg" className="mt-1 w-full" onClick={onClose}>
                Nice
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
