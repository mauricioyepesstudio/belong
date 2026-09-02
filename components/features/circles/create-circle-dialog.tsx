"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { createCircle } from "@/lib/actions/circles";
import { CIRCLE_MAX_MEMBERS } from "@/engines/circles";
import { Avatar, Badge, Button, Input, Label, Modal, Textarea, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConnectedUser } from "@/lib/data/connections";

type CreateCircleDialogProps = {
  connections: ConnectedUser[];
};

/** Total members are capped at CIRCLE_MAX_MEMBERS including the creator. */
const MAX_INVITEES = CIRCLE_MAX_MEMBERS - 1;

export function CreateCircleDialog({ connections }: CreateCircleDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const filteredConnections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return connections;
    return connections.filter((connection) =>
      (connection.full_name ?? "").toLowerCase().includes(needle)
    );
  }, [connections, query]);

  const reset = () => {
    setName("");
    setGoalDescription("");
    setQuery("");
    setSelectedIds([]);
  };

  const handleClose = () => {
    if (isPending) return;
    setOpen(false);
    reset();
  };

  const toggleInvitee = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((existingId) => existingId !== id);
      if (prev.length >= MAX_INVITEES) {
        toast(`You can invite up to ${MAX_INVITEES} people`, "error");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedGoal = goalDescription.trim();
    if (!trimmedName) {
      toast("A circle name is required", "error");
      return;
    }
    if (!trimmedGoal) {
      toast("A goal description is required", "error");
      return;
    }

    startTransition(async () => {
      const result = await createCircle({
        name: trimmedName,
        goalDescription: trimmedGoal,
        inviteUserIds: selectedIds,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Circle created", "success");
      const createdId = result.id;
      setOpen(false);
      reset();
      if (createdId) {
        router.push(`/circles/${createdId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        Create a circle
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        title="Create a circle"
        description="Gather 1 to 5 people you trust around one shared, concrete goal."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="circle-name">Name</Label>
            <Input
              id="circle-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Launch the pilot by Q4"
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="circle-goal">Shared goal</Label>
            <Textarea
              id="circle-goal"
              value={goalDescription}
              onChange={(event) => setGoalDescription(event.target.value)}
              placeholder="What is the one concrete goal this circle is holding each other accountable to?"
              rows={3}
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>
              Invite people ({selectedIds.length}/{MAX_INVITEES})
            </Label>
            {connections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-fg-muted">
                You don&apos;t have any connections yet. You can create this circle now and invite
                people later from the circle page.
              </p>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint"
                    aria-hidden
                  />
                  <Input
                    className="pl-10"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search your connections"
                    disabled={isPending}
                    aria-label="Search your connections"
                  />
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
                  {filteredConnections.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-fg-muted">
                      No connections match &ldquo;{query}&rdquo;
                    </p>
                  ) : (
                    filteredConnections.map((connection) => {
                      const selected = selectedIds.includes(connection.id);
                      return (
                        <button
                          key={connection.id}
                          type="button"
                          onClick={() => toggleInvitee(connection.id)}
                          disabled={isPending}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                            selected ? "bg-brand/10" : "hover:bg-bg-hover"
                          )}
                        >
                          <Avatar
                            src={connection.avatar_url ?? undefined}
                            fallback={formatInitials(connection.full_name)}
                            size="sm"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
                            {connection.full_name ?? "Builder"}
                          </span>
                          {selected && <Badge variant="brand">Invited</Badge>}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending} disabled={isPending}>
              Create circle
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
