import { describe, it, expect } from "vitest";
import { createHabitSchema, habitDate, isCompleted, localDateInTimezone } from "./validation";

describe("habit completion and local dates", () => {
  it("supports check, count and duration targets", () => {
    expect(isCompleted("CHECK", 1, 1)).toBe(true);
    expect(isCompleted("CHECK", 1, 0)).toBe(false);
    expect(isCompleted("COUNT", 8, 7)).toBe(false);
    expect(isCompleted("DURATION", 20, 20)).toBe(true);
  });
  it("uses timezone local day without rewriting stored dates", () => {
    const timestamp = new Date("2026-11-18T23:30:00.000Z");
    expect(localDateInTimezone(timestamp, "Africa/Lagos")).toBe("2026-11-19");
    expect(localDateInTimezone(timestamp, "UTC")).toBe("2026-11-18");
  });
  it("rejects dates that do not exist", () => {
    expect(habitDate.safeParse("2026-02-30").success).toBe(false);
    expect(habitDate.safeParse("2026-02-28").success).toBe(true);
  });
  it("rejects forged ownership fields", () => {
    expect(createHabitSchema.safeParse({ name: "Read", ownerId: "other" }).success).toBe(false);
  });
});
