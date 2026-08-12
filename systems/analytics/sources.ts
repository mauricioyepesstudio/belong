/** Event source identifiers — where in the product the action originated. */
export const AnalyticsSource = {
  AUTH_REGISTER_FORM: "auth.register_form",
  AUTH_LOGIN_FORM: "auth.login_form",
  AUTH_OAUTH: "auth.oauth",
  AUTH_CALLBACK: "auth.callback",
  ONBOARDING: "onboarding.complete",
  PROFILE_SETTINGS: "profile.settings",
  PROFILE_COMPATIBILITY: "profile.compatibility",
  COMMUNITY_CREATE: "community.create",
  COMMUNITY_JOIN: "community.join",
  PROJECT_CREATE: "project.create",
  PROJECT_DETAIL: "project.detail",
  COMMUNITY_POST: "community.post",
  PROJECT_POST: "project.post",
  COMMUNITY_FEED: "community.feed",
  MESSAGES_SEND: "messages.send",
  CONNECTIONS_START: "connections.start_conversation",
  IMPACT_ENGINE: "impact.engine",
  SEARCH_GLOBAL: "search.global",
  RECOMMENDATION_HOME: "recommendation.home",
  RECOMMENDATION_OPPORTUNITIES: "recommendation.opportunities",
  NOTIFICATIONS_LIST: "notifications.list",
} as const;

export type AnalyticsSourceName = (typeof AnalyticsSource)[keyof typeof AnalyticsSource];
