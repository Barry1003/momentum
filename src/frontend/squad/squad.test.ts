import { describe, expect, it } from "vitest";
import { CHEERS_PER_DAY, getMemberShare, getSharedGoal, joinSharedGoal, leaveSharedGoal, sendCheer, submitSquadReport } from "../mocks/repository";
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

describe("member cheers preview", () => {
  it("only sends known cheers", async () => {
    await expect(sendCheer("u-1", "You owe me")).rejects.toThrow();
  });
  it("limits cheers per person per day", async () => {
    for (let i = 0; i < CHEERS_PER_DAY; i++) {
      const result = await sendCheer("u-2", "High five");
      expect(result.remaining).toBe(CHEERS_PER_DAY - i - 1);
    }
    await expect(sendCheer("u-2", "Keep going")).rejects.toThrow();
    const other = await sendCheer("u-3", "Proud of you");
    expect(other.remaining).toBe(CHEERS_PER_DAY - 1);
  });
  it("shares nothing for members without example data", async () => {
    const share = await getMemberShare("Someone new");
    expect(share.shares.length).toBe(0);
    expect(share.status).toBeNull();
  });
});
