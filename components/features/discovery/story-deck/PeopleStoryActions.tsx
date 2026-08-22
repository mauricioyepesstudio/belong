"use client";

import { Button } from "@/systems/design-system";
import { resolvePersonAction } from "@/engines/people/show-up-resolver";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";

export function PeopleStoryActions({ person }: { person: DiscoveryPerson }) {
  const action = resolvePersonAction(person);
  
  return (
    <div className="flex gap-2">
      <Button 
        variant={action.state === "AVAILABLE" ? "brand" : "secondary"}
        disabled={action.state === "PENDING"}
        className="flex-1"
      >
        {action.label}
      </Button>
      <Button variant="ghost">View Profile</Button>
    </div>
  );
}
