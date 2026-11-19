import { describe, expect, it } from "vitest";
import { focusQuote, nextThreshold, permanentStage, STAGES, XP } from "./config";
import { eventIdSchema } from "./validation";

describe("server-owned XP policy", () => {
  it("preserves the required stage thresholds", () => {
    expect(STAGES.map(s => s.from)).toEqual([0, 400, 900, 1600, 3000]);
    expect(permanentStage("CHILD", 400)).toBe("PRETEEN");
    expect(permanentStage("CHILD", 900)).toBe("TEEN");
    expect(permanentStage("TEEN", 0)).toBe("TEEN");
    expect(permanentStage("ADULT", 0)).toBe("ADULT");
    expect(nextThreshold("ADULT")).toBeNull();
  });
  it("matches mock focus reward rules", () => {
    expect(focusQuote(59)).toBe(0);
    expect(focusQuote(60)).toBe(1);
    expect(focusQuote(300)).toBe(1);
    expect(focusQuote(301)).toBe(2);
    expect(XP.habitMoments[14]).toBe(30);
  });
  it("rejects unknown fields and invalid IDs", () => {
    expect(eventIdSchema.safeParse({eventId:"abc",userId:"victim"}).success).toBe(false);
    expect(eventIdSchema.safeParse({eventId:"!"}).success).toBe(false);
    expect(eventIdSchema.safeParse({eventId:"abc"}).success).toBe(true);
  });
});
