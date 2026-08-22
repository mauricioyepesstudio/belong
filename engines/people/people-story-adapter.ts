import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import type { SocialPost } from "@/engines/social/types";
import React from "react";
import { Badge } from "@/components/ui/badge";

export interface PeopleStoryProfile {
  person: DiscoveryPerson;
  media: string[];
  sections: {
    title: string;
    content: React.ReactNode;
  }[];
  affinity: number;
  reasons: string[];
}

export function createPeopleStoryProfile(person: DiscoveryPerson, posts: SocialPost[]): PeopleStoryProfile {
  const media = posts
    .filter(p => p.mediaUrl)
    .map(p => p.mediaUrl!)
    .slice(0, 5);

  const sections = [
    {
      title: "This is me",
      content: React.createElement("div", { className: "space-y-4" },
        React.createElement("div", { className: "flex items-center gap-2 text-brand-cyan" },
          React.createElement("span", { className: "font-bold" }, `${person.affinityScore}% ALIGNED`),
          React.createElement("span", null, "•"),
          React.createElement("span", { className: "uppercase tracking-widest" }, person.connectionState.state)
        ),
        React.createElement("h2", { className: "text-3xl font-bold text-white" }, person.fullName),
        React.createElement("p", { className: "text-lg text-brand-secondary" }, `${person.role} ${person.location ? `· ${person.location}` : ''}`),
        React.createElement("p", { className: "text-white/80 leading-relaxed" }, "Purpose-driven builder."),
        React.createElement("div", { className: "flex flex-wrap gap-2 pt-2" },
          person.tags.map((tag: string) => 
            React.createElement(Badge, { key: tag, variant: "outline", className: "text-xs bg-white/5" }, tag)
          )
        ),
        person.matchReasons.length > 0 && React.createElement("div", { className: "pt-4 border-t border-white/10 space-y-2" },
          React.createElement("h3", { className: "text-xs font-bold uppercase text-white/50" }, "Why you two connect"),
          React.createElement("ul", { className: "text-sm text-white/70 space-y-1" },
            person.matchReasons.map((reason, i) => React.createElement("li", { key: i }, `• ${reason}`))
          )
        )
      )
    }
  ];

  if (media.length > 0) {
    sections.push({
      title: "My World",
      content: React.createElement("div", { className: "grid grid-cols-2 gap-2" },
        media.map((url, i) => 
          React.createElement("img", { key: i, src: url, alt: "Media", className: "rounded-lg w-full h-32 object-cover" })
        )
      )
    });
  }

  return {
    person,
    media,
    sections,
    affinity: person.affinityScore ?? 0,
    reasons: person.matchReasons ?? [],
  };
}
