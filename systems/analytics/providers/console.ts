import type { AnalyticsProvider } from "../provider";
import type { AnalyticsEvent } from "../types";

/** Development default — logs structured events to the console. */
export const consoleAnalyticsProvider: AnalyticsProvider = {
  track(event: AnalyticsEvent) {
    if (typeof console !== "undefined" && console.info) {
      console.info("[analytics]", event);
    }
  },
};
