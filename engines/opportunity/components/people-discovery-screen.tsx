"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Loader2, Rows3, Sparkles, Users, X } from "lucide-react";
import { Button, EmptyState, useToast } from "@/systems/design-system";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import { sendConnectionRequest, startConversation } from "@/lib/actions/connections";
import type { UserConnectionState } from "@/lib/core/connection-state";
import {
  DISCOVERY_CATEGORIES,
  type DiscoverPeopleResult,
  type DiscoveryCategory,
  type DiscoveryPerson,
} from "@/engines/opportunity";
import { DiscoveryCategoryChips } from "./discovery-category-chips";
import { DiscoveryPersonCard } from "./discovery-person-card";
import { loadMoreDiscoveryPeople } from "./discovery-load-more";
import { PeopleStoryDeckV2Layout } from "@/components/features/discovery/story-deck/v2/PeopleStoryDeckV2Layout";

type PeopleDiscoveryScreenProps = {
  initialCategory: DiscoveryCategory;
  initialResult: DiscoverPeopleResult;
};

export function PeopleDiscoveryScreen({
  initialCategory,
  initialResult,
}: PeopleDiscoveryScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [isNavPending, startNav] = useTransition();
  const [isConnecting, startConnect] = useTransition();
  const [pendingCategory, setPendingCategory] = useState<DiscoveryCategory | null>(null);
  const [connectionOverrides, setConnectionOverrides] = useState<Map<string, UserConnectionState>>(new Map());
  const [viewMode, setViewMode] = useState<"focus" | "grid">("focus");

  const [prevInitialCategory, setPrevInitialCategory] = useState(initialCategory);
  if (initialCategory !== prevInitialCategory) {
    setPrevInitialCategory(initialCategory);
    setPendingCategory(null);
  }

  const activeCategory = pendingCategory ?? initialCategory;

  const handleCategorySelect = useCallback(
    (category: DiscoveryCategory) => {
      if (category === activeCategory) return;
      setPendingCategory(category);
      startNav(() => {
        const params = new URLSearchParams();
        if (category !== "All") params.set("category", category);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [activeCategory, pathname, router]
  );

  const handleConnect = useCallback(
    (person: DiscoveryPerson) => {
      startConnect(async () => {
        const result = await sendConnectionRequest(person.id);
        if (result.error) {
          toast(result.error, "error");
          return;
        }
        setConnectionOverrides((prev) =>
          new Map(prev).set(person.id, { id: result.id ?? null, state: "pending-sent" })
        );
        toast(`Request sent to ${person.fullName}`, "success");
      });
    },
    [toast]
  );

  const handleMessage = useCallback((person: DiscoveryPerson) => {
    startConnect(async () => {
      const result = await startConversation(person.id);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      router.push(`/messages?conversation=${result.id}`);
    });
  }, [router, toast]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/community?tab=people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        </Link>
        <p className="text-label">Discover people</p>
      </div>

      <div>
        <h1 className="text-display whitespace-pre-line text-fg-primary">
          {"People who move\nwhat matters to you."}
        </h1>
        <p className="mt-3 whitespace-pre-line text-body-lg">
          {"Connect with people aligned with your goals,\nvalues, skills, and interests."}
        </p>
      </div>

      <DiscoveryCategoryChips
        categories={DISCOVERY_CATEGORIES}
        active={activeCategory}
        onSelect={handleCategorySelect}
        disabled={isNavPending}
      />

      <div className="flex justify-end gap-2" aria-label="Discovery view">
        <Button size="sm" variant={viewMode === "focus" ? "brand" : "secondary"} onClick={() => setViewMode("focus")}>
          <Rows3 className="h-4 w-4" aria-hidden /> Discover
        </Button>
        <Button size="sm" variant={viewMode === "grid" ? "brand" : "secondary"} onClick={() => setViewMode("grid")}>
          <LayoutGrid className="h-4 w-4" aria-hidden /> Browse
        </Button>
      </div>

      <div aria-busy={isNavPending} className={isNavPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {viewMode === "focus" ? (
           <PeopleStoryDeckV2Layout
             people={initialResult.people}
             onClose={() => setViewMode("grid")}
           />
        ) : (
          <DiscoveryPeopleList
            key={initialCategory}
            category={initialCategory}
            initialResult={initialResult}
            connectionOverrides={connectionOverrides}
            isConnecting={isConnecting}
            onConnect={handleConnect}
            onMessage={handleMessage}
            viewMode={viewMode}
          />
        )}
      </div>
    </div>
  );
}

type DiscoveryPeopleListProps = {
  category: DiscoveryCategory;
  initialResult: DiscoverPeopleResult;
  connectionOverrides: Map<string, UserConnectionState>;
  isConnecting: boolean;
  onConnect: (person: DiscoveryPerson) => void;
  onMessage: (person: DiscoveryPerson) => void;
  viewMode: "focus" | "grid";
};

function DiscoveryPeopleList({
  category,
  initialResult,
  connectionOverrides,
  isConnecting,
  onConnect,
  onMessage,
  viewMode,
}: DiscoveryPeopleListProps) {
  const { toast } = useToast();
  const [people, setPeople] = useState<DiscoveryPerson[]>(initialResult.people);
  const [offset, setOffset] = useState(initialResult.offset + initialResult.limit);
  const [hasMore, setHasMore] = useState(initialResult.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const visiblePeople = people.filter((person) => !dismissedIds.has(person.id));

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    const result = await loadMoreDiscoveryPeople(category, offset);
    setIsLoadingMore(false);

    if ("error" in result) {
      toast(result.error, "error");
      return;
    }

    setPeople((prev) => [...prev, ...result.people]);
    setOffset(result.offset + result.limit);
    setHasMore(result.hasMore);
  }, [category, offset, toast]);

  if (visiblePeople.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={category === "All" ? "No people are available yet" : "No one matches this filter yet"}
        description={
          category === "All"
            ? "As more builders join BELONG, people aligned with you will appear here."
            : "Try another category or return to All to see everyone available."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <StaggerList className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-2xl"} reveal={false}>
        {visiblePeople.map((person) => (
          <StaggerItem key={person.id}>
            <DiscoveryPersonCard
              person={person}
              connection={connectionOverrides.get(person.id) ?? person.connectionState}
              isConnecting={isConnecting}
              onConnect={onConnect}
              onMessage={onMessage}
            />
          </StaggerItem>
        ))}
      </StaggerList>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Load more people
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
