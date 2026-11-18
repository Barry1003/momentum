import { describe, expect, it } from "vitest";
import { addDays, currentRun, isScheduledOn, weekdayOf } from "./habitRules";

const everyDay = { scheduleDays: [0, 1, 2, 3, 4, 5, 6], targetCount: 1 };

describe("habit rules", () => {
  it("knows weekdays, Monday first", () => {
    expect(weekdayOf("2026-11-16")).toBe(0);
    expect(weekdayOf("2026-11-22")).toBe(6);
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("never schedules paused or not-yet-started days", () => {
    const habit = { ...everyDay, startsOn: "2026-11-19", pausedFrom: "2026-11-25", pausedUntil: "2026-12-01" };
    expect(isScheduledOn(habit, "2026-11-18")).toBe(false);
    expect(isScheduledOn(habit, "2026-11-19")).toBe(true);
    expect(isScheduledOn(habit, "2026-11-28")).toBe(false);
    expect(isScheduledOn(habit, "2026-12-02")).toBe(true);
  });

  it("counts a run back from today, skipping rest days", () => {
    const monWedFri = { scheduleDays: [0, 2, 4], targetCount: 1 };
    const history = { "2026-11-18": 1, "2026-11-16": 1, "2026-11-13": 1, "2026-11-11": 0 };
    expect(currentRun(monWedFri, history, "2026-11-18")).toBe(3);
  });

  it("does not break the run just because today is not done yet", () => {
    const history = { "2026-11-17": 1, "2026-11-16": 1 };
    expect(currentRun(everyDay, history, "2026-11-18")).toBe(2);
  });

  it("needs the full target for a day to count", () => {
    const water = { ...everyDay, targetCount: 8 };
    expect(currentRun(water, { "2026-11-18": 8, "2026-11-17": 5 }, "2026-11-18")).toBe(1);
  });
});
