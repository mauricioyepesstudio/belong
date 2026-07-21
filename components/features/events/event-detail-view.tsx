"use client";

import { registerForEvent, unregisterFromEvent } from "@/lib/actions/events";
import type { EventWithMeta } from "@/lib/data/events";
import { formatEventDate } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  useToast,
} from "@/systems/design-system";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function EventDetailView({ event }: { event: EventWithMeta }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const toggleRegistration = () => {
    startTransition(async () => {
      const result = event.registered
        ? await unregisterFromEvent(event.id)
        : await registerForEvent(event.id);
      if (result.error) toast(result.error, "error");
      else {
        toast(event.registered ? "Unregistered" : "Registered", "success");
        router.refresh();
      }
    });
  };

  return (
    <FeatureScreen
      label="Event"
      title={event.title}
      description={formatEventDate(event.starts_at)}
      action={
        <Link href="/events">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All events
          </Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          {event.description && (
            <p className="text-body leading-relaxed text-fg-secondary">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-fg-muted">
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden />
              {event.attendeeCount} attending
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden />
              {formatEventDate(event.starts_at)}
            </span>
          </div>
          {event.registered && <Badge variant="brand">You&apos;re registered</Badge>}
          <Button
            variant={event.registered ? "secondary" : "primary"}
            disabled={isPending}
            isLoading={isPending}
            onClick={toggleRegistration}
          >
            {event.registered ? "Unregister" : "Register for event"}
          </Button>
        </CardContent>
      </Card>
    </FeatureScreen>
  );
}
