import { describe, expect, it } from "vitest";
import { creditedSeconds, weekStart } from "./rules";
import { finishFocusSchema, startFocusSchema } from "./validation";

const start = new Date("2026-11-19T10:00:00.000Z");
const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);

describe("focus credit", () => {
  it("credits what the client reports when it fits real time", () => {
    expect(creditedSeconds({ claimed: 1500, plannedMinutes: 25, startedAt: start, now: at(1500) })).toBe(1500);
  });
  it("never credits more time than really passed", () => {
    expect(creditedSeconds({ claimed: 1500, plannedMinutes: 25, startedAt: start, now: at(60) })).toBe(65);
  });
  it("never credits more than the planned length", () => {
    expect(creditedSeconds({ claimed: 9999, plannedMinutes: 25, startedAt: start, now: at(9999) })).toBe(1500);
  });
  it("credits nothing for a negative or clock-skewed claim", () => {
    expect(creditedSeconds({ claimed: -5, plannedMinutes: 25, startedAt: start, now: at(100) })).toBe(0);
    expect(creditedSeconds({ claimed: 100, plannedMinutes: 25, startedAt: at(500), now: start })).toBe(0);
  });
});

describe("week start", () => {
  it("returns Monday", () => {
    expect(weekStart("2026-11-19")).toBe("2026-11-16");
    expect(weekStart("2026-11-16")).toBe("2026-11-16");
    expect(weekStart("2026-11-22")).toBe("2026-11-16");
  });
});

describe("focus validation", () => {
  it("rejects extra fields and bad keys", () => {
    expect(startFocusSchema.safeParse({ sessionKey: "focus-abc123", plannedMinutes: 25, mode: "solo" }).success).toBe(true);
    expect(startFocusSchema.safeParse({ sessionKey: "focus-abc123", plannedMinutes: 25, mode: "solo", xp: 50 }).success).toBe(false);
    expect(startFocusSchema.safeParse({ sessionKey: "../x", plannedMinutes: 25, mode: "solo" }).success).toBe(false);
    expect(finishFocusSchema.safeParse({ focusedSeconds: 60, plannedMinutes: 500, mode: "solo" }).success).toBe(false);
  });
});
