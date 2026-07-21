/** Product analytics event names — keep in sync with docs/ANALYTICS.md */
export const ANALYTICS_EVENT_NAMES = [
  "signup_started",
  "signup_completed",
  "login",
  "profile_completed",
  "profile_updated",
  "community_joined",
  "community_created",
  "project_created",
  "project_opened",
  "post_created",
  "post_viewed",
  "conversation_started",
  "message_sent",
  "impact_event_created",
  "search_used",
  "recommendation_opened",
  "recommendation_accepted",
  "notification_opened",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsProperties = Record<string, string | number | boolean | null>;

/** Canonical payload sent to every analytics provider. */
export type AnalyticsEvent = {
  name: AnalyticsEventName;
  userId: string;
  timestamp: string;
  screen: string;
  source: string;
  entityId?: string;
  properties?: AnalyticsProperties;
};

export type TrackEventInput = {
  name: AnalyticsEventName;
  userId: string;
  screen: string;
  source: string;
  entityId?: string;
  properties?: AnalyticsProperties;
};

/** Reserved user id for pre-authentication client events (e.g. signup_started). */
export const ANALYTICS_ANONYMOUS_USER_ID = "anonymous";
