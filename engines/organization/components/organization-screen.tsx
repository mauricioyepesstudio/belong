"use client";

import { createOrganization, joinOrganization } from "@/lib/actions/organizations";
import type { DiscoverOrganization, UserOrganization } from "@/lib/core/organizations";
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
  SearchField,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function OrganizationScreen({
  joined,
  discover,
}: {
  joined: UserOrganization[];
  discover: DiscoverOrganization[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("joined");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredJoined = useMemo(
    () =>
      joined.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase())
      ),
    [joined, query]
  );

  const filteredDiscover = useMemo(
    () =>
      discover.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase())
      ),
    [discover, query]
  );

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createOrganization({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
      });
      if (result.error) toast(result.error, "error");
      else if (result.slug) {
        toast("Organization created", "success");
        setCreateOpen(false);
        router.push(`/organizations/${result.slug}`);
        router.refresh();
      }
    });
  };

  const handleJoin = (organizationId: string) => {
    startTransition(async () => {
      const result = await joinOrganization(organizationId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined organization", "success");
        router.refresh();
      }
    });
  };

  const list = tab === "joined" ? filteredJoined : filteredDiscover;

  return (
    <>
      <FeatureScreen
        label="Organizations"
        title="Teams that build together"
        description="The highest level in BELONG — communities, projects, missions, and impact under one roof."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create organization
          </Button>
        }
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search organizations..."
          className="max-w-md"
        />

        <div className="mt-6 overflow-x-auto">
          <Tabs
            tabs={[
              { id: "joined", label: "Your organizations", count: joined.length },
              { id: "discover", label: "Discover", count: discover.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={tab === "joined" ? "No organizations yet" : "Nothing to discover"}
            description={
              tab === "joined"
                ? "Create an organization to unite your communities and projects."
                : "Try a different search."
            }
            action={
              tab === "joined"
                ? { label: "Create organization", onClick: () => setCreateOpen(true) }
                : undefined
            }
            className="mt-8 py-12"
          />
        ) : (
          <StaggerList className="mt-6">
            <EntityGrid>
              {list.map((org) => (
                <StaggerItem key={org.id}>
                  <EntityCard
                    href={`/organizations/${org.slug}`}
                    title={org.name}
                    description={org.description ?? undefined}
                    meta={`${org.memberCount} members · ${org.impact_score} impact`}
                    badges={
                      "role" in org ? (
                        <Badge variant="outline" className="capitalize">
                          {(org as UserOrganization).role}
                        </Badge>
                      ) : undefined
                    }
                    footer={
                      tab === "discover" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            handleJoin(org.id);
                          }}
                        >
                          Join
                        </Button>
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
        title="Create organization"
        description="Organizations own communities, projects, missions, and team impact."
      >
        <form action={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="org-create-name">Name</Label>
            <Input id="org-create-name" name="name" required placeholder="Acme Builders" />
          </div>
          <div>
            <Label htmlFor="org-create-desc">Description</Label>
            <Textarea id="org-create-desc" name="description" rows={3} placeholder="What does your team build?" />
          </div>
          <div>
            <Label htmlFor="org-create-website">Website (optional)</Label>
            <Input id="org-create-website" name="website" placeholder="https://" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
