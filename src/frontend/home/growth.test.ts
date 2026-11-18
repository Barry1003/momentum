import { describe, expect, it } from "vitest";
import { dateKicker, greetingFor, growthBarPosition, nextStageLabel, stageLabel } from "./growth";

describe("home growth helpers", () => {
  it("names the current and next stage", () => {
    expect(stageLabel("teen")).toBe("Teen");
    expect(nextStageLabel("teen")).toBe("Young Adult");
    expect(nextStageLabel("adult")).toBeNull();
  });

  it("places the growth bar between the current and next stage dot", () => {
    const position = growthBarPosition("teen", 1260, 1600);
    expect(position).toBeGreaterThan(0.5);
    expect(position).toBeLessThan(0.75);
    expect(growthBarPosition("adult", 9999, null)).toBe(1);
  });

  it("greets by time of day", () => {
    expect(greetingFor(new Date(2026, 10, 17, 8))).toBe("Good morning");
    expect(greetingFor(new Date(2026, 10, 17, 14))).toBe("Good afternoon");
    expect(greetingFor(new Date(2026, 10, 17, 20))).toBe("Good evening");
  });

  it("formats the date kicker like the design", () => {
    expect(dateKicker(new Date(2026, 10, 17))).toMatch(/^TUESDAY · 17 NOVEMBER$/);
  });
});
