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

  return (
    <CommunityScreen
      joined={joined}
      discover={discover}
      pending={pending}
      people={people}
    />
  );
}
