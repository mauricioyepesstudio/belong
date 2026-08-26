"use client";

import { useEffect, useState } from "react";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import { getPersonStories } from "@/engines/people/actions";
import type { SocialPost } from "@/engines/social/types";
import Image from "next/image";
import { Avatar } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";

export function PeopleStoryMedia({ person }: { person: DiscoveryPerson }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    getPersonStories(person.id).then(setPosts);
  }, [person.id]);

  // Priority 1: Post media, Priority 2: Avatar with blurred background
  const postWithMedia = posts.find(p => p.mediaUrl);
  
  if (postWithMedia && postWithMedia.mediaUrl) {
    return (
      <div className="w-full h-full relative">
        <Image 
          src={postWithMedia.mediaUrl} 
          alt="Post media" 
          fill 
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>
    );
  }

  // Premium Fallback: Blurred avatar background + Sharp foreground avatar
  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={person.avatarUrl ?? ""}
          alt=""
          fill
          className="blur-3xl scale-150 opacity-50"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-neutral-950/80" />
      </div>
      <div className="relative z-10 text-center space-y-4">
        <Avatar
          size="xl"
          src={person.avatarUrl ?? undefined}
          fallback={formatInitials(person.fullName)}
          className="mx-auto ring-4 ring-white/10 w-32 h-32"
        />
      </div>
    </div>
  );
}
