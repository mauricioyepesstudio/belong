import { EventDetailView } from "@/components/features/events/event-detail-view";
import { getEventById } from "@/lib/data/events";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  return <EventDetailView event={event} />;
}
