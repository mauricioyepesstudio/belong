import { describe, expect, it } from "vitest";
import { computeBelongScore } from "@/engines/impact/belong-score";

describe("computeBelongScore", () => {
  it("returns a zero score for no activity at all", () => {
    const result = computeBelongScore({
      givenReactions: 0,
      givenComments: 0,
      receivedReactions: 0,
      receivedComments: 0,
    });

    expect(result).toEqual({ score: 0, given: 0, received: 0, volume: 0 });
  });

  it("scores 100 when the user only gives and never receives", () => {
    const result = computeBelongScore({
      givenReactions: 5,
      givenComments: 2,
      receivedReactions: 0,
      receivedComments: 0,
    });

    expect(result.given).toBe(9); // 5 reactions + 2 comments * 2
    expect(result.received).toBe(0);
    expect(result.volume).toBe(9);
    expect(result.score).toBe(100);
  });

  it("scores 0 when the user only receives and never gives", () => {
    const result = computeBelongScore({
      givenReactions: 0,
      givenComments: 0,
      receivedReactions: 5,
      receivedComments: 2,
    });

    expect(result.given).toBe(0);
    expect(result.received).toBe(9); // 5 reactions + 2 comments * 2
    expect(result.volume).toBe(9);
    expect(result.score).toBe(0);
  });

  it("scores 50 for perfectly balanced give/receive activity", () => {
    const result = computeBelongScore({
      givenReactions: 3,
      givenComments: 1,
      receivedReactions: 3,
      receivedComments: 1,
    });

    expect(result.given).toBe(5); // 3 + 1 * 2
    expect(result.received).toBe(5);
    expect(result.volume).toBe(10);
    expect(result.score).toBe(50);
  });

  it("weighs comments twice as heavily as reactions on the given side", () => {
    const fromComments = computeBelongScore({
      givenReactions: 0,
      givenComments: 2,
      receivedReactions: 0,
      receivedComments: 0,
    });
    const fromReactions = computeBelongScore({
      givenReactions: 4,
      givenComments: 0,
      receivedReactions: 0,
      receivedComments: 0,
    });

    // 2 comments (weight 2) == 4 reactions (weight 1) in given weight.
    expect(fromComments.given).toBe(fromReactions.given);
    expect(fromComments.score).toBe(fromReactions.score);
  });

  it("weighs comments twice as heavily as reactions on the received side", () => {
    const result = computeBelongScore({
      givenReactions: 0,
      givenComments: 0,
      receivedReactions: 2,
      receivedComments: 1,
    });

    // 1 received comment (weight 2) + 2 received reactions (weight 2) = 4.
    expect(result.received).toBe(4);
    expect(result.score).toBe(0);
  });
});
