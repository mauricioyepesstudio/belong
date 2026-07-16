"use client";

import { createEvent, registerForEvent, unregisterFromEvent } from "@/lib/actions/events";
import { formatEventDate } from "@/lib/format";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import {
  Badge,
  Button,
  EmptyState,
  EntityCard,
  EntityGrid,
  FeatureScreen,
  Input,
  Label,
  Modal,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import type { Event } from "@/types/database.types";
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type EventItem = Event & { registered: boolean; attendeeCount: number };

export function EventsView({
  events,
  pastEvents,
}: {
  events: EventItem[];
  pastEvents: EventItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const list = tab === "upcoming" ? events : pastEvents;

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const startsAt = formData.get("starts_at") as string;
      const result = await createEvent({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        location: formData.get("location") as string,
        starts_at: new Date(startsAt).toISOString(),
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Event created", "success");
        setCreateOpen(false);
        router.refresh();
      }
    });
  };

  const toggleRegistration = (event: EventItem) => {
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
    <>
      <FeatureScreen
        label="Events"
        title="Events"
        description="Upcoming gatherings, workshops, and meetups."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create event
          </Button>
        }
        toolbar={
          <Tabs
            className="w-fit"
            tabs={[
              { id: "upcoming", label: "Upcoming", count: events.length },
              { id: "past", label: "Past", count: pastEvents.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      >
        {list.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={tab === "upcoming" ? "No upcoming events" : "No past events"}
            description={
              tab === "upcoming"
                ? "Create an event or browse communities for gatherings."
                : "Past events will appear here."
            }
            action={
              tab === "upcoming"
                ? { label: "Create event", onClick: () => setCreateOpen(true) }
                : undefined
            }
          />
        ) : (
          <StaggerList>
            <EntityGrid className="lg:grid-cols-2">
            {list.map((event) => (
              <StaggerItem key={event.id}>
                <EntityCard
                  icon={Calendar}
                  title={event.title}
                  description={formatEventDate(event.starts_at)}
                  meta={
                    <div className="flex flex-wrap items-center gap-3 text-micro text-fg-muted">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden /> {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden /> {event.attendeeCount} attending
                      </span>
                    </div>
                  }
                  footer={
                    tab === "upcoming" ? (
                      <Button
                        size="sm"
                        variant={event.registered ? "secondary" : "primary"}
                        disabled={isPending}
                        onClick={() => toggleRegistration(event)}
                      >
                        {event.registered ? "Registered" : "Register"}
                      </Button>
                    ) : event.registered ? (
                      <Badge variant="brand">Attended</Badge>
                    ) : undefined
                  }
                />
              </StaggerItem>
            ))}
            </EntityGrid>
          </StaggerList>
        )}
      </FeatureScreen>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create event"
        description="Schedule a gathering for your community."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Event title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What is this event about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Online or address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts_at">Starts at</Label>
            <Input id="starts_at" name="starts_at" type="datetime-local" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create event
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
