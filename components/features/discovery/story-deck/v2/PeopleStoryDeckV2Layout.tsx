"use client";

import { useState } from "react";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { PeopleStoryDeck } from "@/components/features/discovery/story-deck/PeopleStoryDeck";
import { X, CheckCircle2, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/systems/design-system";

interface PeopleStoryDeckV2LayoutProps {
  people: DiscoveryPerson[];
  onClose: () => void;
}

export function PeopleStoryDeckV2Layout({ people, onClose }: PeopleStoryDeckV2LayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-[300px,1fr,360px] gap-8 items-start max-w-7xl mx-auto py-8">
        {/* LEFT: Intro Column */}
        <aside className="space-y-8 sticky top-24">
            <div>
                <h2 className="text-sm font-semibold text-brand-cyan uppercase tracking-widest mb-2">People Discovery</h2>
                <h1 className="text-4xl font-bold text-white mb-4">People<br/>Story Deck</h1>
                <p className="text-white/60 text-lg leading-relaxed">Discover people aligned with your purpose. Swipe to explore their story, connect, collaborate and build something meaningful.</p>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-white/10">
               <div className="flex items-center gap-3 text-white/80"><span>➔</span> <span className="font-semibold">Interested / Take action</span></div>
               <div className="flex items-center gap-3 text-white/80"><span>➔</span> <span className="font-semibold">Pass</span></div>
               <div className="flex items-center gap-3 text-white/80"><span>➔</span> <span className="font-semibold">Tap Profile</span></div>
            </div>
        </aside>

        {/* CENTER: Story Deck */}
        <main className="flex justify-center">
            <div className="w-[380px] h-[720px]">
              <PeopleStoryDeck people={people} onClose={onClose} />
            </div>
        </main>

        {/* RIGHT: Story Index */}
        <aside className="space-y-6 sticky top-24">
            <h3 className="font-semibold text-white text-xl">{people[currentIndex]?.fullName ?? 'Person'}&apos;s story in parts</h3>
            <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <div key={n} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-violet transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-brand-cyan">{n}</div>
                        <div className="flex-1">
                            <p className="text-white font-medium">Story Section {n}</p>
                            <p className="text-white/50 text-xs">Brief description...</p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
      </div>
      
      {/* Lower Sections */}
      <div className="grid grid-cols-3 gap-8 max-w-7xl mx-auto pb-12">
        <section className="bg-neutral-900 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Swipe to discover</h3>
            <div className="text-white/60">Immersive discovery stack for serendipitous connections.</div>
        </section>
        <section className="bg-neutral-900 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Take action with purpose</h3>
            <div className="text-white/60">Choose your intention: Connect, Collaborate, Help, or Message.</div>
        </section>
        <section className="bg-neutral-900 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Discover more than people</h3>
            <div className="text-white/60">Explore Projects, Missions, Needs, and Events.</div>
        </section>
      </div>

      {/* Value Strip */}
      <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto py-8 border-t border-white/5 text-center text-sm text-white/60">
        <div><strong>Real people</strong><br/>Real stories</div>
        <div><strong>Real actions</strong><br/>Real impact</div>
        <div><strong>Verified by BELONG</strong><br/>Trusted community</div>
        <div><strong>Built for good</strong><br/>Not for attention</div>
      </div>
    </div>
  );
}
