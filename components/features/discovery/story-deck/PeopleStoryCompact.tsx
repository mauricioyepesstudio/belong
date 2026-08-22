"use client";

import { Avatar, Button } from "@/systems/design-system";
import { resolvePersonAction } from "@/engines/people/show-up-resolver";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { formatInitials } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface PeopleStoryCompactProps {
  person: DiscoveryPerson;
  onOpenDeck: () => void;
}

export function PeopleStoryCompact({ person, onOpenDeck }: PeopleStoryCompactProps) {
  const action = resolvePersonAction(person);
  
  return (
    <div className="p-5 bg-neutral-900 border border-white/10 rounded-2xl space-y-4 w-72 shadow-xl">
      <div className="flex items-center gap-3">
        <Avatar size="md" src={person.avatarUrl ?? undefined} fallback={formatInitials(person.fullName)} />
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{person.fullName}</p>
          <p className="text-xs text-white/50 truncate">{person.role}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {person.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
      </div>

      <div className="text-xs text-white/60 line-clamp-2 italic">
        {person.matchReasons[0] ?? "Recommended for you"}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="brand" className="flex-1" onClick={onOpenDeck}>View Story</Button>
      </div>
    </div>
  );
}
