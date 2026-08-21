"use client";

import {
  createCommunity,
  joinCommunity,
  leaveCommunity,
} from "@/lib/actions/communities";
import { configurePaidCommunity } from "@/lib/actions/billing";
import {
  respondToConnection,
  sendConnectionRequest,
  startConversation,
} from "@/lib/actions/connections";
import type { PendingConnection, DiscoverUser } from "@/lib/data/connections";
import type { DiscoverCommunity, UserCommunity } from "@/lib/core";
import { formatCents, PayModal } from "@/engines/billing";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
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
import { formatInitials } from "@/lib/format";
import type { CommunityMemberRole } from "@/types/database.types";
import { MessageSquare, Plus, UserPlus, Users, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { playSound } from "@/lib/sound";
import { useMemo, useState, useTransition } from "react";
import {
  canMessageConnection,
  type UserConnectionState,
} from "@/lib/core/connection-state";

type CommunityScreenProps = {
  joined: UserCommunity[];
  discover: DiscoverCommunity[];
  pending: PendingConnection[];
  people: DiscoverUser[];
  initialTab?: string;
  initialQuery?: string;
};

export function CommunityScreen({
  joined,
  discover,
  pending: pendingRequests,
  people,
  initialTab,
  initialQuery,
}: CommunityScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const validTabs = new Set(["joined", "discover", "people"]);
  const [tab, setTab] = useState(
    initialTab && validTabs.has(initialTab) ? initialTab : "joined"
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [monetizeOpen, setMonetizeOpen] = useState(false);
  const [monetizeId, setMonetizeId] = useState<string | null>(null);
  const [tipUser, setTipUser] = useState<DiscoverUser | null>(null);
  const [connectionOverrides, setConnectionOverrides] = useState<
    Map<string, UserConnectionState>
  >(new Map());
  const [isPending, startTransition] = useTransition();
  const [membershipOverrides, setMembershipOverrides] = useState<
    Map<string, CommunityMemberRole | "left">
  >(new Map());

  const membershipById = useMemo(() => {
    const map = new Map(joined.map((c) => [c.id, c.role]));
    for (const [id, role] of membershipOverrides) {
      if (role === "left") map.delete(id);
      else map.set(id, role);
    }
    return map;
  }, [joined, membershipOverrides]);

  const filtered = useMemo(() => {
    if (tab === "people") {
      return people.filter((p) =>
        (p.full_name ?? "").toLowerCase().includes(query.toLowerCase())
      );
    }
    const base = tab === "joined" ? joined : discover;
    if (!query.trim()) return base;
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (c.tag ?? "").toLowerCase().includes(query.toLowerCase())
    );
  }, [tab, query, joined, discover, people]);

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCommunity({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        tag: formData.get("tag") as string,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Community created", "success");
        setCreateOpen(false);
        router.refresh();
        if (result.slug) router.push(`/community/${result.slug}`);
      }
    });
  };

  const handleJoin = (communityId: string) => {
    startTransition(async () => {
      const result = await joinCommunity(communityId);
      if (result.error) toast(result.error, "error");
      else if (result.url) window.location.href = result.url;
      else {
        toast("Joined community", "success");
        setMembershipOverrides((prev) => new Map(prev).set(communityId, "member"));
        setTab("joined");
        router.refresh();
      }
    });
  };

  const handleMonetize = (formData: FormData) => {
    if (!monetizeId) return;
    const price = parseFloat(formData.get("price") as string);
    const cents = Math.round(price * 100);
    startTransition(async () => {
      const result = await configurePaidCommunity(monetizeId, cents);
      if (result.error) toast(result.error, "error");
      else {
        toast("Paid access enabled", "success");
        setMonetizeOpen(false);
        router.refresh();
      }
    });
  };

  const handleLeave = (communityId: string) => {
    startTransition(async () => {
      const result = await leaveCommunity(communityId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Left community", "success");
        setMembershipOverrides((prev) => new Map(prev).set(communityId, "left"));
        router.refresh();
      }
    });
  };

  const handleConnection = (
    connectionId: string,
    accept: boolean,
    userId?: string
  ) => {
    startTransition(async () => {
      const result = await respondToConnection(connectionId, accept);
      if (result.error) toast(result.error, "error");
      else {
        if (userId) {
          setConnectionOverrides((prev) =>
            new Map(prev).set(userId, {
              id: accept ? connectionId : null,
              state: accept ? "connected" : "none",
            })
          );
        }
        if (accept) playSound("connection-accepted");
        toast(accept ? "Connection accepted" : "Request declined", "success");
        router.refresh();
      }
    });
  };

  const handleConnect = (userId: string) => {
    startTransition(async () => {
      const result = await sendConnectionRequest(userId);
      if (result.error) toast(result.error, "error");
      else {
        setConnectionOverrides((prev) =>
          new Map(prev).set(userId, {
            id: result.id ?? null,
            state: "pending-sent",
          })
        );
        playSound("connection-request-sent");
        toast("Connection request sent", "success");
      }
    });
  };

  const handleMessage = (userId: string) => {
    startTransition(async () => {
      const result = await startConversation(userId);
      if (result.error) toast(result.error, "error");
      else if (result.id) router.push(`/messages?conversation=${result.id}`);
    });
  };

  return (
    <>
      <FeatureScreen
        label="Community"
        title="Your communities"
        description="Discover builders, join communities, and grow your network."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create
          </Button>
        }
        toolbar={
          <div className="flex flex-col gap-4">
            {pendingRequests.length > 0 && (
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
                <p className="mb-3 text-sm font-semibold text-fg-primary">
                  Pending connection requests
                </p>
                <ul className="space-y-2">
                  {pendingRequests.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated/80 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={req.requester.avatar_url ?? undefined}
                          fallback={formatInitials(req.requester.full_name)}
                          size="sm"
                        />
                        <span className="text-sm">{req.requester.full_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleConnection(req.id, false)}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleConnection(req.id, true)}
                        >
                          Accept
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                tabs={[
                  { id: "joined", label: "Joined", count: joined.length },
                  { id: "discover", label: "Discover" },
                  { id: "people", label: "People" },
                ]}
                active={tab}
                onChange={setTab}
              />
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder={
                  tab === "people" ? "Search people..." : "Search communities..."
                }
                aria-label="Search"
              />
            </div>
          </div>
        }
      >
        {tab === "people" ? (
          filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query.trim() ? "No builders match your search" : "No builders found yet"}
              description={
                query.trim()
                  ? "Try a different name or browse communities to meet builders there."
                  : "Browse communities to connect with members, or check back as more builders join."
              }
              action={
                query.trim()
                  ? { label: "Clear search", onClick: () => setQuery("") }
                  : { label: "Browse communities", href: "/community?tab=discover" }
              }
            />
          ) : (
            <StaggerList
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              reveal={false}
            >
              {(filtered as DiscoverUser[]).map((person) => {
                const connection =
                  connectionOverrides.get(person.id) ?? person.connection;
                const receivedConnectionId =
                  connection.state === "pending-received" ? connection.id : null;
                const canMessage = canMessageConnection(connection.state);
                const messageLabel = canMessage
                  ? `Message ${person.full_name ?? "builder"}`
                  : `Connect with ${person.full_name ?? "this builder"} before messaging`;
                return (
                  <StaggerItem key={person.id}>
                    <Card>
                      <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={person.avatar_url ?? undefined}
                          fallback={formatInitials(person.full_name)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-fg-primary">
                            {person.full_name ?? "Builder"}
                          </p>
                          <p className="truncate text-xs text-fg-muted">
                            {person.role ?? person.build_goal ?? "Member"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {receivedConnectionId ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              disabled={isPending}
                              onClick={() =>
                                handleConnection(receivedConnectionId, false, person.id)
                              }
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={isPending}
                              onClick={() =>
                                handleConnection(receivedConnectionId, true, person.id)
                              }
                            >
                              Accept
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            disabled={isPending || connection.state !== "none"}
                            onClick={() => handleConnect(person.id)}
                          >
                            {connection.state === "none" && (
                              <UserPlus className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {connection.state === "connected"
                              ? "Connected"
                              : connection.state === "pending-sent"
                                ? "Pending"
                                : "Connect"}
                          </Button>
                        )}
                        {person.connect_charges_enabled && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => setTipUser(person)}
                            aria-label="Tip"
                          >
                            <DollarSign className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending || !canMessage}
                          onClick={() => handleMessage(person.id)}
                          aria-label={messageLabel}
                          title={messageLabel}
                        >
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={tab === "joined" ? "No communities yet" : "No communities found"}
            description={
              tab === "joined"
                ? "Join a community to connect with builders who share your mission."
                : query
                  ? "Try a different search term."
                  : "Browse communities to find your people."
            }
            action={
              tab === "discover" && query
                ? { label: "Clear search", onClick: () => setQuery("") }
                : tab === "joined"
                  ? {
                      label: "Browse communities",
                      onClick: () => {
                        setTab("discover");
                        setQuery("");
                      },
                    }
                  : undefined
            }
          />
        ) : (
          <StaggerList reveal={false}>
            <EntityGrid>
            {(filtered as (UserCommunity | DiscoverCommunity)[]).map((c) => {
              const role = membershipById.get(c.id);
              return (
              <StaggerItem key={c.id}>
                <EntityCard
                  icon={Users}
                  title={c.name}
                  description={c.description}
                  href={`/community/${c.slug}`}
                  badges={
                    role ? (
                      <Badge variant={role === "admin" || role === "owner" ? "brand" : "outline"}>
                        {role}
                      </Badge>
                    ) : c.is_paid && c.subscription_price_cents ? (
                      <Badge variant="brand">{formatCents(c.subscription_price_cents)}/mo</Badge>
                    ) : undefined
                  }
                  meta={
                    <div className="flex flex-wrap items-center gap-2">
                      {c.tag && <Badge variant="outline">{c.tag}</Badge>}
                      <span className="text-micro text-fg-muted">
                        {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  }
                  footer={
                    tab === "discover" ? (
                      role === "owner" && !c.is_paid ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          disabled={isPending}
                          onClick={() => {
                            setMonetizeId(c.id);
                            setMonetizeOpen(true);
                          }}
                        >
                          Enable paid access
                        </Button>
                      ) : role && role !== "owner" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          disabled={isPending}
                          onClick={() => handleLeave(c.id)}
                        >
                          Leave
                        </Button>
                      ) : role ? (
                        <Button size="sm" variant="secondary" className="w-full" disabled>
                          Joined
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={isPending}
                          onClick={() => handleJoin(c.id)}
                        >
                          {c.is_paid ? "Subscribe" : "Join community"}
                        </Button>
                      )
                    ) : "role" in c && c.role === "owner" && !c.is_paid ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => {
                          setMonetizeId(c.id);
                          setMonetizeOpen(true);
                        }}
                      >
                        Enable paid access
                      </Button>
                    ) : "role" in c && c.role && c.role !== "owner" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => handleLeave(c.id)}
                      >
                        Leave
                      </Button>
                    ) : undefined
                  }
                />
              </StaggerItem>
            );
            })}
            </EntityGrid>
          </StaggerList>
        )}
      </FeatureScreen>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create community"
        description="Start a purpose-driven community on BELONG."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Community name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What is this community about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Input id="tag" name="tag" placeholder="e.g. Startup, Wellness" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={monetizeOpen}
        onClose={() => setMonetizeOpen(false)}
        title="Enable paid access"
        description="Set a monthly subscription price for your community."
      >
        <form action={handleMonetize} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Monthly price (USD)</Label>
            <Input id="price" name="price" type="number" min="5" step="0.01" required placeholder="9.99" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMonetizeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Enable
            </Button>
          </div>
        </form>
      </Modal>

      {tipUser && (
        <PayModal
          open={Boolean(tipUser)}
          onClose={() => setTipUser(null)}
          recipientId={tipUser.id}
          recipientName={tipUser.full_name ?? "Builder"}
          mode="tip"
        />
      )}
    </>
  );
}
