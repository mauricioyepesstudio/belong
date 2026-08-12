export type ConnectionState =
  | "none"
  | "pending-sent"
  | "pending-received"
  | "connected";

export type ConnectionStateRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
};

export type UserConnectionState = {
  id: string | null;
  state: ConnectionState;
};

export function canMessageConnection(state: ConnectionState): boolean {
  return state === "connected";
}

export function resolveConnectionState(
  viewerId: string,
  rows: ConnectionStateRow[]
): UserConnectionState {
  const accepted = rows.find((row) => row.status === "accepted");
  if (accepted) return { id: accepted.id, state: "connected" };

  const pending = rows.find((row) => row.status === "pending");
  if (!pending) return { id: null, state: "none" };

  return {
    id: pending.id,
    state:
      pending.requester_id === viewerId ? "pending-sent" : "pending-received",
  };
}
