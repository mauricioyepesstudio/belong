"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Users } from "lucide-react";
import { Button, EmptyState, useToast } from "@/systems/design-system";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import { sendConnectionRequest } from "@/lib/actions/connections";
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
  const [connectionOverrides, setConnectionOverrides] = useState<
    Map<string, UserConnectionState>
  >(new Map());

  // The chip row reflects the just-tapped category immediately for
  // responsiveness; the actual list content only ever renders from
  // initialCategory/initialResult (the real server-fetched data). Once the
  // server round-trip lands and initialCategory changes to match, clear the
  // optimistic override — done as a render-time state adjustment (React's
  // recommended pattern) rather than an effect, since it only needs to run
  // in response to a prop change, not synchronize with anything external.
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
        if (category !== "Todos") params.set("category", category);
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
        toast(`Solicitud enviada a ${person.fullName}`, "success");
      });
    },
    [toast]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/community?tab=people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Atrás
          </Button>
        </Link>
        <p className="text-label">Encuentra amigos</p>
      </div>

      <div>
        <h1 className="text-display whitespace-pre-line text-fg-primary">
          {"Personas que impulsan\nlo que te importa."}
        </h1>
        <p className="mt-3 whitespace-pre-line text-body-lg">
          {"Conecta con personas afines a tus objetivos,\nvalores e intereses."}
        </p>
      </div>

      <DiscoveryCategoryChips
        categories={DISCOVERY_CATEGORIES}
        active={activeCategory}
        onSelect={handleCategorySelect}
        disabled={isNavPending}
      />

      <div aria-busy={isNavPending} className={isNavPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <DiscoveryPeopleList
          key={initialCategory}
          category={initialCategory}
          initialResult={initialResult}
          connectionOverrides={connectionOverrides}
          isConnecting={isConnecting}
          onConnect={handleConnect}
        />
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
};

function DiscoveryPeopleList({
  category,
  initialResult,
  connectionOverrides,
  isConnecting,
  onConnect,
}: DiscoveryPeopleListProps) {
  const { toast } = useToast();
  const [people, setPeople] = useState<DiscoveryPerson[]>(initialResult.people);
  const [offset, setOffset] = useState(initialResult.offset + initialResult.people.length);
  const [hasMore, setHasMore] = useState(initialResult.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    const result = await loadMoreDiscoveryPeople(category, offset);
    setIsLoadingMore(false);

    if ("error" in result) {
      toast(result.error, "error");
      return;
    }

    setPeople((prev) => [...prev, ...result.people]);
    setOffset((prev) => prev + result.people.length);
    setHasMore(result.hasMore);
  }, [category, offset, toast]);

  if (people.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={category === "Todos" ? "Aún no hay suficientes personas" : "Nadie coincide con este filtro todavía"}
        description={
          category === "Todos"
            ? "A medida que más builders se unan a BELONG y completen su perfil, aparecerán aquí personas afines a ti."
            : "Prueba con otra categoría o vuelve a \"Todos\" para ver a todas las personas disponibles."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" reveal={false}>
        {people.map((person) => (
          <StaggerItem key={person.id}>
            <DiscoveryPersonCard
              person={person}
              connection={connectionOverrides.get(person.id) ?? person.connectionState}
              isConnecting={isConnecting}
              onConnect={onConnect}
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
                Cargando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                Cargar más personas
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
