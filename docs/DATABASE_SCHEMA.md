# BELONG — Database Schema

**Status:** Frozen · July 2026  
**Source of truth:** `supabase/migrations/` + `types/database.types.ts`

Apply migrations: `npm run db:push`  
Regenerate types (local): `npm run db:types` → `types/database.generated.ts`

---

## Entity Relationship Overview

```
auth.users
    └── users (1:1 profile)
            ├── missions (1:N)
            ├── connections (N:N via requester/recipient)
            ├── community_members → communities
            ├── projects (owner) + project_members
            ├── events (creator) + event_registrations
            ├── conversation_participants → conversations → messages
            └── notifications

communities
    ├── community_members
    ├── projects (optional FK)
    └── events (optional FK)
```

---

## Enums

| Enum | Values |
|------|--------|
| `connection_status` | `pending`, `accepted`, `declined` |
| `community_member_role` | `member`, `admin`, `owner` |
| `project_status` | `planning`, `active`, `completed`, `archived` |
| `notification_type` | `connection`, `project`, `event`, `community`, `message`, `system` |
| `build_goal` | `startup`, `career`, `learn`, `health`, `relationships`, `community`, `travel`, `creator` |

---

## Tables

### `users`

Extended profile linked to Supabase Auth.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | text NOT NULL | |
| `full_name` | text | |
| `avatar_url` | text | |
| `role` | text | Display role / build label |
| `location` | text | |
| `bio` | text | |
| `onboarding_completed` | boolean DEFAULT false | Gates platform access |
| `build_goal` | build_goal | Set during onboarding |
| `build_vision` | text | Optional vision statement |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Triggers:** `on_auth_user_created` inserts row from OAuth metadata  
**RLS:** SELECT all; UPDATE/INSERT own row only

---

### `missions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `title` | text NOT NULL | |
| `description` | text | |
| `is_primary` | boolean DEFAULT false | One primary per user (app-enforced) |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** SELECT all; ALL operations on own missions

---

### `connections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `requester_id` | uuid FK → users | |
| `recipient_id` | uuid FK → users | |
| `status` | connection_status DEFAULT pending | |
| `created_at`, `updated_at` | timestamptz | |

**Constraints:** No self-connection; unique (requester, recipient) pair  
**RLS:** SELECT if party; INSERT as requester; UPDATE/DELETE if party  
**App status:** Read/count only — no create/accept UI yet

---

### `communities`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `slug` | text UNIQUE | |
| `description` | text | |
| `tag` | text | Category label |
| `owner_id` | uuid FK → users | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** SELECT all; INSERT as owner; UPDATE/DELETE as owner

---

### `community_members`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `community_id` | uuid FK → communities | |
| `user_id` | uuid FK → users | |
| `role` | community_member_role DEFAULT member | |
| `joined_at` | timestamptz | |

**Unique:** (community_id, user_id)  
**RLS:** SELECT all; INSERT self; DELETE self or admin/owner

---

### `projects`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text NOT NULL | |
| `description` | text | |
| `status` | project_status DEFAULT planning | |
| `progress` | int 0–100 DEFAULT 0 | |
| `deadline` | date | |
| `owner_id` | uuid FK → users | |
| `community_id` | uuid FK → communities NULL | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** SELECT all; INSERT as owner; UPDATE owner or member; DELETE owner

---

### `project_members`

| Column | Type | Notes |
|--------|------|-------|
| `project_id` | uuid FK | Composite PK |
| `user_id` | uuid FK | Composite PK |
| `role` | text DEFAULT member | |
| `joined_at` | timestamptz | |

**RLS:** SELECT all; INSERT owner or self; DELETE self

---

### `events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `description` | text | |
| `location` | text | |
| `starts_at` | timestamptz NOT NULL | |
| `ends_at` | timestamptz | |
| `community_id` | uuid FK NULL | |
| `created_by` | uuid FK → users | |
| `created_at`, `updated_at` | timestamptz | |

**RLS:** SELECT all; INSERT as creator; UPDATE/DELETE as creator

---

### `event_registrations`

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | uuid FK | Composite PK |
| `user_id` | uuid FK | Composite PK |
| `registered_at` | timestamptz | |

**RLS:** SELECT all; INSERT self; DELETE self

---

### `conversations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `created_at` | timestamptz | |

**RLS:** SELECT if participant; INSERT if authenticated

---

### `conversation_participants`

| Column | Type | Notes |
|--------|------|-------|
| `conversation_id` | uuid FK | Composite PK |
| `user_id` | uuid FK | Composite PK |
| `joined_at` | timestamptz | |

**RLS:** SELECT if self or co-participant; INSERT as self

---

### `messages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `conversation_id` | uuid FK | |
| `sender_id` | uuid FK → users | |
| `body` | text NOT NULL | |
| `read_at` | timestamptz NULL | Unread if null + not sender |
| `created_at` | timestamptz | |

**RLS:** SELECT/INSERT/UPDATE if conversation participant; sender must match auth.uid()

---

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `title` | text NOT NULL | |
| `body` | text | |
| `type` | notification_type DEFAULT system | |
| `read_at` | timestamptz NULL | |
| `metadata` | jsonb DEFAULT {} | Future deep links |
| `created_at` | timestamptz | |

**RLS:** SELECT/UPDATE/DELETE own; INSERT own

---

## Database Functions

| Function | Purpose |
|----------|---------|
| `handle_updated_at()` | Trigger: set `updated_at = now()` |
| `handle_new_user()` | Trigger: create `public.users` from auth signup |
| `create_notification(...)` | Security definer helper for system notifications |

**Note:** `create_notification()` is not yet called from application code.

---

## Migration Order

1. `20250715000001_users.sql`
2. `20250715000002_missions.sql`
3. `20250715000003_connections.sql`
4. `20250715000004_communities.sql`
5. `20250715000005_projects.sql`
6. `20250715000006_events.sql`
7. `20250715000007_messages.sql`
8. `20250715000008_notifications.sql`
9. `20250715000009_build_goal.sql`

---

## Schema ↔ App Gaps (Tracked in ROADMAP)

| Gap | Priority |
|-----|----------|
| Connections CRUD UI + actions | P1 |
| Notification creation on events | P1 |
| Project/event/community create mutations | P1 |
| `database.generated.ts` in CI | P2 |
| Realtime subscriptions (messages) | P2 |
