"use client";

import { Button } from "@/systems/design-system";
import { PeopleStoryActions } from "./PeopleStoryActions";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";

interface PeopleStoryIntentSheetProps {
  person: DiscoveryPerson;
  onClose: () => void;
}

export function PeopleStoryIntentSheet({ person, onClose }: PeopleStoryIntentSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/90 p-6">
      <div className="bg-bg-base p-6 rounded-t-2xl space-y-4">
        <h2 className="text-xl font-bold text-white">What would you like to do with {person.fullName.split(" ")[0]}?</h2>
        <PeopleStoryActions person={person} />
        <Button variant="ghost" className="w-full" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
