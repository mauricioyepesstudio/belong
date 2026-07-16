# BELONG — API Specification

**Status:** Frozen · July 2026  
**Transport:** Next.js Server Actions + Route Handlers (no REST `/api` layer)

BELONG v1 uses **Server Actions** for mutations and **Server Components** for reads. There is no separate REST API. This document is the contract for all server-side interfaces.

---

## Authentication

All server actions (except auth signup/login) require an authenticated Supabase session. Unauthenticated calls return `{ error: "Not authenticated" }` or redirect via middleware.

Session helpers (`lib/auth/session.ts`):

| Function | Returns | Notes |
|----------|---------|-------|
| `getSession()` | Auth user or null | |
| `getCurrentProfile()` | `UserProfile \| null` | Full `users` row |
| `requireProfile()` | `UserProfile` | Throws if missing |

---

## Route Handlers

### `GET /auth/callback`

**File:** `app/auth/callback/route.ts`

OAuth and email confirmation callback.

| Query param | Purpose |
|-------------|---------|
| `code` | Supabase auth code (required) |
| `next` | Post-auth redirect path (optional, default `/`) |

**Behavior:**
1. Exchange code for session via `supabase.auth.exchangeCodeForSession`
2. Redirect to `next` or `/` on success
3. Redirect to `/login?error=auth` on failure

---

## Server Actions — Auth

**Module:** `lib/actions/auth.ts`  
**Facade:** `@/engines/auth`

### `signInWithEmail(email, password)`

```typescript
Promise<{ error?: string }>
```

- Signs in with Supabase password auth
- On success: `revalidatePath("/", "layout")` → redirect `/`

### `signUpWithEmail(email, password, fullName)`

```typescript
Promise<{ error?: string }>
```

- Creates auth user with `full_name` metadata
- On success: redirect `/onboarding`

### `signInWithOAuth(provider)`

```typescript
provider: "google" | "apple"
Promise<{ error?: string } | void>
```

- Starts OAuth flow; redirects to provider URL

### `signOut()`

```typescript
Promise<void>  // redirects to /login
```

### `resetPassword(email)`

```typescript
Promise<{ error?: string } | {}>
```

- Sends reset email; redirect target `/auth/callback?next=/settings`

---

## Server Actions — Onboarding

**Module:** `lib/actions/onboarding.ts`

### `completeOnboarding(data)`

```typescript
{
  buildGoal: BuildGoal;      // enum: startup | career | learn | ...
  buildVision?: string;
  fullName?: string;
}
Promise<{ error?: string }>   // redirects to / on success
```

**Side effects:**
1. Updates `users`: `build_goal`, `build_vision`, `onboarding_completed`, `role`
2. Inserts primary `missions` row
3. `revalidatePath("/", "layout")` → redirect `/`

---

## Server Actions — Platform

**Module:** `lib/actions/platform.ts`

### `markAllNotificationsRead()`

```typescript
Promise<void>
```

- Sets `read_at` on all unread notifications for current user
- Revalidates `/notifications`

### `updateProfile(data)`

```typescript
{
  full_name?: string;
  role?: string;
  location?: string;
  bio?: string;
}
Promise<{ error?: string } | {}>
```

- Updates `users` row for current user
- Revalidates `/profile`, layout

### `sendMessage(conversationId, body)`

```typescript
Promise<{ error?: string } | {}>
```

- Inserts `messages` row; `sender_id` = current user
- Revalidates `/messages`

---

## Data Loaders (Read API)

Server-only functions called from `page.tsx`. Not callable from client.

### Dashboard

**`getDashboardData()`** — `@/engines/dashboard/data`

Returns `DashboardData`: profile, stats, primaryMission, recentActivity, activeProjects, upcomingEvents, recentConversations, communities, insights.

### Communities

| Function | Module | Returns |
|----------|--------|---------|
| `getUserCommunities()` | `lib/data/communities` | `UserCommunity[]` |
| `getDiscoverCommunities()` | `lib/data/communities` | `Community[]` |

### Projects

| Function | Module | Returns |
|----------|--------|---------|
| `getUserProjects()` | `lib/data/projects` | `ProjectWithMemberCount[]` |

### Events

| Function | Module | Returns |
|----------|--------|---------|
| `getUpcomingEvents()` | `lib/data/events` | `EventWithMeta[]` |

### Messages

| Function | Module | Returns |
|----------|--------|---------|
| `getConversations()` | `lib/data/messages` | `ConversationPreview[]` |
| `getConversationMessages(id)` | `lib/data/messages` | `Message[]` |

### Notifications

| Function | Module | Returns |
|----------|--------|---------|
| `getNotifications()` | `lib/data/notifications` | `Notification[]` |
| `getUnreadNotificationCount()` | `lib/data/notifications` | `number` |

### Profile

| Function | Module | Returns |
|----------|--------|---------|
| `getProfileData()` | `lib/data/profile` | `{ profile, stats, missions }` |

---

## lib/core Primitives

Lower-level helpers accepting `SupabaseServerClient` + `userId`. Used by data loaders and dashboard engine.

| Module | Exports |
|--------|---------|
| `conversations.ts` | `fetchConversationPreviews()` |
| `projects.ts` | `attachProjectMemberCounts()`, `getActiveProjectsForUser()` |
| `events.ts` | `attachEventMeta()`, `getUpcomingEventsWithMeta()` |
| `communities.ts` | `joinMembershipsWithCommunities()` |
| `stats.ts` | `fetchUserStats()` |

---

## AI Engine (Client-safe)

**Module:** `engines/ai/service.ts`

### `aiService.generateInsights(context)`

```typescript
AIContext → AIInsight[]  // max 4 insights
```

Rule-based v1. No external API. Called server-side during `getDashboardData()`.

---

## Error Contract

| Pattern | Meaning |
|---------|---------|
| `{ error: string }` | User-visible failure; stay on page |
| `redirect()` | Success path or auth flow |
| `throw new Error("Unauthorized")` | `requireProfile()` failure |

---

## Future API Layer (ROADMAP Phase 4)

Planned when mobile/external clients arrive:

- `POST /api/v1/...` REST or tRPC
- Webhook handlers for Supabase events
- Rate limiting + API keys
- OpenAPI spec generated from shared Zod schemas

**Do not add ad-hoc `/api` routes until Phase 4 architecture review.**

---

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
