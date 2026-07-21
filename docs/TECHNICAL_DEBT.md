# BELONG Technical Debt Report

**Sprint:** Foundation Sprint (Architecture)  
**Date:** July 21, 2026  
**Goal:** Prepare BELONG to scale from hundreds to tens of thousands of users.

---

## Executive Summary

The codebase follows a sound Next.js App Router + domain engines pattern. Platform pages are thin RSC entry points; business logic lives in `lib/core`, `lib/data`, and `lib/actions`. This sprint focused on deduplication, dead-code removal, error resilience, caching, and component decomposition—without changing user-visible features.

### Completed in This Sprint

| Area | Change |
|------|--------|
| Shared action utilities | `lib/actions/_shared.ts` — author mapping, membership guards, revalidation helpers |
| Post card deduplication | `components/shared/post-card.tsx` with memoized `CommunityPostCard` / `ProjectPostCard` wrappers |
| Dead code removal | Legacy home/dashboard UI, unused graph module, orphaned AI/mission/impact panels (~8k+ lines) |
| Error boundaries | `global-error.tsx`, marketing + dynamic route errors, `SegmentErrorBoundary` for Copilot |
| Hook centralization | `hooks/index.ts` barrel re-exporting app + realtime hooks |
| Data layer | Complete `lib/data/index.ts` barrel; `React.cache()` on detail loaders |
| Component splits | `CommunityPostFeed`, `ProjectPostFeed` extracted from 500–700 line detail screens |
| Memoization | `PostCard`, post card wrappers, `RecommendationCard` |

---

## 1. React Page Audit (26 routes)

All platform pages are **thin** (7–35 lines): fetch in RSC, render engine screen.

| Status | Count | Notes |
|--------|-------|-------|
| Healthy | 24 | Delegate to engine screens |
| Review | 1 | `(marketing)/page.tsx` (106 lines) — inline UI; extract to component when marketing evolves |
| Review | 1 | `(platform)/layout.tsx` — `force-dynamic`, fetches profile/notifications/stats on every route |

**Recommendation:** Add `React.cache()` or segment-level caching to platform layout stats when traffic grows. Consider `loading.tsx` skeletons for detail routes.

---

## 2. Oversized Components (Remaining)

| Lines | File | Priority |
|------:|------|----------|
| ~620 | `engines/project/components/project-detail-screen.tsx` | P1 — split header/actions, modals |
| ~490 | `engines/community/components/community-detail-screen.tsx` | P1 — split members tab |
| 507 | `engines/organization/components/organization-tabs.tsx` | P1 |
| 505 | `engines/community/components/community-screen.tsx` | P2 |
| 379 | `engines/project/components/project-screen.tsx` | P2 |
| 341 | `components/features/settings/settings-view.tsx` | P2 |
| 295 | `engines/belong/components/dashboard/dashboard-actions.tsx` | P2 — extract modals |
| 260 | `components/features/messages/messages-view.tsx` | P2 — memoize conversation rows |

Post feed extraction reduced detail screens by ~80 lines each; further splits should target members management and modals.

---

## 3. Architecture Layers

```
types/database.types.ts
        ↓
lib/core/          ← Pure fetch/transform (Supabase queries)
        ↓
lib/data/          ← RSC read facades (session + cache)
        ↓
lib/actions/       ← Server mutations + revalidation
        ↓
engines/*/         ← Domain orchestration + UI screens
        ↓
app/**/page.tsx    ← Thin RSC entry points
```

### Remaining Inconsistencies

- **`engines/belong/data.ts`** (~220 lines) — home page god-module with 15+ parallel fetches. Should compose `lib/data/*` loaders.
- **`lib/actions/connect.ts` vs `connections.ts`** — naming collision risk (Stripe Connect vs social graph).
- **`systems/index.ts`** — secondary namespace export; prefer direct `@/engines/*` imports.

---

## 4. Caching Status

| Loader | Caching |
|--------|---------|
| `getCommunityDetail` | `React.cache()` per request |
| `getProjectDetail` | `React.cache()` per request |
| Home engine data | None — full refetch each visit |
| Platform layout stats | None — refetch every navigation |

**Next steps:** Add `unstable_cache` with tag-based revalidation for discover lists; tie tags to existing `revalidatePath` calls in `_shared.ts`.

---

## 5. Optimistic Updates

| Feature | Status |
|---------|--------|
| Post like/unlike | Optimistic with rollback |
| Post comments | Server-confirmed append |
| Connection requests | Server-only |
| Project tasks | Server-only |

Post interactions are the most user-visible optimistic path and are implemented correctly. Extend pattern to messaging read receipts when realtime volume increases.

---

## 6. Error Boundaries

| Boundary | Status |
|----------|--------|
| `app/global-error.tsx` | Added |
| `app/(marketing)/error.tsx` | Added |
| `app/(platform)/error.tsx` | Existing |
| `community/[slug]/error.tsx` | Added |
| `projects/[id]/error.tsx` | Added |
| Copilot panels | Wrapped in `SegmentErrorBoundary` |

**Remaining:** Add `error.tsx` for `organizations/[slug]`, `events/[id]`, `missions/[id]`. Add `loading.tsx` for slow detail routes.

---

## 7. Memoization

Previously **zero** `React.memo` usage. Now memoized:

- `PostCard` (shared)
- `CommunityPostCard` / `ProjectPostCard` (wrappers)
- `RecommendationCard`

**Still needed:** `MissionCard`, message conversation rows, workspace tab content, trending community cards.

---

## 8. TypeScript Gaps

- Integration tests missing `organization_id` on community/project inserts (pre-existing).
- Some `as PostWithMeta` casts in post card wrappers — unify `CommunityPostWithMeta` / `ProjectPostWithMeta` under shared `PostWithMeta` in `lib/core`.
- `engines/belong/data.ts` Omit types are fragile when adding fields.

---

## 9. Dead Code Removed

- Legacy home: timeline, discovery panel, impact metrics, primary actions, activity card
- Legacy dashboard: missions, feed, smart home, timeline, impact rows (kept `dashboard-actions`, `primitives`)
- `engines/graph/` — unused visualization module
- Orphaned panels: `AICoach`, `CoachBriefing`, `LifeMissionPanel`, `MissionEnginePanel`, `ImpactPanel`

**Tooling recommendation:** Add `knip` or `ts-prune` to CI to prevent regression.

---

## 10. Prioritized Backlog

### P0 — Before 10k users

1. Split `organization-tabs.tsx` and remaining detail screen modals
2. Decompose `engines/belong/data.ts` into composable loaders
3. Add tag-based cache invalidation for list endpoints
4. Memoize list rows in messages and marketplace

### P1 — Scale preparation

5. Platform layout: move notification counts to client polling or SWR
6. Add `loading.tsx` + Suspense to all dynamic `[slug]`/`[id]` routes
7. Consolidate `GlassCard` primitive out of `dashboard/` into `components/shared/`
8. Realtime hook documentation and ownership in `hooks/README` or AGENTS.md

### P2 — Polish

9. Extract marketing page content from `app/(marketing)/page.tsx`
10. Unified post row mapper in `engines/core/realtime/helpers.ts`
11. CI dead-code detection (`knip`)
12. E2E smoke tests for critical paths (auth, post, join, message)

---

## 11. Page Inventory

| Route | Lines | Pattern |
|-------|------:|---------|
| `/dashboard` | 7 | RSC → HomeScreen |
| `/community` | 31 | RSC → CommunityScreen |
| `/community/[slug]` | 35 | RSC → CommunityDetailScreen |
| `/projects` | 24 | RSC → ProjectScreen |
| `/projects/[id]` | 32 | RSC → ProjectDetailScreen |
| `/organizations/[slug]` | 35 | RSC → OrganizationDetailScreen |
| `/messages` | 26 | RSC → MessagesView |
| `/settings` | 29 | RSC + Suspense |
| `/search` | 25 | RSC → SearchResults |
| `/profile` | 33 | RSC → ProfileView |
| Marketing `/` | 106 | Inline (candidate for extraction) |

All other platform routes follow the same thin-page pattern.

---

## Metrics

| Metric | Before | After (est.) |
|--------|--------|--------------|
| Duplicate post card LOC | ~650 | ~120 wrappers + 1 shared component |
| Dead UI files | ~25 | 0 (removed) |
| Error boundary coverage | 4 segments | 7 segments + segment wrapper |
| Memoized list components | 0 | 4 |
| `lib/data` barrel exports | 7 modules | 11 modules |

---

*This report should be updated after each architecture sprint. No user-facing features were added or redesigned in this sprint.*
