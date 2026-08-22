"use client";

import { useState } from "react";
import { PeopleStoryCard } from "./PeopleStoryCard";
import { PeopleStoryIntentSheet } from "./PeopleStoryIntentSheet";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";

interface PeopleStoryDeckProps {
  people: DiscoveryPerson[];
  onClose: () => void;
}

export function PeopleStoryDeck({ people, onClose }: PeopleStoryDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntent, setShowIntent] = useState(false);

  const handleNext = () => {
    if (currentIndex < people.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (people.length === 0) return null;

  if (showIntent) {
    return (
      <PeopleStoryIntentSheet 
        person={people[currentIndex]} 
        onClose={() => setShowIntent(false)} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <PeopleStoryCard
        person={people[currentIndex]}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={onClose}
        onInterested={() => setShowIntent(true)}
        connectionState={people[currentIndex].connectionState.state}
      />
    </div>
  );
}
