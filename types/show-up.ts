export type ShowUpKind =
  | "HELP"
  | "JOIN"
  | "VOLUNTEER"
  | "COLLABORATE"
  | "CONTRIBUTE"
  | "OFFER_SKILL"
  | "OFFER_RESOURCE"
  | "GIVE_FEEDBACK"
  | "ATTEND"
  | "COORDINATE";

export type ShowUpState = "AVAILABLE" | "PENDING" | "ACTIVE" | "COMPLETED" | "UNAVAILABLE";

export interface ShowUpAction {
  kind: ShowUpKind;
  label: string;
  state: ShowUpState;
  intent: string;
  destination?: string;
  subjectType: string;
  subjectId: string;
  disabledReason?: string;
  actorId?: string;
  domain?: string;
  completedAt?: string;
}
