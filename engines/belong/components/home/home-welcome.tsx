"use client";

import type { UserProfile } from "@/types/database.types";
import { formatGreeting } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";
import { GlassCard } from "../dashboard/primitives";

export function HomeWelcome({
  profile,
  isReturningUser = false,
}: {
  profile: UserProfile;
  isReturningUser?: boolean;
}) {
  const firstName = profile.full_name?.split(" ")[0] ?? "Builder";
  const greeting = formatGreeting();

  if (isReturningUser) {
    return (
      <FadeIn>
        <div>
          <p className="text-label">Home</p>
          <h1 className="text-heading-lg mt-1 text-fg-primary">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-fg-secondary">
            Share updates, follow your communities, and keep building with your network.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <GlassCard glow className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="animate-aurora absolute -right-24 -top-32 h-64 w-64 rounded-full bg-brand/15 blur-[100px]" />
        </div>

        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <p className="text-label">Welcome to BELONG</p>
          <h1 className="text-heading-lg mt-2 text-fg-primary">
            {greeting}, {firstName}
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg leading-relaxed text-fg-secondary">
            BELONG is a collaborative platform — not a social feed. Share ideas, join
            communities, build projects together, and track the impact you create.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { title: "Express & connect", body: "Share thoughts and find collaborators who align with your goals." },
              { title: "Build together", body: "Join communities and projects where ideas become real work." },
              { title: "Measure impact", body: "See your contributions grow as you help others and ship outcomes." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <p className="text-sm font-medium text-fg-primary">{item.title}</p>
                <p className="mt-1 text-caption leading-relaxed text-fg-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
