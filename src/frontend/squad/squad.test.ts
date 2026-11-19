import { describe, expect, it } from "vitest";
import { getSharedGoal, joinSharedGoal, leaveSharedGoal, submitSquadReport } from "../mocks/repository";
import { parseInviteCode } from "./api";

describe("parseInviteCode", () => {
  it("accepts a bare code", () => {
    expect(parseInviteCode("  abcdefghijklmnopqrstuvwxyz  ")).toBe("abcdefghijklmnopqrstuvwxyz");
  });
  it("reads the code from an invite link", () => {
    expect(parseInviteCode("https://momentum.app/squad?view=join&code=abc123def456ghi789jkl")).toBe("abc123def456ghi789jkl");
  });
  it("reads the last path part of a short link", () => {
    expect(parseInviteCode("https://momentum.app/j/abc123def456ghi789jkl")).toBe("abc123def456ghi789jkl");
  });
  it("returns nothing for empty input", () => {
    expect(parseInviteCode("   ")).toBe("");
  });
});

describe("shared goal preview", () => {
  it("adds you and your count when you join, and resets when you leave", async () => {
    const before = await getSharedGoal();
    expect(before.joined).toBe(false);
    const joined = await joinSharedGoal({ linkTask: true, showCount: true, showNames: false });
    expect(joined.joined).toBe(true);
    expect(joined.joinedCount).toBe(before.joinedCount + 1);
    expect(joined.doneCount).toBe(14);
    expect(joined.contributors.map((person) => person.name)).toEqual(["Zara", "You", "Malik"]);
    const again = await joinSharedGoal({ linkTask: true, showCount: true, showNames: false });
    expect(again.joinedCount).toBe(joined.joinedCount);
    const left = await leaveSharedGoal();
    expect(left.joined).toBe(false);
    expect(left.doneCount).toBe(before.doneCount);
  });
  it("shares no count when you hide it", async () => {
    const joined = await joinSharedGoal({ linkTask: true, showCount: false, showNames: false });
    expect(joined.doneCount).toBe(9);
    await leaveSharedGoal();
  });
});

describe("squad report preview", () => {
  it("needs a known reason", async () => {
    await expect(submitSquadReport({ reason: "Bad vibes", details: "" })).rejects.toThrow();
  });
  it("accepts a reason with optional details", async () => {
    const result = await submitSquadReport({ reason: "Spam", details: "Links every hour" });
    expect(result.id).toBeDefined();
  });
});
