import { describe, expect, it } from "vitest";
import { canCancel, canConfirm, canDecline, canPropose } from "../guards";

describe("collaboration passport guards", () => {
  it("lets a partner confirm their own pending record", () => {
    const record = { status: "pending" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canConfirm(record, "user-b")).toBe(true);
  });

  it("never lets the proposer confirm their own record", () => {
    const record = { status: "pending" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canConfirm(record, "user-a")).toBe(false);
  });

  it("never lets an unrelated user confirm a pending record", () => {
    const record = { status: "pending" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canConfirm(record, "user-c")).toBe(false);
  });

  it("lets a partner decline their own pending record", () => {
    const record = { status: "pending" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canDecline(record, "user-b")).toBe(true);
    expect(canDecline(record, "user-a")).toBe(false);
  });

  it("lets a proposer cancel their own pending proposal", () => {
    const record = { status: "pending" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canCancel(record, "user-a")).toBe(true);
    expect(canCancel(record, "user-b")).toBe(false);
  });

  it("forbids any action once a record is already resolved", () => {
    const confirmed = { status: "confirmed" as const, proposerId: "user-a", partnerId: "user-b" };
    const declined = { status: "declined" as const, proposerId: "user-a", partnerId: "user-b" };
    expect(canConfirm(confirmed, "user-b")).toBe(false);
    expect(canDecline(confirmed, "user-b")).toBe(false);
    expect(canCancel(confirmed, "user-a")).toBe(false);
    expect(canConfirm(declined, "user-b")).toBe(false);
    expect(canDecline(declined, "user-b")).toBe(false);
    expect(canCancel(declined, "user-a")).toBe(false);
  });

  it("never allows proposing a collaboration with yourself", () => {
    expect(canPropose("user-a", "user-a")).toBe(false);
    expect(canPropose("user-a", "user-b")).toBe(true);
    expect(canPropose("", "user-b")).toBe(false);
  });
});
