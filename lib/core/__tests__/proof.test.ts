import { describe, expect, it } from "vitest";
import { deriveProofClaimStage, validateProofClaimInput, type ProofClaimDraftInput } from "../proof";

describe("deriveProofClaimStage", () => {
  it("maps each proof_claim_status to its loop stage", () => {
    expect(deriveProofClaimStage({ status: "draft" })).toBe("not_yet_open");
    expect(deriveProofClaimStage({ status: "active" })).toBe("seeking_evidence");
    expect(deriveProofClaimStage({ status: "resolved" })).toBe("resolved");
    expect(deriveProofClaimStage({ status: "archived" })).toBe("closed");
  });
});

describe("validateProofClaimInput", () => {
  function baseInput(overrides: Partial<ProofClaimDraftInput> = {}): ProofClaimDraftInput {
    return {
      title: "20 founders will create 100 jobs in Miami in 30 days",
      claimType: "goal",
      standard: { successCriteria: ["100 verified full-time hires"] },
      ...overrides,
    };
  }

  it("accepts a claim with a title and at least one success criterion", () => {
    expect(validateProofClaimInput(baseInput())).toBeNull();
  });

  it("rejects a blank title", () => {
    expect(validateProofClaimInput(baseInput({ title: "   " }))).toEqual({
      error: "Title is required",
    });
  });

  it("rejects a claim with no declared success criteria", () => {
    const input = baseInput({ standard: { successCriteria: [] } });
    expect(validateProofClaimInput(input)).toEqual({
      error: "At least one success criterion is required",
    });
  });

  it("rejects success criteria that are only whitespace", () => {
    const input = baseInput({ standard: { successCriteria: ["   ", ""] } });
    expect(validateProofClaimInput(input)).toEqual({
      error: "At least one success criterion is required",
    });
  });

  it("rejects an unparsable deadline", () => {
    const input = baseInput({
      standard: { successCriteria: ["ship it"], deadline: "not-a-date" },
    });
    expect(validateProofClaimInput(input)).toEqual({ error: "Invalid deadline" });
  });

  it("rejects a deadline in the past", () => {
    const input = baseInput({
      standard: { successCriteria: ["ship it"], deadline: "2020-01-01" },
    });
    expect(validateProofClaimInput(input)).toEqual({ error: "Deadline cannot be in the past" });
  });

  it("accepts a future deadline", () => {
    const input = baseInput({
      standard: { successCriteria: ["ship it"], deadline: "2999-01-01" },
    });
    expect(validateProofClaimInput(input)).toBeNull();
  });
});
