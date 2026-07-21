"use client";

import type { UserProfile } from "@/types/database.types";
import { formatGreeting } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";

export function HomeFocusWelcome({
  profile,
  summary,
}: {
  profile: UserProfile;
  summary: string;
}) {
  const firstName = profile.full_name?.split(" ")[0] ?? "Builder";

  return (
    <FadeIn>
      <header>
        <p className="text-label">Focus</p>
        <h1 className="text-heading-lg mt-1 text-fg-primary">
          {formatGreeting()}, {firstName}
        </h1>
        <p className="mt-2 text-body text-fg-secondary">{summary}</p>
      </header>
    </FadeIn>
  );
}
