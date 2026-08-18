---
name: project-people-discover-route
description: New /people/discover "Encuentra amigos" route — data flow, GlassCard location, and category-filter architecture decisions
metadata:
  type: project
---

Built the new `/people/discover` route (not a modification of any existing screen) consuming the already-built `engines/opportunity/discovery.ts` (`discoverPeople`, `DISCOVERY_CATEGORIES`) — that backend file and its siblings (`data.ts`, `matchers.ts`, `scoring.ts`, `index.ts`) were pre-existing/untracked when this slice started and were read-only for this task.

Files created:
- `app/(platform)/people/discover/page.tsx` — server component, auth via `requireProfile()` + `createClient()` from `lib/auth/session` / `lib/supabase/server`, exactly matching the pattern in `app/(platform)/opportunities/page.tsx`.
- `app/(platform)/people/discover/loading.tsx`
- `engines/opportunity/components/people-discovery-screen.tsx` — main client screen
- `engines/opportunity/components/discovery-category-chips.tsx`
- `engines/opportunity/components/discovery-person-card.tsx`
- `engines/opportunity/components/discovery-load-more.ts` — small `"use server"` action, thin wrapper around `discoverPeople`, used only for pagination (not category switching)

Key non-obvious decisions:
- **GlassCard lives at `engines/belong/components/dashboard/primitives.tsx`**, not in `systems/design-system`. It renders `.surface-glass rounded-3xl` (defined in `app/globals.css`). This is the actual "dark glass" primitive referenced by BELONG visual language — [[feedback_no_stock_art_placeholder]] context also applies here (no stock avatars; `Avatar` component's real `formatInitials` fallback from `lib/format` is used instead).
- The whole app is dark-navy-by-default via CSS vars in `app/globals.css` (`--bg-base: #030014` etc.) — `systems/design-system` components (Card, Badge, Button, EmptyState) are already dark-themed, so no separate light/dark branching was needed.
- **Category filter uses URL searchParams + `router.push`** (server re-render pattern, same as `?tab=&q=` in `app/(platform)/community/page.tsx`), NOT client-side filtering — because `discoverPeople`'s category filtering does real Supabase community-tag lookups server-side and can't be replicated cheaply client-side. Pagination ("load more"), by contrast, uses a small colocated server action (`discovery-load-more.ts`) since re-fetching via URL would replace rather than append the list.
- Chip-tap gives instant visual feedback (`pendingCategory` state) while content only ever swaps once the real server-fetched `initialResult` arrives (list is keyed by `initialCategory` to reset "load more" state), avoiding any flash of mismatched category content. The `pendingCategory` reset-on-prop-change logic must be done as a render-time state adjustment (`if (initialCategory !== prevInitialCategory) { ... }`), NOT `useEffect` — the project's ESLint config (`react-hooks/set-state-in-effect`) hard-errors on synchronous `setState` inside `useEffect`.
- `pending-received` connection state is deliberately treated identically to `pending-sent` (disabled "Pendiente" button) for V1 — task explicitly allowed this fallback instead of building a separate accept/decline UI on this screen (that flow already exists on `/community`).
- No hardcoded/mock people anywhere; empty state is real (`people.length === 0` branches on whether a category filter is active for the copy).
