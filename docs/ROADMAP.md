# BELONG — Production Roadmap

**Status:** Active · July 2026  
**Architecture version:** 1.0.0-arch (frozen)  
**Team target:** 20 engineers across 5 squads

---

## Current State Summary

| Area | Status |
|------|--------|
| Auth (email, Google, Apple) | ✅ Shipped |
| Onboarding (build goal) | ✅ Shipped |
| Dashboard (real data + AI insights) | ✅ Shipped |
| Community browse/join UI | ⚠️ Read-only |
| Projects / Events / Messages | ⚠️ Read-only |
| Connections | ⚠️ Schema only |
| Architecture docs | ✅ This release |
| REST API | ❌ Not started |
| Mobile | ❌ Not started |
| Tests | ❌ Not started |
| CI/CD | ❌ Not started |

---

## Phase 0 — Foundation Lock (Complete)

**Goal:** Freeze architecture for parallel team execution.

- [x] Engine + systems layer structure
- [x] Shared `lib/core` data primitives
- [x] Design system patterns (`FeatureScreen`, `StatCard`, etc.)
- [x] Documentation suite (`/docs`)
- [x] Remove duplicate/dead shims
- [x] Production build passing

**Exit criteria:** All engineers can onboard from docs alone. ✅

---

## Phase 1 — Write Path & Core Loops (Weeks 1–6)

**Goal:** Every core entity has create/update flows. No read-only screens.

**Squad: Core Product + Data**

| Task | Owner | Priority |
|------|-------|----------|
| `createProject` / `updateProject` server actions | Collaboration | P0 |
| `createEvent` / `registerEvent` actions | Community | P0 |
| `joinCommunity` / `createCommunity` actions | Community | P0 |
| `sendConnectionRequest` / `acceptConnection` actions | Community | P0 |
| Wire Create buttons (currently inert) | Core Product | P0 |
| Notification triggers via `create_notification()` | Data | P1 |
| Form modals using approved `Modal` primitive | Platform | P1 |
| Zod validation shared schemas (`lib/validation/`) | Platform | P1 |

**Exit criteria:** User can create project, join community, register for event, send connection request.

---

## Phase 2 — Engine Migration (Weeks 4–10)

**Goal:** Eliminate legacy `components/features` split.

| Route | Action |
|-------|--------|
| `/projects` | → `engines/projects` (data + screen) |
| `/events` | → `engines/events` |
| `/messages` | → `engines/messages` |
| `/notifications` | → `engines/notifications` |
| `/profile` | → `engines/profile` (use `MissionCard`) |
| `/settings` | → `engines/settings` |
| `/community` | Move data from `lib/data` into engine |

**Also:**
- Migrate `MessagesView`, `ProfileView`, `SettingsView` to `FeatureScreen`
- Delete empty `components/features/*` after migration
- Consolidate `lib/data/*` into engine `data.ts` or keep `lib/core` only

**Exit criteria:** Zero imports from `components/features`. Single pattern per route.

---

## Phase 3 — Quality & Observability (Weeks 8–12)

**Goal:** Production confidence for public beta.

| Task | Priority |
|------|----------|
| Vitest unit tests for `lib/core`, `engines/ai` | P0 |
| Playwright E2E: auth, onboarding, dashboard | P0 |
| GitHub Actions: lint, tsc, build, test | P0 |
| Supabase type gen in CI (`database.generated.ts`) | P1 |
| Error tracking (Sentry) | P1 |
| Structured logging for server actions | P2 |
| Per-route loading skeletons | P2 |
| Rate limiting on auth actions | P1 |

**Exit criteria:** CI green on every PR. E2E covers critical paths.

---

## Phase 4 — Platform API & Realtime (Weeks 12–18)

**Goal:** Enable mobile and third-party integrations.

| Task | Priority |
|------|----------|
| REST or tRPC `/api/v1` layer | P1 |
| Shared Zod schemas → OpenAPI spec | P1 |
| Supabase Realtime for messages | P1 |
| Supabase Realtime for notifications | P2 |
| Webhook handlers (Supabase → app) | P2 |
| API key auth for partners | P3 |

**Exit criteria:** Mobile prototype consumes API. Messages update live.

---

## Phase 5 — AI v2 (Weeks 16–24)

**Goal:** Replace rule-based insights with LLM — same interface.

| Task | Priority |
|------|----------|
| `AIService` interface (already defined) | — |
| LLM provider integration (OpenAI/Anthropic) | P1 |
| Mission refinement copilot | P1 |
| Community/project matching | P2 |
| Safety + moderation layer | P0 |
| Cost controls + caching | P1 |

**Exit criteria:** `BelongAIService` swappable without UI changes.

---

## Phase 6 — Scale & Growth (Weeks 20+)

| Task | Priority |
|------|----------|
| Search (communities, projects, people) | P1 |
| Email notifications (Resend/Postmark) | P1 |
| Admin console | P2 |
| Analytics (PostHog/Amplitude) | P1 |
| i18n foundation | P3 |
| Performance: RSC caching, query optimization | P1 |

---

## Technical Debt Register

Tracked items from architecture audit. **Do not fix opportunistically — schedule in phases.**

| ID | Item | Phase |
|----|------|-------|
| TD-01 | Legacy feature views not in engines | Phase 2 |
| TD-02 | Connections schema without UI | Phase 1 |
| TD-03 | `create_notification()` unused | Phase 1 |
| TD-04 | Unused UI: Modal, Dropdown, GlassPanel | Phase 1 or delete |
| TD-05 | Unused skeletons | Phase 3 |
| TD-06 | `engines/mission/data.ts` not exported | Phase 2 |
| TD-07 | `lib/env.ts` unused | Phase 3 |
| TD-08 | `/dashboard` redirect (keep for bookmarks) | — |
| TD-09 | Hand-maintained `database.types.ts` | Phase 3 |
| TD-10 | README still create-next-app boilerplate | Phase 0 follow-up |

---

## Squad Allocation (20 engineers)

| Squad | Size | Focus |
|-------|------|-------|
| **Platform** | 4 | systems/*, auth, CI, design system governance |
| **Core Product** | 4 | dashboard, mission, onboarding, profile |
| **Community** | 4 | communities, connections, events, discovery |
| **Collaboration** | 4 | projects, messages, notifications |
| **Data & AI** | 4 | lib/core, migrations, AI engine, analytics |

Each squad owns engine(s), corresponding migrations, and E2E tests for their routes.

---

## Definition of Done (Global)

1. Uses `@/systems/design-system` — no new UI forks
2. Server actions documented in `API_SPEC.md`
3. Types updated in `database.types.ts`
4. No regression in `npm run build`
5. PR reviewed by platform squad if touching `systems/` or `lib/core/`

---

## Milestones

| Milestone | Target | Signal |
|-----------|--------|--------|
| **Alpha** | Phase 1 complete | Full write paths |
| **Beta** | Phase 3 complete | CI + E2E green |
| **Public launch** | Phase 4 complete | API + realtime |
| **Growth** | Phase 6 | Search, email, analytics |

---

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [API_SPEC.md](./API_SPEC.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)
