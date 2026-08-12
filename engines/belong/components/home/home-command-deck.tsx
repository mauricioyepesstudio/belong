"use client";

import { Activity, Compass, Sparkles, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";

type DeckTab = "for-you" | "activity" | "discover";

const tabs: Array<{ id: DeckTab; label: string; icon: typeof Sparkles }> = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "discover", label: "Discover", icon: Compass },
];

export function HomeCommandDeck({
  quickActions,
  forYou,
  activity,
  discover,
}: {
  quickActions: ReactNode;
  forYou: ReactNode;
  activity: ReactNode;
  discover: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<DeckTab>("for-you");

  return (
    <section aria-labelledby="command-deck-title" className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" aria-hidden /> Command deck
          </p>
          <h2 id="command-deck-title" className="text-heading mt-1 text-fg-primary">
            Move your world forward
          </h2>
        </div>
        <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.025] p-1" role="tablist" aria-label="Dashboard views">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`deck-panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-ring ${
                activeTab === id ? "bg-violet-500/15 text-violet-200" : "text-fg-muted hover:text-fg-primary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-7">{quickActions}</div>

      <div id={`deck-panel-${activeTab}`} role="tabpanel" tabIndex={0}>
        {activeTab === "for-you" && forYou}
        {activeTab === "activity" && activity}
        {activeTab === "discover" && discover}
      </div>
    </section>
  );
}
