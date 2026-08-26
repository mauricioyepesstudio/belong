"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { PeopleStoryMedia } from "./PeopleStoryMedia";
import { Button } from "@/systems/design-system";
import { motion, AnimatePresence } from "framer-motion";
import { createPeopleStoryProfile } from "@/engines/people/people-story-adapter";

interface PeopleStoryCardProps {
  person: DiscoveryPerson;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onInterested: () => void;
  connectionState: string;
}

export function PeopleStoryCard({ person, onNext, onPrevious, onClose, onInterested, connectionState }: PeopleStoryCardProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const profile = createPeopleStoryProfile(person, []);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onInterested();
    else if (info.offset.x < -100) onNext();
  };

  const isConnected = connectionState === 'connected';

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-[480px] h-[720px] bg-neutral-950 rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
    >
      {/* Progress */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
        {profile.sections.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i === sectionIndex ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>

      {/* Hero Media */}
      <div className="h-[55%] relative">
        <PeopleStoryMedia person={profile.person} />
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto bg-neutral-950">
        <div className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-4">
          {profile.sections[sectionIndex].title}
        </div>
        <div className="text-white">
          {profile.sections[sectionIndex].content}
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-6 border-t border-white/10 grid grid-cols-3 gap-3 bg-neutral-950">
        <Button variant="secondary" onClick={onNext} className="h-14 rounded-xl text-base">Pass</Button>
        <Button variant="secondary" className="h-14 rounded-xl text-base">Profile</Button>
        <Button variant="brand" className="h-14 rounded-xl text-base" onClick={onInterested}>
          {isConnected ? 'Message' : 'Connect'}
        </Button>
      </div>

      <button className="absolute top-6 right-6 z-30 p-2 bg-black/50 rounded-full" onClick={onClose}><X className="text-white" /></button>
    </motion.div>
  );
}
