import type { AnalyticsProvider } from "../provider";

/** Production placeholder until a vendor provider is configured. */
export const noopAnalyticsProvider: AnalyticsProvider = {
  track() {},
};
