"use client";

import { trackEvent } from "./service";

export { configureAnalytics, getAnalyticsProvider } from "./service";
export type { TrackEventInput, AnalyticsEvent, AnalyticsEventName } from "./types";
export { AnalyticsScreen, pathnameToScreen } from "./screens";
export { AnalyticsSource } from "./sources";
export { ANALYTICS_ANONYMOUS_USER_ID } from "./types";

/** Client-side tracking — same pipeline as server events. */
export async function trackClientEvent(
  input: Parameters<typeof trackEvent>[0]
): Promise<void> {
  await trackEvent(input);
}
