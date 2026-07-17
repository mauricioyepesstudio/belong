import { describe, expect, it } from "vitest";
import { realtimeChannels } from "../channels";
import { countPresenceUsers, listPresenceUsers } from "../presence";
import { dedupeById } from "../helpers";

describe("realtime channels", () => {
  it("builds scoped channel names", () => {
    expect(realtimeChannels.community("abc")).toBe("community:abc");
    expect(realtimeChannels.project("abc")).toBe("project:abc");
    expect(realtimeChannels.dashboard("user-1")).toBe("dashboard:user-1");
    expect(realtimeChannels.discussion("disc-1")).toBe("discussion:disc-1");
  });
});

describe("presence helpers", () => {
  it("counts unique online users", () => {
    const state = {
      a: [{ user_id: "1", full_name: "Ada" }],
      b: [{ user_id: "2", full_name: "Bob" }],
    };
    expect(countPresenceUsers(state)).toBe(2);
    expect(listPresenceUsers(state)).toHaveLength(2);
  });
});

describe("dedupeById", () => {
  it("prepends new items without duplicates", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const next = dedupeById(items, { id: "3" });
    expect(next).toHaveLength(3);
    expect(dedupeById(next, { id: "2" })).toHaveLength(3);
  });
});
