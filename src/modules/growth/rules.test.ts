import { describe, expect, it } from "vitest";
import { checkSlot, quadrantOf, reviewWindow, rhythmForMinutes, suggestedAreas } from "./rules";
import { acceptSchema, gridActionInputSchema, reviewSchema } from "./validation";

describe("growth rules", () => {
  it("picks a rhythm from minutes", () => {
    expect(rhythmForMinutes(20)).toBe("daily");
    expect(rhythmForMinutes(90)).toBe("weekly");
    expect(rhythmForMinutes(240)).toBe("monthly");
  });
  it("quotes the person's own words for suggested areas", () => {
    const areas = suggestedAreas({ "q-1": "I spend before I plan." });
    expect(areas.find((area) => area.name === "Money")?.quote).toBe("I spend before I plan.");
    expect(areas.find((area) => area.name === "Skills")?.quote).toBeNull();
  });
});

describe("slots", () => {
  const blocks = [{ title: "Gym", from: "17:30", to: "18:30" }];
  it("finds clashes and suggests another time", () => {
    const clash = checkSlot(blocks, "17:45", 25);
    expect(clash.ok).toBe(false);
    expect(clash.reason).toBe("conflict");
    expect(clash.suggestion).toBe("07:00");
    expect(checkSlot(blocks, "09:00", 25).ok).toBe(true);
    expect(checkSlot(blocks, "23:50", 25).reason).toBe("invalid");
    expect(checkSlot(blocks, "9am", 25).reason).toBe("invalid");
  });
  it("maps stored quadrants and sensible defaults", () => {
    expect(quadrantOf({ quadrant: "LEAVE", dueTime: null, priority: "HIGH" })).toBe("leaveRoom");
    expect(quadrantOf({ quadrant: null, dueTime: "09:00", priority: "LOW" })).toBe("doNext");
    expect(quadrantOf({ quadrant: null, dueTime: null, priority: "LOW" })).toBe("reconsider");
  });
});

describe("review windows", () => {
  it("opens after the first 15 days and moves in 15-day steps", () => {
    expect(reviewWindow("2026-11-01", "2026-11-05").opensInDays).toBe(11);
    const first = reviewWindow("2026-11-01", "2026-11-16");
    expect(first.cycle).toBe(1);
    expect(first.from).toBe("2026-11-01");
    expect(first.to).toBe("2026-11-15");
    expect(first.opensInDays).toBe(0);
    expect(reviewWindow("2026-11-01", "2026-12-01").cycle).toBe(2);
  });
});

describe("growth validation", () => {
  it("rejects extra fields and bad values", () => {
    expect(gridActionInputSchema.safeParse({ id: null, areaId: "a-1", title: "Read", minutes: 20, addAs: "habit", rhythm: "daily" }).success).toBe(true);
    expect(gridActionInputSchema.safeParse({ id: null, areaId: "a-1", title: "Read", minutes: 601, addAs: "habit", rhythm: "daily" }).success).toBe(false);
    expect(acceptSchema.safeParse({ as: "habit", habit: { days: [], targetMinutes: 20, reminderTime: null } }).success).toBe(false);
    expect(reviewSchema.safeParse({ obstacles: ["Boredom"], context: "", changes: [], finish: true }).success).toBe(false);
  });
});
