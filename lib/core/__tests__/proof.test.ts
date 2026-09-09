import { describe, expect, it } from "vitest";
import { deriveProofClaimStage } from "../proof";

describe("deriveProofClaimStage", () => {
  it("maps each proof_claim_status to its loop stage", () => {
    expect(deriveProofClaimStage({ status: "draft" })).toBe("not_yet_open");
    expect(deriveProofClaimStage({ status: "active" })).toBe("seeking_evidence");
    expect(deriveProofClaimStage({ status: "resolved" })).toBe("resolved");
    expect(deriveProofClaimStage({ status: "archived" })).toBe("closed");
  });
});
