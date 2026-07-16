# BELONG — Architecture

**Status:** FROZEN · July 2026  
**Version:** 1.0.0-arch  
**Do not add parallel patterns without architecture review.**

This document is the canonical reference for a team of 20+ engineers. All new work must fit these boundaries.

---

## Architectural Principles

1. **Engines own domains** — business logic + screen components for a product area
2. **Systems own cross-cutting UI** — design system, layout, navigation
3. **lib/core owns data primitives** — Supabase queries that accept `(client, userId)`
4. **lib/data owns page fetchers** — auth-wrapped server loaders (thin wrappers)
5. **lib/actions owns mutations** — server actions only; no REST API layer yet
6. **app/ owns routing** — thin server pages; no business logic in route files
7. **No duplicate components** — extend `@/systems/design-system`, never fork

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  app/                    Routes, layouts, route handlers     │
├─────────────────────────────────────────────────────────────┤
│  engines/                Domain: dashboard, community,       │
│                          mission, ai, auth                   │
├─────────────────────────────────────────────────────────────┤
│  components/             Auth forms, legacy feature views,   │
│                          layout chrome, motion, onboarding   │
├─────────────────────────────────────────────────────────────┤
│  systems/                design-system · layout · navigation │
├─────────────────────────────────────────────────────────────┤
│  lib/                    core · data · actions · auth ·      │
│                          supabase · format · utils           │
├─────────────────────────────────────────────────────────────┤
│  supabase/               PostgreSQL schema + RLS (migrations)│
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Contract

| Path | Responsibility | Import as |
|------|----------------|-----------|
| `systems/design-system/` | Primitives + patterns | `@/systems/design-system` |
| `systems/layout/` | Shells, page chrome | `@/systems/layout` |
| `systems/navigation/` | Nav config, route lists | `@/systems/navigation` |
| `engines/dashboard/` | Home data + `DashboardScreen` | `@/engines/dashboard` |
| `engines/community/` | `CommunityScreen` + data re-exports | `@/engines/community` |
| `engines/mission/` | Build goals, mission UI | `@/engines/mission` |
| `engines/ai/` | Insight service + panel | `@/engines/ai` |
| `engines/auth/` | Auth facade (re-exports) | `@/engines/auth` |
| `lib/core/` | Shared Supabase query helpers | `@/lib/core` |
| `lib/data/` | Server-side page data loaders | `@/lib/data/<domain>` |
| `lib/actions/` | Server actions (mutations) | `@/lib/actions/<domain>` |
| `components/features/` | **Legacy** client views (migration target) | Direct import only |
| `components/ui/` | Base primitives (owned by design system) | Via design-system |

---

## Request Flow

### Server page (standard)

```
app/(platform)/<route>/page.tsx   [Server Component]
    → lib/data/*.ts or engines/*/data.ts
        → lib/core/*.ts
            → lib/supabase/server.ts
    → *Screen or *View           [Client Component]
        → systems/design-system
        → lib/actions/* (mutations)
```

### Middleware

```
middleware.ts → lib/supabase/middleware.ts
    → Session refresh (Supabase SSR)
    → Auth gate (systems/navigation authRoutes)
    → Onboarding gate (users.onboarding_completed)
    → Protected routes (systems/navigation platformRoutes + /dashboard)
```

---

## Engine Boundaries (Frozen)

### Dashboard Engine
- **Owns:** `getDashboardData()`, `DashboardScreen`, dashboard types
- **Delegates:** `lib/core` (stats, projects, events, conversations, communities), `engines/ai`, `engines/mission` (display)

### Community Engine
- **Owns:** `CommunityScreen`
- **Delegates:** `lib/data/communities.ts` for fetchers (data stays in lib until Phase 2 migration)

### Mission Engine
- **Owns:** Build goal config, `MissionCard`, `BuildGoalBadge`, mission helpers
- **Delegates:** `lib/actions/onboarding.ts` for `completeOnboarding`

### AI Engine
- **Owns:** `BelongAIService`, `AIInsightPanel`, insight types
- **Note:** Rule-based v1; swap `AIService` implementation for LLM without UI changes

### Auth Engine
- **Owns:** Facade re-exports only — session, actions, auth components
- **Delegates:** `lib/auth/session`, `lib/actions/auth`, `components/auth/*`

---

## Migration State (Intentional)

| Route | UI location | Data location | Status |
|-------|-------------|---------------|--------|
| `/` | `engines/dashboard` | `engines/dashboard/data` | ✅ Engine |
| `/community` | `engines/community` | `lib/data/communities` | ⚠️ Hybrid |
| `/projects` | `components/features/projects` | `lib/data/projects` | Legacy |
| `/events` | `components/features/events` | `lib/data/events` | Legacy |
| `/messages` | `components/features/messages` | `lib/data/messages` | Legacy |
| `/notifications` | `components/features/notifications` | `lib/data/notifications` | Legacy |
| `/profile` | `components/features/profile` | `lib/data/profile` | Legacy |
| `/settings` | `components/features/settings` | `lib/auth/session` | Legacy |
| `/onboarding` | `components/onboarding` | `lib/actions/onboarding` | Legacy |
| Auth routes | `components/auth` | `lib/actions/auth` | Legacy |

**Rule:** New features use engines + design-system. Legacy views migrate in ROADMAP Phase 2.

---

## Deprecated Aliases (Do not extend)

These exist for backward compatibility. **New code must not import them.**

| Deprecated | Use instead |
|------------|-------------|
| `@/config/navigation` | `@/systems/navigation` |
| `@/config/onboarding` | `@/engines/mission/config` |
| `@/components/platform/stat-card` | `@/systems/design-system` |
| `@/lib/data/dashboard` | `@/engines/dashboard` |

---

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (prod) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (prod) | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Yes | OAuth redirects, email links |

Middleware skips auth when Supabase env is missing (local build only).

---

## Tech Stack (Locked)

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript (strict)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS v4 + CSS variables in `app/globals.css`
- **Motion:** Framer Motion
- **Icons:** Lucide React

---

## Team Ownership (Suggested squads)

| Squad | Owns |
|-------|------|
| **Platform** | `systems/*`, `components/layout`, middleware, auth |
| **Core product** | `engines/dashboard`, `engines/mission`, onboarding |
| **Community** | `engines/community`, connections, events |
| **Collaboration** | projects, messages, notifications engines (future) |
| **Data** | `lib/core`, migrations, types, RLS |
| **AI** | `engines/ai`, future ML/LLM integration |

---

## Related Docs

- [ROADMAP.md](./ROADMAP.md) — delivery phases
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — schema reference
- [API_SPEC.md](./API_SPEC.md) — server actions & handlers
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — UI standards
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — component inventory
