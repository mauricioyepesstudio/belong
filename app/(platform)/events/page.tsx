import { EventsView } from "@/components/features/events/events-view";
import { getPastEvents, getUpcomingEvents } from "@/lib/data/events";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const [events, pastEvents] = await Promise.all([getUpcomingEvents(), getPastEvents()]);
  return <EventsView events={events} pastEvents={pastEvents} />;
}
