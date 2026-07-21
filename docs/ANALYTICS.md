# Product Analytics

Centralized, vendor-neutral product analytics for BELONG. All events flow through `systems/analytics` before reaching a provider (console in development, noop in production until configured).

## Quick start

```typescript
import { configureAnalytics, trackServerEvent, trackClientEvent, useAnalytics } from "@/systems/analytics";
import { posthogProvider } from "./your-posthog-adapter"; // future

configureAnalytics(posthogProvider);
```

## Event envelope

Every event includes:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Typed event name (see catalog below) |
| `userId` | yes | Authenticated user id; use `anonymous` pre-signup |
| `timestamp` | yes | ISO-8601 UTC (set automatically) |
| `screen` | yes | Logical screen id (`AnalyticsScreen` or `pathnameToScreen`) |
| `source` | yes | Where the action originated (`AnalyticsSource`) |
| `entityId` | no | Primary entity uuid (community, project, post, etc.) |
| `properties` | no | Extra key/value metadata for vendors |

## Event catalog

### Authentication

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `signup_started` | Register form submitted | — | `auth.register_form` |
| `signup_completed` | Account created (email or OAuth) | user id | `auth.register_form` / `auth.oauth` |
| `login` | Successful sign-in | user id | `auth.login_form` / `auth.oauth` |

### Profile

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `profile_completed` | Onboarding finished | user id | `onboarding.complete` |
| `profile_updated` | Profile or compatibility saved | user id | `profile.settings` / `profile.compatibility` |

### Communities

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `community_created` | Community created | community id | `community.create` |
| `community_joined` | User joins a free community | community id | `community.join` |

### Projects

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `project_created` | Project created | project id | `project.create` |
| `project_opened` | Project detail viewed | project id | `project.detail` |

### Posts

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `post_created` | Community or project post published | post id | `community.post` / `project.post` |
| `post_viewed` | Post scrolled into view (deep link) | post id | `community.feed` |

### Messages

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `conversation_started` | New DM conversation created | conversation id | `connections.start_conversation` |
| `message_sent` | Message sent | message id | `messages.send` |

### Impact

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `impact_event_created` | Impact score event recorded | impact event id | `impact.engine` |

### Search

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `search_used` | Global search executed (≥2 chars) | — | `search.global` |

### Recommendations

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `recommendation_opened` | Details drawer opened | recommendation target id | `recommendation.home` |
| `recommendation_accepted` | View / navigate to recommendation | recommendation target id | `recommendation.home` |

### Notifications

| Event | When fired | entityId | source |
|-------|------------|----------|--------|
| `notification_opened` | Notification clicked | notification id | `notifications.list` |

## Swapping providers

Implement `AnalyticsProvider`:

```typescript
import type { AnalyticsProvider } from "@/systems/analytics";

export const segmentProvider: AnalyticsProvider = {
  track(event) {
    analytics.track(event.name, {
      userId: event.userId,
      timestamp: event.timestamp,
      screen: event.screen,
      source: event.source,
      entityId: event.entityId,
      ...event.properties,
    });
  },
};
```

Call `configureAnalytics(segmentProvider)` once at app startup (e.g. `instrumentation.ts` or a client provider wrapper).

## Files

- `types.ts` — event names and payload types
- `screens.ts` / `sources.ts` — stable identifiers
- `service.ts` — `trackEvent`, `configureAnalytics`
- `track-server.ts` — server action imports
- `track-client.ts` / `use-analytics.ts` — client components
- `providers/console.ts` — dev logging
- `providers/noop.ts` — production default
