import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/systems/design-system";
import type { ImpactReceipt } from "@/types/impact-receipt";
import { formatDistanceToNow } from "@/lib/format";
import { Share2, X, MessageSquare, UserPlus, FileText, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createPeopleStoryProfile } from "@/engines/people/people-story-adapter";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { PeopleStoryMedia } from "./PeopleStoryMedia";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PeopleStoryCardProps {
  person: DiscoveryPerson;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onInterested: () => void;
  connectionState: string;
}

// ... imports

export function PeopleStoryCard({ person, onNext, onPrevious, onClose, onInterested, connectionState }: PeopleStoryCardProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const { toast } = useToast();

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative w-full max-w-[480px] h-[720px] bg-neutral-950 rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
    >
      {/* Progress & Section Label */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex gap-1">
          {profile.sections.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i === sectionIndex ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <div className="text-violet-300 text-[10px] font-semibold uppercase tracking-widest">
          {profile.sections[sectionIndex].title}
        </div>
      </div>

      {/* Hero Media / Identity Fallback */}
      <div className="h-[55%] relative">
        <PeopleStoryMedia person={profile.person} />
        {/* Simplified Overlay - Identity already in first section */}
      </div>

      {/* Section Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {profile.sections[sectionIndex].content}
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-white/10 grid grid-cols-3 gap-2 bg-neutral-950">
        <Button variant="secondary" onClick={onNext} className="h-12">Pass</Button>
        <Button variant="secondary" className="h-12">Profile</Button>
        <Button variant="brand" className="h-12" onClick={onInterested}>
          {isConnected ? 'Message' : 'Connect'}
        </Button>
      </div>

      <button className="absolute top-4 right-4 z-30 p-2 bg-black/50 rounded-full" onClick={onClose}><X className="text-white" /></button>
    </motion.div>
  );
}
