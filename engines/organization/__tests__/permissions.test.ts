import { describe, expect, it } from "vitest";
import {
  canAdminOrganization,
  canManageOrganization,
  canWriteOrganization,
} from "@/lib/core/organizations";

describe("organization permissions", () => {
  it("allows managers to manage", () => {
    expect(canManageOrganization("manager")).toBe(true);
    expect(canManageOrganization("member")).toBe(false);
    expect(canWriteOrganization("guest")).toBe(false);
    expect(canWriteOrganization("member")).toBe(true);
    expect(canAdminOrganization("admin")).toBe(true);
    expect(canAdminOrganization("manager")).toBe(false);
  });
});
