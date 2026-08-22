"use client";

import { useState } from "react";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { PeopleStoryDeck } from "@/components/features/discovery/story-deck/PeopleStoryDeck";
import { X } from "lucide-react";

interface PeopleStoryDeckV2ModalProps {
  people: DiscoveryPerson[];
  initialPersonId: string;
  onClose: () => void;
}

export function PeopleStoryDeckV2Modal({ people, initialPersonId, onClose }: PeopleStoryDeckV2ModalProps) {
  // Simplification: In a real app, find the index of initialPersonId
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
        <div className="w-[480px] h-[720px]">
          <PeopleStoryDeck people={people} onClose={onClose} />
        </div>
        <button className="absolute top-6 right-6 z-30 p-2 bg-black/50 rounded-full" onClick={onClose}><X className="text-white" /></button>
    </div>
  );
}
