import { CommunityScreen } from "@/engines/community";
import {
  getDiscoverCommunities,
  getUserCommunities,
} from "@/lib/data/communities";
import { getDiscoverUsers, getPendingConnections } from "@/lib/data/connections";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const [joined, discover, pending, people] = await Promise.all([
    getUserCommunities(),
    getDiscoverCommunities(),
    getPendingConnections(),
    getDiscoverUsers(),
  ]);

  const joinedIds = new Set(joined.map((c) => c.id));

  return (
    <CommunityScreen
      joined={joined}
      discover={discover.filter((c) => !joinedIds.has(c.id))}
      pending={pending}
      people={people}
    />
  );
}
